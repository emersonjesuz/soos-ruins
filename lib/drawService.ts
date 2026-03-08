// lib/drawService.ts
import { Player, Team, DrawConfig } from "@/types";

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function countSetters(players: Player[]) {
  return players.filter((p) => p.position === "levantador").length;
}

function chooseBalancedTeam(candidates: number[], teams: Team[]) {
  const sorted = [...candidates].sort((a, b) => teams[a].totalLevel - teams[b].totalLevel);
  const minLevel = teams[sorted[0]].totalLevel;
  const weakest = sorted.filter((idx) => teams[idx].totalLevel === minLevel);
  return weakest[Math.floor(Math.random() * weakest.length)];
}

export function generateTeams(selectedPlayers: Player[], config: DrawConfig): Team[] {
  const { numberOfTeams, playersPerTeam, mode } = config;
  const totalSlots = numberOfTeams * playersPerTeam;

  if (selectedPlayers.length !== totalSlots) {
    throw new Error(
      `Quantidade inválida para o sorteio. Necessário selecionar exatamente ${totalSlots} jogadores (selecionado: ${selectedPlayers.length}).`,
    );
  }

  const teams: Team[] = Array.from({ length: numberOfTeams }, (_, i) => ({
    id: i + 1,
    name: `Time ${i + 1}`,
    players: [],
    totalLevel: 0,
  }));

  const slotsPerTeam = new Array(numberOfTeams).fill(0);

  // Modo aleatório: sem considerar nível/posição/capitão na distribuição
  if (mode === "random") {
    const pool = shuffle(selectedPlayers);

    for (const player of pool) {
      const availableTeams = teams
        .map((_, idx) => idx)
        .filter((idx) => slotsPerTeam[idx] < playersPerTeam);

      if (availableTeams.length === 0) break;

      const teamIdx = availableTeams[Math.floor(Math.random() * availableTeams.length)];
      teams[teamIdx].players.push(player);
      teams[teamIdx].totalLevel += player.level;
      slotsPerTeam[teamIdx] += 1;
    }

    return teams;
  }

  // Modo balanceado: prioriza distribuição por nível
  const byLevel = new Map<number, Player[]>();
  for (const p of selectedPlayers) {
    if (!byLevel.has(p.level)) byLevel.set(p.level, []);
    byLevel.get(p.level)!.push(p);
  }

  const pool = Array.from(byLevel.keys())
    .sort((a, b) => b - a)
    .flatMap((level) => shuffle(byLevel.get(level)!));

  for (const player of pool) {
    const availableTeams = teams
      .map((_, idx) => idx)
      .filter((idx) => slotsPerTeam[idx] < playersPerTeam);

    if (availableTeams.length === 0) break;

    let candidates = availableTeams;

    if (player.position === "levantador") {
      const teamsWithSetterRoom = availableTeams.filter((idx) => countSetters(teams[idx].players) < 2);

      // Permite 3+ levantadores apenas quando inevitável.
      if (teamsWithSetterRoom.length > 0) {
        candidates = teamsWithSetterRoom;
      }
    }

    const teamIdx = chooseBalancedTeam(candidates, teams);
    teams[teamIdx].players.push(player);
    teams[teamIdx].totalLevel += player.level;
    slotsPerTeam[teamIdx] += 1;
  }

  return teams;
}

export function teamsToText(teams: Team[]): string {
  return teams
    .map((team) => {
      const header = `🏐 ${team.name.toUpperCase()}`;
      const players = team.players
        .map((p) => `${p.isCaptain ? "👑 " : ""}• ${p.name} - Nível ${p.level} (${p.position})`)
        .join("\n");
      const total = `📊 Nível total: ${team.totalLevel}`;
      return [header, players, total].join("\n");
    })
    .join("\n\n---\n\n");
}
