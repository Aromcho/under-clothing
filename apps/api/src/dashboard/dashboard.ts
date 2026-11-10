import { Controller, Get, Inject, UseGuards } from '@nestjs/common';
import { desc } from 'drizzle-orm';
import { AuthGuard } from '../auth/auth';
import { DB, Db, schema } from '../db/db';
import { loadProducts } from '../products/products';

@Controller('admin/dashboard')
@UseGuards(AuthGuard)
export class DashboardController {
  constructor(@Inject(DB) private db: Db) {}

  @Get()
  async get() {
    const [products, orders, activity, mediaRows] = await Promise.all([
      loadProducts(this.db),
      this.db.select().from(schema.orders).orderBy(desc(schema.orders.createdAt)),
      this.db.select().from(schema.activity).orderBy(desc(schema.activity.createdAt)).limit(14),
      this.db.select({ id: schema.media.id }).from(schema.media),
    ]);
    const weekAgo = Date.now() - 7 * 864e5;
    const byStatus: Record<string, number> = {};
    for (const o of orders) byStatus[o.status] = (byStatus[o.status] ?? 0) + 1;
    const days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(Date.now() - (13 - i) * 864e5);
      const key = d.toISOString().slice(0, 10);
      return { day: key, count: orders.filter((o) => o.createdAt.toISOString().slice(0, 10) === key).length };
    });
    const stockOf = (p: (typeof products)[number]) => p.variants.reduce((s, v) => s + v.stock, 0);
    return {
      counts: {
        products: products.length,
        visible: products.filter((p) => p.visible).length,
        noPrice: products.filter((p) => p.price == null).length,
        noStock: products.filter((p) => stockOf(p) === 0).length,
        media: mediaRows.length,
        orders: orders.length,
        newOrders: byStatus['nuevo'] ?? 0,
        ordersWeek: orders.filter((o) => o.createdAt.getTime() > weekAgo).length,
      },
      byStatus,
      days,
      recentOrders: orders.slice(0, 6),
      lowStock: products
        .flatMap((p) => p.variants.filter((v) => v.stock > 0 && v.stock <= 1).map((v) => ({ productId: p.id, name: p.name, size: v.size, color: v.color, stock: v.stock })))
        .slice(0, 8),
      activity,
    };
  }
}
