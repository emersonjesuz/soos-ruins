// components/PlayersClient.tsx
"use client";

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Search, Edit2, Trash2, Crown, X, Check, Users, User, ChevronUp, ChevronDown } from "lucide-react";
import { Player } from "@/types";

const POSITIONS = ["levantador", "libero", "ponteiro", "central", "oposto", "universal"];

const schema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  level: z.coerce.number().int().min(0).max(10),
  position: z.string().min(1, "Selecione uma posição"),
  isCaptain: z.boolean(),
});

type FormData = z.infer<typeof schema>;

const POSITION_COLORS: Record<string, string> = {
  levantador: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  libero: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  ponteiro: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  central: "bg-green-500/20 text-green-400 border-green-500/30",
  oposto: "bg-red-500/20 text-red-400 border-red-500/30",
  universal: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

function LevelBar({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className={`w-2 h-4 rounded-sm ${i < level ? "bg-[var(--gold)]" : "bg-[var(--court-line)]/40"}`} />
        ))}
      </div>
      <span className="text-sm font-semibold text-[var(--gold)] w-4">{level}</span>
    </div>
  );
}

export default function PlayersClient({ initialPlayers }: { initialPlayers: Player[] }) {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sortField, setSortField] = useState<keyof Player | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [filterPosition, setFilterPosition] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const openCreate = () => {
    reset({ name: "", level: 5, position: "", isCaptain: false });
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (player: Player) => {
    setValue("name", player.name);
    setValue("level", player.level);
    setValue("position", player.position);
    setValue("isCaptain", player.isCaptain);
    setEditingId(player.id);
    setShowModal(true);
  };

  const handleSort = (field: keyof Player) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const handleBulkSubmit = async () => {
    setLoading(true);
    try {
      const newPlayers = bulkText
        .split("\n")
        .map((line) => {
          // Remove numbering (1., 2), etc.) optional
          const cleanLine = line.replace(/^\d+[\.\)\-\s]+/, "").trim();
          if (!cleanLine) return null;

          // Assumes just the name per line
          return {
            name: cleanLine,
            level: 5,
            position: "universal",
            isCaptain: false,
          };
        })
        .filter((p): p is NonNullable<typeof p> => p !== null);

      if (newPlayers.length === 0) {
        alert("Nenhum jogador válido encontrado.");
        return;
      }

      // Send to API sequentially to avoid race conditions/overload if many
      // Or separate bulk API
      const createdPlayers: Player[] = [];
      for (const player of newPlayers) {
        try {
          const res = await fetch("/api/players", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(player),
          });
          if (res.ok) {
            const created = (await res.json()) as Player;
            createdPlayers.push(created);
          }
        } catch (e) {
          console.error(e);
        }
      }

      setPlayers((prev) => [...createdPlayers, ...prev]);
      setShowBulkModal(false);
      setBulkText("");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      if (editingId) {
        const res = await fetch(`/api/players/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const updated = (await res.json()) as Player;
        setPlayers((ps) => ps.map((p) => (p.id === editingId ? updated : p)));
      } else {
        const res = await fetch("/api/players", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const created = (await res.json()) as Player;
        setPlayers((ps) => [created, ...ps]);
      }
      setShowModal(false);
    } finally {
      setLoading(false);
    }
  };

  const toggleCaptain = async (player: Player) => {
    // Optimistic update
    const updated = { ...player, isCaptain: !player.isCaptain };
    setPlayers((ps) => ps.map((p) => (p.id === player.id ? updated : p)));

    try {
      await fetch(`/api/players/${player.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
    } catch (e) {
      setPlayers((ps) => ps.map((p) => (p.id === player.id ? player : p)));
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      await fetch(`/api/players/${id}`, { method: "DELETE" });
      setPlayers((ps) => ps.filter((p) => p.id !== id));
      setDeletingId(null);
    } finally {
      setLoading(false);
    }
  };

  let filtered = players.filter(
    (p) => p.name.toLowerCase().includes(search.toLowerCase()) && (filterPosition ? p.position === filterPosition : true),
  );

  if (sortField) {
    filtered = [...filtered].sort((a, b) => {
      const va = a[sortField];
      const vb = b[sortField];
      if (typeof va === "number" && typeof vb === "number") return sortDir === "asc" ? va - vb : vb - va;
      return sortDir === "asc" ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });
  }

  const SortIcon = ({ field }: { field: keyof Player }) =>
    sortField === field ? (
      sortDir === "asc" ? (
        <ChevronUp size={14} />
      ) : (
        <ChevronDown size={14} />
      )
    ) : (
      <ChevronUp size={14} className="opacity-20" />
    );

  return (
    <div className="p-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="font-display text-5xl text-[var(--gold)] gold-glow">JOGADORES</div>
          <p className="text-[var(--text-muted)] mt-1">
            {players.length} jogador{players.length !== 1 ? "es" : ""} cadastrado
            {players.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setShowBulkModal(true)}
            className="flex items-center gap-2 bg-[var(--court-line)] hover:bg-[var(--court-line)]/80 text-[var(--dark)] font-semibold px-5 py-3 rounded-xl transition-all duration-200 hover:scale-105"
          >
            <Users size={18} />
            Importar
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-[var(--gold)] hover:bg-[var(--gold-light)] text-[var(--dark)] font-semibold px-5 py-3 rounded-xl transition-all duration-200 hover:scale-105"
          >
            <Plus size={18} />
            Novo Jogador
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome..."
            className="w-full pl-9 pr-4 py-2.5 glass-card rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--gold)] border border-transparent transition-colors"
          />
        </div>
        <select
          value={filterPosition}
          onChange={(e) => setFilterPosition(e.target.value)}
          className="glass-card rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none border border-transparent focus:border-[var(--gold)] transition-colors"
        >
          <option value="">Todas as posições</option>
          {POSITIONS.map((p) => (
            <option key={p} value={p} className="bg-[var(--dark)]">
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 text-center">
          <Users size={48} className="mx-auto mb-4 text-[var(--court-line)] opacity-50" />
          <div className="font-display text-2xl text-[var(--text-muted)] mb-2">NENHUM JOGADOR</div>
          <p className="text-sm text-[var(--text-muted)]">
            {search ? "Nenhum jogador encontrado com esse filtro" : "Comece adicionando jogadores"}
          </p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)]">
                {[
                  { label: "Nome", field: "name" as keyof Player },
                  { label: "Nível", field: "level" as keyof Player },
                  { label: "Posição", field: "position" as keyof Player },
                  { label: "Capitão", field: "isCaptain" as keyof Player },
                ].map(({ label, field }) => (
                  <th
                    key={field}
                    className="text-left px-6 py-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider cursor-pointer hover:text-[var(--text-primary)] transition-colors"
                    onClick={() => handleSort(field)}
                  >
                    <div className="flex items-center gap-1.5">
                      {label}
                      <SortIcon field={field} />
                    </div>
                  </th>
                ))}
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((player, i) => (
                <tr
                  key={player.id}
                  className="table-row-hover border-b border-[var(--border)]/50 last:border-0"
                  style={{ animationDelay: `${i * 0.03}s` }}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {player.isCaptain ? (
                        <Crown size={14} className="text-[var(--gold)]" />
                      ) : (
                        <User size={14} className="text-[var(--text-muted)]" />
                      )}
                      <span className="font-medium text-[var(--text-primary)]">{player.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <LevelBar level={player.level} />
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full border font-medium capitalize ${
                        POSITION_COLORS[player.position] || "bg-gray-500/20 text-gray-400 border-gray-500/30"
                      }`}
                    >
                      {player.position}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleCaptain(player)}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded transition-all ${
                        player.isCaptain
                          ? "bg-[var(--gold)]/10 text-[var(--gold)] hover:bg-[var(--gold)]/20"
                          : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--court-line)]/20"
                      }`}
                      title={player.isCaptain ? "Remover capitão" : "Promover a capitão"}
                    >
                      <Crown size={14} className={player.isCaptain ? "fill-[var(--gold)]" : "opacity-30"} />
                      <span className="text-xs font-semibold">{player.isCaptain ? "Capitão" : "—"}</span>
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => openEdit(player)}
                        className="p-2 rounded-lg hover:bg-blue-500/20 text-[var(--text-muted)] hover:text-blue-400 transition-all"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => setDeletingId(player.id)}
                        className="p-2 rounded-lg hover:bg-red-500/20 text-[var(--text-muted)] hover:text-red-400 transition-all"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal - Bulk Add */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-2xl w-full max-w-2xl animate-fade-in flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-[var(--border)] shrink-0">
              <div>
                <div className="font-display text-2xl text-[var(--gold)]">IMPORTAR EM MASSA</div>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Cole sua lista abaixo. Formato: Nome, Nivel: 5, Posição: Universal...
                </p>
              </div>
              <button
                onClick={() => setShowBulkModal(false)}
                className="p-2 rounded-lg hover:bg-white/10 text-[var(--text-muted)] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={`Exemplo:
1 Jogador A
2 Jogador B
Jogador C`}
                className="w-full h-64 glass-card rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none border border-[var(--border)] focus:border-[var(--gold)] transition-colors font-mono resize-none leading-relaxed"
              />
              <div className="mt-4 text-xs text-[var(--text-muted)] space-y-1">
                <p>
                  <strong className="text-[var(--gold)]">Padrões:</strong> Nível 5, Posição Universal, Não Capitão.
                </p>
                <p>Nomes duplicados serão ignorados pelo sistema.</p>
              </div>
            </div>

            <div className="p-6 border-t border-[var(--border)] shrink-0 flex gap-3">
              <button
                onClick={() => setShowBulkModal(false)}
                className="flex-1 py-3 rounded-xl glass-card text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleBulkSubmit}
                disabled={loading || !bulkText.trim()}
                className="flex-1 py-3 rounded-xl bg-[var(--gold)] hover:bg-[var(--gold-light)] text-[var(--dark)] font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  "Processando..."
                ) : (
                  <>
                    <Users size={18} />
                    Importar Jogadores
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Create/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-2xl w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
              <div className="font-display text-2xl text-[var(--gold)]">{editingId ? "EDITAR JOGADOR" : "NOVO JOGADOR"}</div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:bg-white/10 text-[var(--text-muted)] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-1.5">
                  Nome
                </label>
                <input
                  {...register("name")}
                  placeholder="Ex: João Silva"
                  className="w-full glass-card rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none border border-[var(--border)] focus:border-[var(--gold)] transition-colors"
                />
                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
              </div>

              {/* Level */}
              <div>
                <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-1.5">
                  Nível (0-10)
                </label>
                <input
                  {...register("level")}
                  type="number"
                  min={0}
                  max={10}
                  className="w-full glass-card rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none border border-[var(--border)] focus:border-[var(--gold)] transition-colors"
                />
                {errors.level && <p className="text-red-400 text-xs mt-1">{errors.level.message}</p>}
              </div>

              {/* Position */}
              <div>
                <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-1.5">
                  Posição
                </label>
                <select
                  {...register("position")}
                  className="w-full glass-card rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none border border-[var(--border)] focus:border-[var(--gold)] transition-colors"
                >
                  <option value="" className="bg-[var(--dark)]">
                    Selecione...
                  </option>
                  {POSITIONS.map((p) => (
                    <option key={p} value={p} className="bg-[var(--dark)]">
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </option>
                  ))}
                </select>
                {errors.position && <p className="text-red-400 text-xs mt-1">{errors.position.message}</p>}
              </div>

              {/* Captain */}
              <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--gold)]/10 border border-[var(--gold)]/20">
                <input
                  {...register("isCaptain")}
                  type="checkbox"
                  id="isCaptain"
                  className="w-5 h-5 rounded accent-[var(--gold)]"
                />
                <label htmlFor="isCaptain" className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <Crown size={16} className="text-[var(--gold)]" />
                  Capitão do time
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl glass-card text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-[var(--gold)] hover:bg-[var(--gold-light)] text-[var(--dark)] font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Check size={16} />
                  {loading ? "Salvando..." : editingId ? "Atualizar" : "Criar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Delete */}
      {deletingId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-2xl w-full max-w-sm animate-fade-in p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} className="text-red-400" />
            </div>
            <div className="font-display text-2xl mb-2">EXCLUIR JOGADOR</div>
            <p className="text-sm text-[var(--text-muted)] mb-6">Tem certeza? Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 py-3 rounded-xl glass-card text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                disabled={loading}
                className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-400 text-white font-semibold transition-all disabled:opacity-50"
              >
                {loading ? "Excluindo..." : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
