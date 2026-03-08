// components/DrawClient.tsx
"use client";

import { useState, useRef } from "react";
import { Crown, Shuffle, Copy, Camera, Check, AlertCircle, ChevronDown, ChevronUp, Users } from "lucide-react";
import { Player, Team, DrawConfig } from "@/types";
import { generateTeams, teamsToText } from "@/lib/drawService";

const POSITION_COLORS: Record<string, string> = {
  levantador: "text-yellow-400",
  libero: "text-purple-400",
  ponteiro: "text-blue-400",
  central: "text-green-400",
  oposto: "text-red-400",
  universal: "text-gray-400",
};

function PlayerCard({ player, selected, onToggle }: { player: Player; selected: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`w-full text-left p-3 rounded-xl border transition-all duration-200 ${
        selected
          ? player.isCaptain
            ? "border-[var(--gold)] bg-[var(--gold)]/10 captain-pulse"
            : "border-[var(--court-line)] bg-[var(--court-line)]/20"
          : "border-[var(--border)] bg-transparent opacity-50 hover:opacity-75"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
              selected ? "bg-[var(--gold)] border-[var(--gold)]" : "border-[var(--text-muted)]"
            }`}
          >
            {selected && <Check size={10} className="text-[var(--dark)]" />}
          </div>

          {player.isCaptain && <Crown size={12} className="text-[var(--gold)] shrink-0" />}
          <span className="text-sm font-medium text-[var(--text-primary)] truncate">{player.name}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs capitalize ${POSITION_COLORS[player.position] || "text-[var(--text-muted)]"}`}>
            {player.position}
          </span>
          <span className="text-xs font-bold text-[var(--gold)] bg-[var(--gold)]/10 px-1.5 py-0.5 rounded">{player.level}</span>
        </div>
      </div>
    </button>
  );
}

function TeamCard({ team, index }: { team: Team; index: number }) {
  const colors = [
    { ring: "ring-blue-500/40", title: "text-blue-400", bg: "bg-blue-500/5" },
    {
      ring: "ring-orange-500/40",
      title: "text-orange-400",
      bg: "bg-orange-500/5",
    },
    {
      ring: "ring-green-500/40",
      title: "text-green-400",
      bg: "bg-green-500/5",
    },
    { ring: "ring-pink-500/40", title: "text-pink-400", bg: "bg-pink-500/5" },
    {
      ring: "ring-purple-500/40",
      title: "text-purple-400",
      bg: "bg-purple-500/5",
    },
    { ring: "ring-cyan-500/40", title: "text-cyan-400", bg: "bg-cyan-500/5" },
  ];
  const c = colors[index % colors.length];

  const allPlayers = [team.captain, ...team.players];

  return (
    <div
      className={`glass-card rounded-2xl overflow-hidden ring-1 ${c.ring} animate-fade-in ${c.bg}`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Header */}
      <div className="p-5 border-b border-[var(--border)]">
        <div className="flex items-center justify-between mb-3">
          <div className={`font-display text-2xl ${c.title} gold-glow`}>{team.name.toUpperCase()}</div>
          <div className="text-right">
            <div className="text-xs text-[var(--text-muted)]">Nível Total</div>
            <div className={`font-display text-2xl ${c.title}`}>{team.totalLevel}</div>
          </div>
        </div>

        {/* Level bar */}
        <div className="h-1.5 bg-[var(--court-line)]/20 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min((team.totalLevel / 70) * 100, 100)}%`,
              background: `linear-gradient(90deg, var(--court-line), var(--gold))`,
            }}
          />
        </div>
      </div>

      {/* Captain */}
      <div className="px-5 py-3 border-b border-[var(--border)]/50 bg-[var(--gold)]/5">
        <div className="flex items-center gap-2">
          <Crown size={14} className="text-[var(--gold)]" />
          <span className="text-xs text-[var(--gold)] font-semibold uppercase tracking-wider">Capitão</span>
        </div>
        <div className="mt-1 flex items-center justify-between">
          <span className="font-semibold text-[var(--text-primary)]">{team.captain.name}</span>
          <span className="text-xs text-[var(--gold)] font-bold">Nv. {team.captain.level}</span>
        </div>
      </div>

      {/* Players */}
      <div className="p-5 space-y-2">
        {team.players.map((player, i) => (
          <div
            key={player.id}
            className="flex items-center justify-between py-2 border-b border-[var(--border)]/30 last:border-0"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--text-muted)] w-5">{i + 1}.</span>
              <span className="text-sm text-[var(--text-primary)]">{player.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs capitalize ${POSITION_COLORS[player.position] || "text-[var(--text-muted)]"}`}>
                {player.position}
              </span>
              <span className="text-xs font-bold text-[var(--text-muted)]">{player.level}</span>
            </div>
          </div>
        ))}
        {team.players.length === 0 && (
          <p className="text-xs text-[var(--text-muted)] text-center py-2">Nenhum jogador além do capitão</p>
        )}
      </div>
    </div>
  );
}

export default function DrawClient({ players }: { players: Player[] }) {
  const [config, setConfig] = useState<DrawConfig>({
    numberOfTeams: 2,
    playersPerTeam: 6,
  });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showConfig, setShowConfig] = useState(true);
  const [drawMode, setDrawMode] = useState<"balanced" | "random">("balanced");
  const resultsRef = useRef<HTMLDivElement>(null);

  const togglePlayer = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(players.map((p) => p.id)));
  const selectNone = () => setSelected(new Set());
  const selectCaptains = () => setSelected(new Set(players.filter((p) => p.isCaptain).map((p) => p.id)));

  const handleDraw = () => {
    setError(null);
    const selectedPlayers = players.filter((p) => selected.has(p.id));
    try {
      const result = generateTeams(selectedPlayers, config, drawMode);
      setTeams(result);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro no sorteio");
    }
  };

  const handleCopy = async () => {
    if (!teams) return;
    await navigator.clipboard.writeText(teamsToText(teams));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCapture = async () => {
    if (!resultsRef.current) return;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(resultsRef.current, {
        backgroundColor: "#0d1f17",
        scale: 2,
      });
      const link = document.createElement("a");
      link.download = "soos-ruins-sorteio.png";
      link.href = canvas.toDataURL();
      link.click();
    } catch {
      alert("Erro ao capturar imagem");
    }
  };

  const captains = players.filter((p) => p.isCaptain);
  const selectedList = players.filter((p) => selected.has(p.id));
  const selectedCaptains = selectedList.filter((p) => p.isCaptain);

  const valid = drawMode === "random" ? selectedList.length >= config.numberOfTeams : selectedList.length >= config.numberOfTeams; // Relaxed constraint for balanced too as per improved logic
  // But maybe keep strict check if user wants?
  // Let's stick to simple "enough players for teams" check.
  // And warning about captains if in balanced mode can be visual, not blocking?
  // The previous code had: valid = selectedCaptains.length >= ...
  // I should enable button even if not marked captains, because auto-captain logic exists now.

  // Re-evaluating validation:
  const canDraw = selectedList.length >= config.numberOfTeams;

  return (
    <div className="p-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="font-display text-5xl text-[var(--gold)] gold-glow">SORTEIO</div>
        <p className="text-[var(--text-muted)] mt-1">Configure e realize o sorteio equilibrado de times</p>
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* Left panel */}
        <div className="col-span-2 space-y-4">
          {/* Config */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <button
              className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors"
              onClick={() => setShowConfig((v) => !v)}
            >
              <span className="font-display text-lg text-[var(--gold)]">CONFIGURAÇÃO</span>
              {showConfig ? (
                <ChevronUp size={16} className="text-[var(--text-muted)]" />
              ) : (
                <ChevronDown size={16} className="text-[var(--text-muted)]" />
              )}
            </button>

            {showConfig && (
              <div className="px-5 pb-5 space-y-4 border-t border-[var(--border)]">
                <div className="pt-4">
                  <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider block mb-2">Número de Times</label>
                  <div className="flex gap-2">
                    {[2, 3, 4, 5, 6].map((n) => (
                      <button
                        key={n}
                        onClick={() => setConfig((c) => ({ ...c, numberOfTeams: n }))}
                        className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                          config.numberOfTeams === n
                            ? "bg-[var(--gold)] text-[var(--dark)]"
                            : "glass-card text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider block mb-2">
                    Jogadores por Time
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <button
                        key={n}
                        onClick={() => setConfig((c) => ({ ...c, playersPerTeam: n }))}
                        className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                          config.playersPerTeam === n
                            ? "bg-[var(--gold)] text-[var(--dark)]"
                            : "glass-card text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider block mb-2">Modo de Sorteio</label>
                  <div className="flex gap-2 bg-[var(--court-line)]/5 rounded-lg p-1">
                    <button
                      onClick={() => setDrawMode("balanced")}
                      className={`flex-1 py-1.5 rounded text-xs font-semibold transition-all ${
                        drawMode === "balanced"
                          ? "bg-[var(--gold)] text-[var(--dark)]"
                          : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      Equilibrado
                    </button>
                    <button
                      onClick={() => setDrawMode("random")}
                      className={`flex-1 py-1.5 rounded text-xs font-semibold transition-all ${
                        drawMode === "random"
                          ? "bg-[var(--gold)] text-[var(--dark)]"
                          : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      Aleatório
                    </button>
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-[var(--court-line)]/10 rounded-xl p-3 text-xs text-[var(--text-muted)] space-y-1">
                  <div className="flex justify-between">
                    <span>Times:</span>
                    <span className="text-[var(--text-primary)]">{config.numberOfTeams}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Por time:</span>
                    <span className="text-[var(--text-primary)]">{config.playersPerTeam}</span>
                  </div>
                  <div className="flex justify-between border-t border-[var(--border)]/50 pt-1">
                    <span>Total necessário:</span>
                    <span className="text-[var(--gold)] font-semibold">{config.numberOfTeams * config.playersPerTeam}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Capitães necessários:</span>
                    <span className={selectedCaptains.length >= config.numberOfTeams ? "text-green-400" : "text-red-400"}>
                      {selectedCaptains.length}/{config.numberOfTeams}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Players list */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
              <span className="font-display text-lg text-[var(--gold)]">JOGADORES</span>
              <span className="text-sm text-[var(--text-muted)]">
                {selected.size}/{players.length}
              </span>
            </div>

            {/* Quick select */}
            <div className="flex gap-2 p-3 border-b border-[var(--border)]">
              <button
                onClick={selectAll}
                className="text-xs px-3 py-1.5 rounded-lg glass-card hover:text-[var(--gold)] transition-colors"
              >
                Todos
              </button>
              <button
                onClick={selectNone}
                className="text-xs px-3 py-1.5 rounded-lg glass-card hover:text-[var(--gold)] transition-colors"
              >
                Nenhum
              </button>
              <button
                onClick={selectCaptains}
                className="text-xs px-3 py-1.5 rounded-lg glass-card hover:text-[var(--gold)] transition-colors flex items-center gap-1"
              >
                <Crown size={10} /> Capitães
              </button>
            </div>

            {players.length === 0 ? (
              <div className="p-8 text-center">
                <Users size={32} className="mx-auto mb-2 text-[var(--court-line)]" />
                <p className="text-sm text-[var(--text-muted)]">Nenhum jogador cadastrado</p>
              </div>
            ) : (
              <div className="p-3 space-y-1.5 max-h-[400px] overflow-y-auto">
                {/* Captains first */}
                {captains.length > 0 && (
                  <>
                    <div className="text-xs text-[var(--gold)] uppercase tracking-wider px-1 py-1 flex items-center gap-1">
                      <Crown size={10} /> Capitães
                    </div>
                    {captains.map((p) => (
                      <PlayerCard key={p.id} player={p} selected={selected.has(p.id)} onToggle={() => togglePlayer(p.id)} />
                    ))}
                    <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider px-1 py-1 mt-2">Jogadores</div>
                  </>
                )}
                {players
                  .filter((p) => !p.isCaptain)
                  .map((p) => (
                    <PlayerCard key={p.id} player={p} selected={selected.has(p.id)} onToggle={() => togglePlayer(p.id)} />
                  ))}
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Draw button */}
          <button
            onClick={handleDraw}
            disabled={!valid}
            className="w-full py-4 rounded-xl font-display text-xl tracking-wider flex items-center justify-center gap-3 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed bg-[var(--gold)] hover:bg-[var(--gold-light)] text-[var(--dark)] hover:scale-[1.02] active:scale-[0.98]"
          >
            <Shuffle size={22} />
            SORTEAR TIMES
          </button>
        </div>

        {/* Right panel - Results */}
        <div className="col-span-3">
          {!teams ? (
            <div className="h-full glass-card rounded-2xl flex items-center justify-center">
              <div className="text-center p-12">
                <div className="font-display text-6xl text-[var(--court-line)] opacity-40 mb-4">🏐</div>
                <div className="font-display text-2xl text-[var(--text-muted)] mb-2">PRONTO PARA SORTEAR</div>
                <p className="text-sm text-[var(--text-muted)]">Selecione os jogadores e clique em sortear</p>
              </div>
            </div>
          ) : (
            <div ref={resultsRef}>
              {/* Results header */}
              <div className="flex items-center justify-between mb-4">
                <div className="font-display text-2xl text-[var(--gold)]">RESULTADO</div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-4 py-2 glass-card rounded-xl text-sm hover:text-[var(--gold)] transition-colors"
                  >
                    {copied ? <Check size={15} className="text-green-400" /> : <Copy size={15} />}
                    {copied ? "Copiado!" : "Copiar"}
                  </button>
                  <button
                    onClick={handleCapture}
                    className="flex items-center gap-2 px-4 py-2 glass-card rounded-xl text-sm hover:text-[var(--gold)] transition-colors"
                  >
                    <Camera size={15} />
                    Imagem
                  </button>
                  <button
                    onClick={handleDraw}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--gold)]/20 border border-[var(--gold)]/30 text-[var(--gold)] text-sm hover:bg-[var(--gold)]/30 transition-colors"
                  >
                    <Shuffle size={15} />
                    Novo
                  </button>
                </div>
              </div>

              {/* Balance indicator */}
              <div className="glass-card rounded-xl p-3 mb-4 flex items-center justify-between">
                <span className="text-xs text-[var(--text-muted)]">Diferença de nível entre times:</span>
                <span
                  className={`text-sm font-bold ${
                    Math.max(...teams.map((t) => t.totalLevel)) - Math.min(...teams.map((t) => t.totalLevel)) <= 3
                      ? "text-green-400"
                      : "text-yellow-400"
                  }`}
                >
                  {Math.max(...teams.map((t) => t.totalLevel)) - Math.min(...teams.map((t) => t.totalLevel))} pts
                </span>
              </div>

              {/* Teams grid */}
              <div
                className={`grid gap-4 ${
                  teams.length <= 2 ? "grid-cols-1 md:grid-cols-2" : teams.length <= 4 ? "grid-cols-2" : "grid-cols-3"
                }`}
              >
                {teams.map((team, i) => (
                  <TeamCard key={team.id} team={team} index={i} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
