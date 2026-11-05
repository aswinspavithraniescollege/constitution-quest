// Gamification: XP, levels, streaks, badges
import { db } from "./db";

// XP needed for a given level: level * 100 (level 1=0, level 2=100, level 3=300, level 4=600...)
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return ((level - 1) * level * 50);
}

export function levelForXp(xp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  return level;
}

export function xpProgress(xp: number) {
  const level = levelForXp(xp);
  const currentLevelXp = xpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);
  const intoLevel = xp - currentLevelXp;
  const levelRange = nextLevelXp - currentLevelXp;
  const pct = levelRange > 0 ? Math.round((intoLevel / levelRange) * 100) : 100;
  return { level, currentLevelXp, nextLevelXp, intoLevel, levelRange, pct, xpToNext: nextLevelXp - xp };
}

// XP rewards
export const XP_REWARDS = {
  CORRECT_ANSWER: 15,
  WRONG_ANSWER: 5,
  MOCK_COMPLETE: 50,
  MOCK_PERFECT: 200, // bonus for 100% score
  DAILY_LOGIN: 10,
};

// Update streak on login or activity
export async function updateStreak(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return;
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10); // YYYY-MM-DD

  if (user.lastActiveDate === todayStr) return; // already updated today

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  let newStreak = 1;
  if (user.lastActiveDate === yesterdayStr) {
    newStreak = user.streak + 1;
  } else if (user.lastActiveDate === todayStr) {
    newStreak = user.streak;
  } else {
    newStreak = 1;
  }

  await db.user.update({
    where: { id: userId },
    data: {
      streak: newStreak,
      longestStreak: Math.max(user.longestStreak, newStreak),
      lastActiveDate: todayStr,
      lastLoginAt: today,
    },
  });
  return newStreak;
}

// Award XP and update level
export async function awardXp(userId: string, xp: number) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return;
  const newXp = user.xp + xp;
  const newLevel = levelForXp(newXp);
  await db.user.update({
    where: { id: userId },
    data: { xp: newXp, level: newLevel },
  });
  return { newXp, newLevel, leveledUp: newLevel > user.level };
}

// Check & award badges based on user stats
export async function checkAndAwardBadges(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      practiceAttempts: { include: { question: { select: { weekId: true } } } },
      mockAttempts: { include: { mockTest: { select: { title: true } } } },
      studentBadges: true,
    },
  });
  if (!user) return [];

  const practiceCount = user.practiceAttempts.length;
  const correctCount = user.practiceAttempts.filter(p => p.isCorrect).length;
  const mockCount = user.mockAttempts.length;
  const hasPerfectMock = user.mockAttempts.some(m => m.score === m.totalQuestions && m.totalQuestions > 0);
  const hasGrandMock = user.mockAttempts.some(m => {
    return m.mockTest?.title?.toLowerCase().includes("grand");
  });

  // weeks practiced
  const weekSet = new Set<string>();
  for (const p of user.practiceAttempts) {
    if (p.question?.weekId) weekSet.add(p.question.weekId);
  }

  // Calculate longest correct streak (in chronological order)
  const sortedAttempts = [...user.practiceAttempts].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  let maxStreak = 0;
  let curStreak = 0;
  for (const a of sortedAttempts) {
    if (a.isCorrect) {
      curStreak++;
      maxStreak = Math.max(maxStreak, curStreak);
    } else {
      curStreak = 0;
    }
  }

  const allBadges = await db.badge.findMany();
  const earnedBadgeIds = new Set(user.studentBadges.map(sb => sb.badgeId));
  const newBadges: string[] = [];

  for (const badge of allBadges) {
    if (earnedBadgeIds.has(badge.id)) continue;
    let earned = false;
    switch (badge.criteria) {
      case "practice_count >= 1": earned = practiceCount >= 1; break;
      case "practice_count >= 10": earned = practiceCount >= 10; break;
      case "practice_count >= 25": earned = practiceCount >= 25; break;
      case "practice_count >= 50": earned = practiceCount >= 50; break;
      case "streak_correct >= 10": earned = maxStreak >= 10; break;
      case "mock_count >= 1": earned = mockCount >= 1; break;
      case "mock_count >= 5": earned = mockCount >= 5; break;
      case "perfect_score": earned = hasPerfectMock; break;
      case "weeks_practiced >= 1": earned = weekSet.size >= 1; break;
      case "weeks_practiced >= 8": earned = weekSet.size >= 8; break;
      case "streak >= 3": earned = user.streak >= 3; break;
      case "streak >= 7": earned = user.streak >= 7; break;
      case "level >= 5": earned = user.level >= 5; break;
      case "level >= 10": earned = user.level >= 10; break;
      case "xp >= 1000": earned = user.xp >= 1000; break;
      case "grand_mock_completed": earned = hasGrandMock; break;
    }
    if (earned) {
      await db.studentBadge.create({
        data: { userId, badgeId: badge.id },
      }).catch(() => {}); // ignore unique constraint
      newBadges.push(badge.id);
    }
  }
  return newBadges;
}

// Log activity
export async function logActivity(userId: string, action: string, details?: string, durationSec?: number) {
  await db.activityLog.create({
    data: { userId, action, details, durationSec },
  });
}
