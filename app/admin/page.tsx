import { redirect } from "next/navigation";
import { getSession, isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isAdmin(session.email)) redirect("/");

  let accounts: { email: string; createdAt: Date; ingestSince: Date }[] = [];
  try {
    accounts = await prisma.googleAccount.findMany({
      orderBy: { createdAt: "asc" },
      select: { email: true, createdAt: true, ingestSince: true },
    });
  } catch {
    // Sin BD la página sigue cargando vacía.
  }

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <div className="text-[11px] uppercase tracking-wide text-[color:var(--accent)] font-semibold">
          Administración
        </div>
        <h1 className="text-3xl font-semibold tracking-tight gradient-text">
          Cuentas conectadas
        </h1>
        <p className="text-sm text-[color:var(--muted)]">
          Cuentas de Google que alimentan la herramienta vía OAuth (solo lectura
          de Drive).
        </p>
      </section>

      {accounts.length === 0 ? (
        <p className="text-sm text-[color:var(--muted)]">
          No hay cuentas conectadas todavía.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[color:var(--border)]">
          <table className="w-full text-sm">
            <thead className="text-left text-[color:var(--muted-2)]">
              <tr className="border-b border-[color:var(--border)]">
                <th className="px-4 py-2 font-medium">Cuenta</th>
                <th className="px-4 py-2 font-medium">Conectada</th>
                <th className="px-4 py-2 font-medium">Histórico desde</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <tr
                  key={a.email}
                  className="border-b border-[color:var(--border)] last:border-0"
                >
                  <td className="px-4 py-2">{a.email}</td>
                  <td className="px-4 py-2 text-[color:var(--muted)]">
                    {fmt(a.createdAt)}
                  </td>
                  <td className="px-4 py-2 text-[color:var(--muted)]">
                    {fmt(a.ingestSince)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function fmt(d: Date) {
  return new Date(d).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
