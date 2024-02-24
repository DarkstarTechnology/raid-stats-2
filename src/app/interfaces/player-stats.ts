import { Player } from "../processor/db";

export interface IPlayerStats {
  player: Player;
  totalRaids: number;
  raidParticipation: number;
  avgTime: number;
  avgPosition: number;
  snipeAttempts: number;
}