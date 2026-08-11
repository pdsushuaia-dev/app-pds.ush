/**
 * Placeholder de sección: marca una pantalla pendiente de implementar.
 * Se irá reemplazando feature por feature según el cronograma.
 */
export function Placeholder({
  title,
  description,
  week,
}: {
  title: string;
  description?: string;
  week?: number;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border p-8">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-semibold text-fg">{title}</h2>
        {week ? (
          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-muted">
            Semana {week}
          </span>
        ) : null}
      </div>
      {description ? (
        <p className="mt-2 max-w-prose text-sm text-muted">{description}</p>
      ) : null}
      <p className="mt-4 text-xs text-muted">Pendiente de implementar.</p>
    </div>
  );
}
