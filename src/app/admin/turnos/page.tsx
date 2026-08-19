import { redirect } from "next/navigation";

// Modelo marketplace: el admin ya no asigna turnos (lo maneja el cliente con el
// paseador). Dejamos esta ruta redirigiendo al dashboard por si quedó algún
// link viejo apuntando acá.
export default function AdminTurnosRedirect() {
  redirect("/admin");
}
