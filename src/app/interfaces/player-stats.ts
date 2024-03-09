import { Player, Race } from "../processor/db";

export interface IPlayerStats {
  player: Player;
  totalRaids: number;
  raidParticipation: number;
  avgTime: number;
  avgPosition: number;
  snipeAttempts: number;
}

export interface PlayerStats {
  name: string;
  race: Race;
  avg_time: number;
  avg_position: number;
  participation: number;
  snipe_ratio: number;
  snipe_attempts: number;
  total_raids: number;
}