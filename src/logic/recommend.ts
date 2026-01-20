import { UserProfile } from "../storage/profile";
import { HikeSession } from "../storage/hikes";

export type Trail = {
  id: string;
  name: string;
  difficulty: "Easy" | "Moderate" | "Strenuous";
  distanceMi: number;
  estTimeMin: number;
  why: string;
  lat?: number;
  lng?: number;
  source?: string;
  path?: { lat: number; lng: number }[];
};

const DIFF: Record<Trail["difficulty"], number> = {
  Easy: 1,
  Moderate: 2,
  Strenuous: 3,
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function daysBetween(a: number, b: number) {
  return Math.abs(a - b) / (1000 * 60 * 60 * 24);
}

export function readinessScore(profile: UserProfile, hikes: HikeSession[]) {
  let score = 1;
  if (profile.weeklyActivity === "2-3") score += 1;
  if (profile.weeklyActivity === "4+") score += 2;
  if (profile.pace === "fast") score += 1;
  if (profile.distanceBand === "6-10") score += 1;

  const recent = hikes.slice(0, 7);
  const completedCount = recent.length;

  if (completedCount >= 2) score += 1;
  if (completedCount >= 5) score += 1;

  const lastStarted = recent[0]?.startedAt;
  if (lastStarted) {
    const gapDays = daysBetween(Date.now(), lastStarted);
    if (gapDays > 10) score -= 1; // inactivity decay
  }

  const reflected = recent.filter(
    (h) =>
      h.effort !== undefined ||
      h.enjoyment !== undefined ||
      (h.tags && h.tags.length > 0) ||
      !!h.notes
  );

  if (reflected.length >= 2) {
    const avgEnjoy = average(reflected.map((h) => h.enjoyment ?? 0));
    const avgEffort = average(reflected.map((h) => h.effort ?? 0));

    if (avgEnjoy >= 7) score += 1;
    if (avgEffort <= 7) score += 1;
    if (avgEffort >= 9) score -= 1;
  }

  return clamp(score, 1, 4);
}

export function maxDifficultyAllowed(readiness: number) {
  if (readiness <= 2) return 1;
  if (readiness === 3) return 2;
  return 3;
}

export function pickTrails(
  profile: UserProfile,
  hikes: HikeSession[],
  all: Trail[]
): Trail[] {
  return rankTrails(profile, hikes, all).slice(0, 3);
}

export function rankTrails(
  profile: UserProfile,
  hikes: HikeSession[],
  all: Trail[]
): Trail[] {
  const r = readinessScore(profile, hikes);
  const baseMax = maxDifficultyAllowed(r);
  const recent = hikes.slice(0, 7);
  const avgEffort = average(recent.map((h) => h.effort ?? 0));
  const avgEnjoy = average(recent.map((h) => h.enjoyment ?? 0));

  const difficultyByTrail = new Map(all.map((t) => [t.id, t.difficulty]));
  const observedMax = recent.reduce((m, h) => {
    const d = h.trailId ? difficultyByTrail.get(h.trailId) : undefined;
    const score = d ? DIFF[d] : 0;
    return Math.max(m, score);
  }, 0);
  const progressionCap = observedMax > 0 ? clamp(observedMax + 1, 1, 3) : 3;
  const maxDiff = Math.min(baseMax, progressionCap);

  function fitScore(t: Trail) {
    let s = 0;
    const d = DIFF[t.difficulty];
    s += (maxDiff - d) * 5;

    const target =
      profile.distanceBand === "1-2" ? 2 :
      profile.distanceBand === "3-5" ? 4 :
      7;

    const distDelta = Math.abs(t.distanceMi - target);
    s -= distDelta * 2;

    // Guard big jumps outside 40% band
    const upper = target * 1.4;
    const lower = target * 0.6;
    if (t.distanceMi > upper) s -= 8;
    if (t.distanceMi < lower) s -= 4;

    if (profile.weeklyActivity === "0-1") s -= Math.max(0, (t.estTimeMin - 90) / 10);

    // Recovery bias
    if (avgEffort >= 8) {
      s -= d * 2;
      s -= Math.max(0, t.estTimeMin - 60) / 10;
    }

    // Novelty penalty for repeating last trail
    const lastTrailId = recent[0]?.trailId;
    if (lastTrailId && lastTrailId === t.id) {
      s -= 2;
    }

    return s;
  }

  function reasonFor(trail: Trail) {
    const reasons: string[] = [];
    const d = DIFF[trail.difficulty];

    if (maxDiff === 1) {
      reasons.push("Keeping it easy while you build consistency");
    } else if (d === 2 && maxDiff === 2) {
      reasons.push("Moderate unlocked after your recent hikes");
    } else if (d === 3 && maxDiff === 3) {
      reasons.push("Strenuous unlocked based on your progress");
    } else if (d === 1) {
      reasons.push("Easy option to keep it comfortable");
    }

    const target =
      profile.distanceBand === "1-2" ? 2 :
      profile.distanceBand === "3-5" ? 4 :
      7;
    const distDelta = Math.abs(trail.distanceMi - target);
    if (distDelta <= 0.7) {
      reasons.push("Matches your typical distance");
    } else if (trail.distanceMi < target) {
      reasons.push("Slightly shorter to manage effort");
    } else {
      reasons.push("A small step up in distance");
    }

    if (avgEffort >= 8 && d >= 2) {
      reasons.push("Recent effort was high; take this one steady");
    } else if (avgEnjoy >= 7) {
      reasons.push("You’ve been enjoying similar hikes");
    }

    return reasons.join(". ");
  }

  const candidates = all
    .filter((t) => DIFF[t.difficulty] <= maxDiff)
    .map((t) => ({ t: { ...t, why: reasonFor(t) }, s: fitScore(t) }))
    .sort((a, b) => b.s - a.s);

  return candidates.map((x) => x.t);
}
