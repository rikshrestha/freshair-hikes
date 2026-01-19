import { UserProfile } from "../storage/profile";

export type Trail = {
  id: string;
  name: string;
  difficulty: "Easy" | "Moderate" | "Strenuous";
  distanceMi: number;
  estTimeMin: number;
  why: string;
};

const DIFFICULTY_SCORE: Record<Trail["difficulty"], number> = {
  Easy: 1,
  Moderate: 2,
  Strenuous: 3,
};

export function readinessScore(p: UserProfile) {
  let score = 1;
  if (p.weeklyActivity === "2-3") score += 1;
  if (p.weeklyActivity === "4+") score += 2;
  if (p.pace === "fast") score += 1;
  if (p.distanceBand === "6-10") score += 1;
  return Math.min(score, 4);
}

export function pickTrails(
  profile: UserProfile,
  all: Trail[]
): Trail[] {
  const r = readinessScore(profile);
  return all
    .filter(t => DIFFICULTY_SCORE[t.difficulty] <= r)
    .slice(0, 10);
}

