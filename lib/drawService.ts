import { Player, Team, DrawConfig } from "@/types";

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function generateTeams(selectedPlayers: Player[], config: DrawConfig, mode: "balanced" | "random" = "balanced"): Team[] {
  const { numberOfTeams } = config;

  if (selectedPlayers.length < numberOfTeams) {
    throw new Error("Número de jogadores insuficientes para o número de times.");
  }

  // Shuffle generally first
  const playersPool = shuffle(selectedPlayers);

  // Initialize Teams array
  let teams: Team[] = [];

  // --- RANDOM MODE ---
  if (mode === "random") {
    // Create empty teams
    teams = Array.from({ length: numberOfTeams }, (_, i) => ({
      id: i + 1,
      name: `Time ${i + 1}`,
      captain: null as unknown as Player, // Temporary, will be filled
      players: [],
      totalLevel: 0,
    }));

    // Sequential distribution (Round Robin)
    playersPool.forEach((player, index) => {
      const teamIndex = index % numberOfTeams;
      const team = teams[teamIndex];

      if (index < numberOfTeams) {
        // First pass: assign captains
        team.captain = player;
        team.totalLevel += player.level;
      } else {
        // Subsequent passes: assign players
        team.players.push(player);
        team.totalLevel += player.level;
      }
    });

    return teams;
  }

  // --- BALANCED MODE ---

  // 1. Identify Captains
  // We respect the 'isCaptain' flag if present.
  const flaggedCaptains = playersPool.filter((p) => p.isCaptain);
  const others = playersPool.filter((p) => !p.isCaptain);

  let selectedCaptains: Player[] = [];
  let remainingPool: Player[] = [];

  if (flaggedCaptains.length >= numberOfTeams) {
    // Pick needed amount of random captains from the flagged list
    selectedCaptains = flaggedCaptains.slice(0, numberOfTeams);
    // Put unused captains back into the pool as normal players
    remainingPool = [...others, ...flaggedCaptains.slice(numberOfTeams)];
  } else {
    // Not enough flagged captains
    selectedCaptains = [...flaggedCaptains];
    const needed = numberOfTeams - flaggedCaptains.length;

    // Sort remaining by level desc to pick best temporary captains
    const sortedOthers = [...others].sort((a, b) => b.level - a.level);

    selectedCaptains.push(...sortedOthers.slice(0, needed));
    remainingPool.push(...sortedOthers.slice(needed));
  }

  // Initialize Teams with Captains
  teams = selectedCaptains.map((captain, i) => ({
    id: i + 1,
    name: `Time ${i + 1}`,
    captain,
    players: [],
    totalLevel: captain.level,
  }));

  // 2. Distribute Levantadores (Setters)
  // Constraint: Try to limit to 2 per team (including captain).
  // Strategy: Identify all remaining setters and distribute them to balance counts.
  const levantadores = remainingPool.filter((p) => p.position === "levantador");
  const nonLevantadores = remainingPool.filter((p) => p.position !== "levantador");

  // Sort setters by level desc to balance skill if possible
  levantadores.sort((a, b) => b.level - a.level);

  // Helper function to count setters
  const countLevantadores = (team: Team) => {
    let count = 0;
    if (team.captain.position === "levantador") count++;
    count += team.players.filter((p) => p.position === "levantador").length;
    return count;
  };

  for (const lev of levantadores) {
    // strict sort inside loop ensures we always pick the team that needs setter most
    teams.sort((a, b) => {
      const countA = countLevantadores(a);
      const countB = countLevantadores(b);
      if (countA !== countB) return countA - countB;

      // Secondary: Total Level (give to weaker team)
      if (a.totalLevel !== b.totalLevel) return a.totalLevel - b.totalLevel;

      // Tertiary: Player Count (give to smaller team)
      return a.players.length + 1 - (b.players.length + 1);
    });

    const targetTeam = teams[0];
    targetTeam.players.push(lev);
    targetTeam.totalLevel += lev.level;
  }

  // 3. Distribute Remaining Players (Non-Setters)
  // Sort by level desc (Snake Draft style logic by picking best for weakest team)
  nonLevantadores.sort((a, b) => b.level - a.level);

  for (const player of nonLevantadores) {
    // Sort teams to find the best candidate for the next player
    teams.sort((a, b) => {
      // Primary: Player Count (balance size first)
      const sizeA = a.players.length + 1;
      const sizeB = b.players.length + 1;
      if (sizeA !== sizeB) return sizeA - sizeB;

      // Secondary: Total Level (balance skill)
      return a.totalLevel - b.totalLevel;
    });

    const targetTeam = teams[0];
    targetTeam.players.push(player);
    targetTeam.totalLevel += player.level;
  }

  // Restore original order by ID to avoid visual jumping randomly?
  teams.sort((a, b) => a.id - b.id);

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
