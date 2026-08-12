export default function PagosPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold">Pagos</h1>
        <p className="mt-1 text-sm text-muted">
          Tu membresía y el estado de tus pagos.
        </p>
      </header>

      <div className="card flex flex-col items-center gap-3 p-8 text-center">
        <span className="text-4xl">💳</span>
        <h2 className="text-lg font-semibold">Pago online en camino</h2>
        <p className="max-w-sm text-sm text-muted">
          Muy pronto vas a poder pagar tu membresía desde acá con un link de
          MercadoPago, en un par de clics. Por ahora, coordinás el pago con el
          equipo de PDS.
        </p>
        <span className="badge-brand mt-1">Próximamente</span>
      </div>
    </div>
  );
}
