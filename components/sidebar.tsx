import { getPositionsWithInterviews } from "@/lib/queries";
import type { SidebarPosition } from "@/lib/types";
import { SidebarNav } from "./sidebar-nav";
import { getSession, isAdmin } from "@/lib/auth";

export async function Sidebar() {
  const session = await getSession();
  const admin = session ? isAdmin(session.email) : false;
  let positions: SidebarPosition[] = [];
  let dbError = false;

  try {
    positions = await getPositionsWithInterviews(session);
  } catch {
    dbError = true;
  }

  return (
    <aside className="hidden md:block w-64 shrink-0 border-r border-[color:var(--border)]">
      <div className="sticky top-14 max-h-[calc(100vh-3.5rem)] overflow-y-auto scrollbar-thin px-3 py-5">
        {dbError ? (
          <div className="rounded-md border border-[color:var(--warning)]/40 bg-[color:var(--warning)]/10 px-3 py-3 text-xs text-[color:var(--warning)] leading-relaxed">
            No se pudo conectar a la base de datos. Revisa{" "}
            <code className="font-mono">DATABASE_URL</code> en{" "}
            <code className="font-mono">.env</code>.
          </div>
        ) : (
          <SidebarNav positions={positions} isAdmin={admin} />
        )}
      </div>
    </aside>
  );
}
