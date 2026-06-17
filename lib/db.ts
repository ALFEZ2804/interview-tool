import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Singleton para evitar agotar conexiones con el hot-reload de `next dev`:
// en desarrollo cada recompilación re-ejecuta este módulo, así que cacheamos
// el cliente en globalThis.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// pg-connection-string deprecará tratar 'prefer'/'require'/'verify-ca' como
// 'verify-full' (cambio de semántica en pg v9). Lo hacemos explícito para
// conservar EXACTAMENTE el comportamiento actual y silenciar el warning, sin
// tocar la env var (sirve igual en local y en Vercel).
function connectionString(): string | undefined {
  const raw = process.env.DATABASE_URL;
  if (!raw) return raw;
  try {
    const url = new URL(raw);
    const mode = url.searchParams.get("sslmode");
    if (mode && ["prefer", "require", "verify-ca"].includes(mode)) {
      url.searchParams.set("sslmode", "verify-full");
    }
    return url.toString();
  } catch {
    return raw;
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({
      connectionString: connectionString(),
    }),
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
