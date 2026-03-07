// app/dashboard/layout.tsx
import Link from "next/link";
import { Activity, Users, Shuffle, Trophy } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Início", icon: Trophy },
  { href: "/players", label: "Jogadores", icon: Users },
  { href: "/draw", label: "Sorteio", icon: Shuffle },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="court-bg min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 glass-card border-r border-[var(--border)] flex flex-col fixed h-full z-10">
        {/* Logo */}
        <div className="p-6 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--gold)] flex items-center justify-center">
              <Activity size={20} className="text-[var(--dark)]" />
            </div>
            <div>
              <div className="font-display text-2xl text-[var(--gold)] gold-glow leading-none">SOOS</div>
              <div className="text-xs text-[var(--text-muted)] tracking-widest uppercase">ruins</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[rgba(45,106,79,0.3)] transition-all duration-200 group"
            >
              <Icon size={18} className="group-hover:text-[var(--gold)] transition-colors" />
              <span className="font-medium">{label}</span>
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border)]">
          <p className="text-xs text-[var(--text-muted)] text-center">🏐 Vôlei Equilibrado</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64 min-h-screen">{children}</main>
    </div>
  );
}
