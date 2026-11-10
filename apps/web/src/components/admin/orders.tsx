export const STATUS: Record<string, { label: string; cls: string }> = {
  nuevo: { label: 'Nuevo', cls: 'bg-ink text-bg' },
  contactado: { label: 'Contactado', cls: 'bg-pink text-ink' },
  confirmado: { label: 'Confirmado', cls: 'bg-[#dfeadf] text-ink' },
  enviado: { label: 'Enviado', cls: 'bg-[#dde6f0] text-ink' },
  entregado: { label: 'Entregado', cls: 'bg-surface text-ink' },
  cancelado: { label: 'Cancelado', cls: 'bg-line text-muted line-through' },
};
export function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status] ?? { label: status, cls: 'bg-surface' };
  return <span className={`label shrink-0 rounded-full px-2.5 py-1.5 text-[0.575rem] ${s.cls}`}>{s.label}</span>;
}
