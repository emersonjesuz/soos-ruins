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

export function generateTeams(selectedPlayers: Player[], config: DrawConfig): Team[] {
  const { numberOfTeams, playersPerTeam } = config;

  // Clone players to avoid mutation and shuffle
  const playersPool = shuffle(selectedPlayers);

  // Filter existing captains
  const captains = playersPool.filter((p) => p.isCaptain);
  const others = playersPool.filter((p) => !p.isCaptain);

  let selectedCaptains: Player[] = [];
  let remainingPlayers: Player[] = [];

  if (captains.length >= numberOfTeams) {
    // If we have enough captains, pick N random captains
    selectedCaptains = captains.slice(0, numberOfTeams);
    // The rest become regular players
    remainingPlayers = [...others, ...captains.slice(numberOfTeams)];
  } else {
    // If not enough captains, use all existing captains
    selectedCaptains = [...captains];
    // Fill the rest with highest level players from others (or random if levels equal)
    const needed = numberOfTeams - captains.length;
    // Sort others by level desc to pick best candidates for temp captain
    const sortedOthers = [...others].sort((a, b) => b.level - a.level);

    const newCaptains = sortedOthers.slice(0, needed);
    const rest = sortedOthers.slice(needed);

    selectedCaptains = [...selectedCaptains, ...newCaptains];
    remainingPlayers = rest;
  }

  // Double check we have enough total players (captains + players)
  const totalSlots = numberOfTeams * playersPerTeam;
  if (selectedPlayers.length < totalSlots) {
    throw new Error(
      `Jogadores insuficientes. Necessário: ${totalSlots}, selecionado: ${selectedPlayers.length}. O sorteio exige exatamente ${playersPerTeam} jogadores por time.`,
    );
  }

  // Initialize teams with captains
  const teams: Team[] = selectedCaptains.map((captain, i) => ({
    id: i + 1,
    name: `Time ${i + 1}`,
    captain: captain,
    players: [],
    // Add captain's level to total
    totalLevel: captain.level,
  }));

  // Step 2: Distribute remaining players
  // Snake draft based on team total level to balance
  const remainingPool = [...remainingPlayers];
  const byLevel = new Map<number, Player[]>();
  for (const p of remainingPool) {
    if (!byLevel.has(p.level)) byLevel.set(p.level, []);
    byLevel.get(p.level)!.push(p);
  }

  const sortedLevels = Array.from(byLevel.keys()).sort((a, b) => b - a);

  // Flatten into sorted pool
  const pool: Player[] = [];
  for (const lvl of sortedLevels) {
    const list = byLevel.get(lvl)!;
    // Shuffle players of same level to add randomness
    pool.push(...shuffle(list));
  }

  // Greedy assignment logic
  // We want to fill players for each team until they reach playersPerTeam
  // The captain is already in the team (though in this structure captain is separate property,
  // logic typically counts captain as 1 player slot)

  // Current logic creates teams of size (1 captain + playersPerTeam players)?
  // Or (1 captain + (playersPerTeam - 1) players)?
  // Based on your previous code: `const playerSlots = playersPerTeam - 1;` indicates captain counts towards limit.

  // However, variable `playerSlots` was defined but not used correctly in loop logic in my previous view?
  // Let's refine the distribution loop

  const slotsToFill = playersPerTeam - 1; // Since captain is 1 slot

  // Track how many players added to each team
  const teamsPlayersCount = new Array(numberOfTeams).fill(0);

  for (const player of pool) {
    // Find eligible teams (those that still need players)
    // Sort them by totalLevel ascending (weakest team picks first - "Greedy Balance")
    // If levels equal, maybe pick random or by index (stable sort)

    const candidates = teams
      .map((t, idx) => ({ idx, totalLevel: t.totalLevel, count: teamsPlayersCount[idx] }))
      .filter((c) => c.count < slotsToFill)
      .sort((a, b) => a.totalLevel - b.totalLevel);

    if (candidates.length === 0) {
      // All teams full or no players left?
      // If pool has more players than needed, they get left out?
      break;
    }

    // Pick the weakest team
    const bestTeamIdx = candidates[0].idx;
    teams[bestTeamIdx].players.push(player);
    teams[bestTeamIdx].totalLevel += player.level;
    teamsPlayersCount[bestTeamIdx]++;
  }

  return teams;
}

export function teamsToText(teams: Team[]): string {
  return teams
    .map((team) => {
      const header = `🏐 ${team.name.toUpperCase()}`;
      const captain = `👑 Capitão: ${team.captain.name}`;
      const players = team.players.map((p) => `  • ${p.name} - Nível ${p.level} (${p.position})`).join("\n");
      const total = `📊 Nível total: ${team.totalLevel}`;
      return [header, captain, players, total].join("\n");
    })
    .join("\n\n---\n\n");
}
