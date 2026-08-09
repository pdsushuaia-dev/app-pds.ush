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
    <div className="rounded-xl border border-dashed border-neutral-300 p-8 dark:border-neutral-700">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-semibold">{title}</h2>
        {week ? (
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500 dark:bg-neutral-800">
            Semana {week}
          </span>
        ) : null}
      </div>
      {description ? (
        <p className="mt-2 max-w-prose text-sm text-neutral-500">{description}</p>
      ) : null}
      <p className="mt-4 text-xs text-neutral-400">Pendiente de implementar.</p>
    </div>
  );
}
