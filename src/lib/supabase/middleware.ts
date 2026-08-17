import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/types/database";

// Prefijos protegidos y el rol requerido para cada uno.
const ROLE_PREFIXES: {
  prefix: string;
  role: "client" | "walker" | "admin" | "bather";
}[] = [
  { prefix: "/cliente", role: "client" },
  { prefix: "/paseador", role: "walker" },
  { prefix: "/banador", role: "bather" },
  { prefix: "/admin", role: "admin" },
];

/**
 * Refresca la sesión de Supabase y protege rutas por rol.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const match = ROLE_PREFIXES.find((r) => path.startsWith(r.prefix));

  if (match) {
    // Ruta protegida: exige sesión.
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", path);
      return NextResponse.redirect(url);
    }

    // Verifica rol contra el prefijo.
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    const profile = data as {
      role: "client" | "walker" | "admin" | "bather";
    } | null;

    if (profile && profile.role !== match.role) {
      const dest =
        profile.role === "client"
          ? "cliente"
          : profile.role === "walker"
            ? "paseador"
            : profile.role === "bather"
              ? "banador"
              : "admin";
      const url = request.nextUrl.clone();
      url.pathname = `/${dest}`;
      return NextResponse.redirect(url);
    }
  }

  return response;
}
