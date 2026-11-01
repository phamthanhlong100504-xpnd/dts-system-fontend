import type { LeaderboardResponse, LeaderboardEntry } from "@/features/result-performance/result-performance-contract";
export type LeaderboardPeriod = "WEEK" | "MONTH" | "ALL";
export type LeaderboardCurrentUser = LeaderboardEntry;
export type LeaderboardUserEntry = LeaderboardEntry & { isCurrentUser: boolean };
export interface LeaderboardParams { licenseClass: string; period: LeaderboardPeriod; page: number; size: number }
export interface LeaderboardResult extends Omit<LeaderboardResponse, "items"> { items: LeaderboardUserEntry[] }
