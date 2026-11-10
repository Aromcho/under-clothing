import { BadRequestException, Body, Controller, Delete, Get, Inject, NotFoundException, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { AuthGuard, CurrentUser, Roles, SessionUser } from '../auth/auth';
import { DB, Db, schema } from '../db/db';
import { ActivityLog, Revalidator } from '../common/services';
import { loadProducts } from '../products/products';

const { orders, variants } = schema;
export const ORDER_STATUSES = ['nuevo', 'contactado', 'confirmado', 'enviado', 'entregado', 'cancelado'] as const;
const TAKES_STOCK = new Set(['confirmado', 'enviado', 'entregado']);

const money = (n: number) => '$' + n.toLocaleString('es-AR');

const createBody = z.object({
  kind: z.enum(['pedido', 'consulta']).default('pedido'),
  customerName: z.string().trim().min(2, 'Decinos tu nombre').max(80),
  phone: z.string().trim().max(40).default(''),
  delivery: z.enum(['retiro', 'envio']).default('retiro'),
  address: z.string().trim().max(200).default(''),
  message: z.string().trim().max(600).default(''),
  items: z.array(z.object({ productId: z.number().int(), variantId: z.number().int().nullable().optional(), qty: z.number().int().min(1).max(20) })).max(40).default([]),
});

@Controller()
export class OrdersController {
  constructor(@Inject(DB) private db: Db, private rv: Revalidator, private log: ActivityLog) {}

  /** Público: guarda el pedido y devuelve el mensaje listo para WhatsApp. */
  @Post('public/orders')
  async create(@Body() b: unknown) {
    const r = createBody.safeParse(b);
    if (!r.success) throw new BadRequestException(r.error.issues[0]?.message ?? 'Datos inválidos');
    const d = r.data;
    if (d.kind === 'pedido' && !d.items.length) throw new BadRequestException('El carrito está vacío');
    if (d.kind === 'consulta' && !d.message) throw new BadRequestException('Escribí tu consulta');
    const catalog = await loadProducts(this.db, { onlyVisible: true });
    const items: schema.OrderItem[] = d.items.map((it) => {
      const p = catalog.find((x) => x.id === it.productId);
      if (!p) throw new BadRequestException('Una de las prendas ya no está disponible');
      const v = it.variantId ? p.variants.find((x) => x.id === it.variantId) : null;
      if (it.variantId && !v) throw new BadRequestException(`El talle/color elegido de ${p.name} ya no está disponible`);
      const img = p.images[0];
      return {
        productId: p.id, variantId: v?.id ?? null, name: p.name, slug: p.slug, size: v?.size ?? '', color: v?.color ?? '',
        qty: it.qty, price: p.price, image: img ? `${img.path}/${img.widths[0]}.webp` : null,
      };
    });
    const allPriced = items.length > 0 && items.every((i) => i.price != null);
    const total = allPriced ? items.reduce((s, i) => s + (i.price as number) * i.qty, 0) : null;
    const code = 'UC-' + Date.now().toString(36).slice(-4).toUpperCase() + Math.floor(Math.random() * 36).toString(36).toUpperCase();
    const [row] = await this.db.insert(orders).values({ ...d, items, total, code }).returning();

    const lines = [d.kind === 'pedido' ? `¡Hola Under! 🤍 Quiero hacer este pedido (${code}):` : `¡Hola Under! 🤍 Tengo una consulta (${code}):`, ''];
    for (const i of items) {
      const opts = [i.size && `Talle ${i.size}`, i.color].filter(Boolean).join(' · ');
      lines.push(`• ${i.qty} × ${i.name}${opts ? ` (${opts})` : ''}${i.price != null ? ` — ${money(i.price * i.qty)}` : ''}`);
    }
    if (items.length) lines.push('');
    if (total != null) lines.push(`Total: ${money(total)}`);
    else if (items.length) lines.push('Precio: a confirmar');
    if (d.kind === 'pedido') lines.push(d.delivery === 'envio' ? `Entrega: envío${d.address ? ` a ${d.address}` : ''}` : 'Entrega: retiro por el local');
    lines.push(`Nombre: ${d.customerName}`);
    if (d.message) lines.push('', d.message);
    return { code: row.code, message: lines.join('\n') };
  }

  @Get('admin/orders')
  @UseGuards(AuthGuard)
  list() { return this.db.select().from(orders).orderBy(desc(orders.createdAt)); }

  @Patch('admin/orders/:id')
  @UseGuards(AuthGuard)
  async update(@Param('id', ParseIntPipe) id: number, @Body() b: { status?: string; note?: string }, @CurrentUser() u: SessionUser) {
    const [o] = await this.db.select().from(orders).where(eq(orders.id, id));
    if (!o) throw new NotFoundException();
    const set: Partial<typeof orders.$inferInsert> = { updatedAt: new Date() };
    let stockChanged = false;
    if (b.status && b.status !== o.status) {
      if (!ORDER_STATUSES.includes(b.status as any)) throw new BadRequestException('Estado inválido');
      set.status = b.status;
      // El stock se descuenta al confirmar y se repone si se cancela
      const should = TAKES_STOCK.has(b.status);
      if (should !== o.stockApplied) {
        for (const it of o.items) {
          if (!it.variantId) continue;
          await this.db.update(variants).set({ stock: sql`GREATEST(0, ${variants.stock} ${sql.raw(should ? '-' : '+')} ${it.qty})` }).where(eq(variants.id, it.variantId));
        }
        set.stockApplied = should;
        stockChanged = true;
      }
      await this.log.add(u.name, `marcó como ${b.status}`, o.kind, `${o.code} · ${o.customerName}`);
    }
    if (b.note?.trim()) set.notes = [...o.notes, { at: new Date().toISOString(), by: u.name, text: b.note.trim() }];
    const [row] = await this.db.update(orders).set(set).where(eq(orders.id, id)).returning();
    if (stockChanged) await this.rv.tags('products');
    return row;
  }

  @Delete('admin/orders/:id')
  @UseGuards(AuthGuard)
  @Roles('admin')
  async remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() u: SessionUser) {
    const [row] = await this.db.delete(orders).where(eq(orders.id, id)).returning();
    if (!row) throw new NotFoundException();
    await this.log.add(u.name, 'eliminó', row.kind, row.code);
    return { ok: true };
  }
}
