import { Controller, Get, Inject, Query, UseGuards } from '@nestjs/common';
import { and, asc, eq, gte, inArray, lt, sql } from 'drizzle-orm';
import { DB, Db, schema } from '../db/db';
import { InternalGuard } from './internal.guard';
import { UpcomingItem, baDay, baLocal, bump, emptySeries, parseLimit, parseRange, sortUpcoming, totalsOf } from './internal.util';

/**
 * Módulo /internal de Under Clothing (panel central). Solo lectura.
 * Contrato: GET /api/internal/health · /api/internal/metrics?desde=&hasta= · /api/internal/upcoming?limite=
 * Contrato completo y cómo sumar un proyecto: README del repo panel-dios.
 *
 * Hacia el panel salen cantidades, montos, estados y códigos de pedido: no datos de clientes.
 */
const { orders, products } = schema;
const SERVICE = 'under';
const { version } = require('../../package.json') as { version: string };

/** Contadores de la serie diaria. «ingresos» suma en pesos los pedidos confirmados, enviados o entregados. */
const COUNTERS = ['pedidos', 'consultas', 'ingresos', 'pedidosEntregados', 'productos'] as const;
/** Qué contadores propios alimentan cada contador común del panel */
const COMMON = { publicaciones: ['productos'], consultas: ['consultas'], ventas: ['pedidos'], visitas: [] };
const SOLD = new Set(['confirmado', 'enviado', 'entregado']);
const OPEN = ['nuevo', 'contactado', 'confirmado', 'enviado'];

@Controller('internal')
@UseGuards(InternalGuard)
export class InternalController {
  constructor(@Inject(DB) private db: Db) {}

  @Get('health')
  async health() {
    let db: 'up' | 'down' = 'up';
    try {
      await this.db.execute(sql`SELECT 1`);
    } catch {
      db = 'down';
    }
    return { ok: db === 'up', service: SERVICE, version, uptime: Math.round(process.uptime()), db, now: new Date().toISOString() };
  }

  @Get('metrics')
  async metrics(@Query() query: Record<string, unknown>) {
    const range = parseRange(query);
    const [creados, entregados, publicados] = await Promise.all([
      this.db
        .select({ createdAt: orders.createdAt, kind: orders.kind, status: orders.status, total: orders.total })
        .from(orders)
        .where(and(gte(orders.createdAt, range.from), lt(orders.createdAt, range.to))),
      // No hay fecha de entrega: se toma la última modificación del pedido entregado
      this.db
        .select({ updatedAt: orders.updatedAt })
        .from(orders)
        .where(and(eq(orders.kind, 'pedido'), eq(orders.status, 'entregado'), gte(orders.updatedAt, range.from), lt(orders.updatedAt, range.to))),
      this.db
        .select({ publishedAt: products.publishedAt })
        .from(products)
        .where(and(eq(products.visible, true), gte(products.publishedAt, range.from), lt(products.publishedAt, range.to))),
    ]);

    const series = emptySeries(range, COUNTERS);
    const pedidosPorEstado: Record<string, number> = {};
    for (const o of creados) {
      const day = baDay(o.createdAt);
      if (o.kind === 'consulta') {
        bump(series, day, 'consultas');
        continue;
      }
      pedidosPorEstado[o.status] = (pedidosPorEstado[o.status] ?? 0) + 1;
      if (o.status === 'cancelado') continue;
      bump(series, day, 'pedidos');
      if (SOLD.has(o.status)) bump(series, day, 'ingresos', o.total ?? 0);
    }
    entregados.forEach((o) => bump(series, baDay(o.updatedAt), 'pedidosEntregados'));
    publicados.forEach((p) => bump(series, baDay(p.publishedAt), 'productos'));

    return {
      service: SERVICE,
      desde: range.desde,
      hasta: range.hasta,
      totals: { ...totalsOf(series, COUNTERS), pedidosPorEstado },
      common: COMMON,
      series: [...series.values()],
      byProperty: [],
    };
  }

  /** La tienda no agenda nada a futuro: lo que hay son pedidos y consultas abiertos */
  @Get('upcoming')
  async upcoming(@Query() query: Record<string, unknown>) {
    const limite = parseLimit(query);
    const abiertos = await this.db
      .select({ code: orders.code, kind: orders.kind, status: orders.status, createdAt: orders.createdAt })
      .from(orders)
      .where(inArray(orders.status, OPEN))
      .orderBy(asc(orders.createdAt))
      .limit(limite);
    const items: UpcomingItem[] = abiertos.map((o) => ({
      kind: o.kind === 'consulta' ? 'consulta' : 'pedido',
      title: `${o.kind === 'consulta' ? 'Consulta' : 'Pedido'} ${o.code}`,
      date: baLocal(o.createdAt),
      pending: true,
      who: '',
      status: o.status,
      propertyId: null,
      ref: o.code,
    }));
    return { service: SERVICE, generatedAt: new Date().toISOString(), items: sortUpcoming(items) };
  }
}
