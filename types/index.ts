// types/index.ts

export type Position =
  | "levantador"
  | "libero"
  | "ponteiro"
  | "central"
  | "oposto"
  | "universal";

export interface Player {
  id: string;
  name: string;
  level: number;
  position: string;
  isCaptain: boolean;
  createdAt: string | Date;
}

export interface Team {
  id: number;
  name: string;
  captain: Player;
  players: Player[];
  totalLevel: number;
}

export interface DrawConfig {
  numberOfTeams: number;
  playersPerTeam: number;
}

export interface DrawResult {
  teams: Team[];
  config: DrawConfig;
  timestamp: Date;
}

export interface PlayerFormData {
  name: string;
  level: number;
  position: string;
  isCaptain: boolean;
}
