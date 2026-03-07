// app/dashboard/page.tsx
import Link from "next/link";
import { Users, Shuffle, Trophy, ArrowRight, Activity } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const revalidate = 0;

async function getStats() {
  try {
    const total = await prisma.player.count();
    const captains = await prisma.player.count({ where: { isCaptain: true } });
    const avgLevel = await prisma.player.aggregate({ _avg: { level: true } });
    return {
      total,
      captains,
      avgLevel: avgLevel._avg.level?.toFixed(1) ?? "—",
    };
  } catch {
    return { total: 0, captains: 0, avgLevel: "—" };
  }
}

export default async function DashboardPage() {
  const stats = await getStats();

  return (
    <div className="p-8 animate-fade-in">
      {/* Hero */}
      <div className="mb-10">
        <div className="font-display text-6xl text-[var(--gold)] gold-glow mb-2">BEM-VINDO</div>
        <p className="text-[var(--text-muted)] text-lg">Sistema de sorteio equilibrado de times de vôlei</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-10 stagger-children">
        {[
          {
            label: "Jogadores",
            value: stats.total,
            icon: Users,
            color: "text-blue-400",
          },
          {
            label: "Capitães",
            value: stats.captains,
            icon: Trophy,
            color: "text-[var(--gold)]",
          },
          {
            label: "Nível Médio",
            value: stats.avgLevel,
            icon: Activity,
            color: "text-green-400",
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass-card rounded-2xl p-6 animate-fade-in">
            <div className={`${color} mb-3`}>
              <Icon size={24} />
            </div>
            <div className="font-display text-4xl text-[var(--text-primary)] mb-1">{value}</div>
            <div className="text-sm text-[var(--text-muted)]">{label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link href="/players">
          <div className="glass-card rounded-2xl p-6 hover:border-[var(--gold)] border border-transparent transition-all duration-300 cursor-pointer group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Users size={24} className="text-blue-400" />
              </div>
              <ArrowRight
                size={18}
                className="text-[var(--text-muted)] group-hover:text-[var(--gold)] group-hover:translate-x-1 transition-all"
              />
            </div>
            <div className="font-display text-2xl mb-1">JOGADORES</div>
            <p className="text-sm text-[var(--text-muted)]">Cadastre e gerencie sua lista de jogadores</p>
          </div>
        </Link>

        <Link href="/draw">
          <div className="glass-card rounded-2xl p-6 hover:border-[var(--gold)] border border-transparent transition-all duration-300 cursor-pointer group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-[var(--gold)]/20 flex items-center justify-center">
                <Shuffle size={24} className="text-[var(--gold)]" />
              </div>
              <ArrowRight
                size={18}
                className="text-[var(--text-muted)] group-hover:text-[var(--gold)] group-hover:translate-x-1 transition-all"
              />
            </div>
            <div className="font-display text-2xl mb-1">SORTEIO</div>
            <p className="text-sm text-[var(--text-muted)]">Gere times equilibrados automaticamente</p>
          </div>
        </Link>
      </div>

      {/* How it works */}
      <div className="mt-10 glass-card rounded-2xl p-6">
        <div className="font-display text-xl text-[var(--gold)] mb-4">COMO FUNCIONA</div>
        <div className="grid grid-cols-3 gap-6">
          {[
            {
              step: "01",
              title: "Cadastre",
              desc: "Adicione jogadores com nome, nível e posição",
            },
            {
              step: "02",
              title: "Selecione",
              desc: "Escolha quem vai participar do sorteio",
            },
            {
              step: "03",
              title: "Sorteie",
              desc: "O algoritmo cria times equilibrados automaticamente",
            },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex gap-4">
              <div className="font-display text-3xl text-[var(--court-line)] shrink-0">{step}</div>
              <div>
                <div className="font-semibold text-[var(--text-primary)] mb-1">{title}</div>
                <div className="text-sm text-[var(--text-muted)]">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
