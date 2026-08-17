import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Las fotos del perro se suben a través de un Server Action y el
      // límite por defecto es 1 MB — las fotos de celular pesan 2–5 MB y
      // eran rechazadas antes de llegar a subirse. Lo subimos a 8 MB para
      // dar holgura sobre el tope de 5 MB que valida `dogs.ts`.
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
