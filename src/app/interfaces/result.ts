import { PlayerStats } from "./player-stats";

export interface Result<T> {
    data: T | undefined;
    error?: string;
  }

export interface RaidApi<T> {
    data: T | undefined;
    total_count: number;
    error?: string;
    error_code?: string;
}

export interface StatsApi {
    items: PlayerStats[];
    total_count: number;
    error?: string;
}