// ============================================
// DENTAVIZION — Progress / Achievement Helpers
// Shared module for profile, modules, and report logic
// ============================================

import { getCurrentUser, getUserProfile, getUserReports, saveUserProfile } from "./firebase-config.js?v=3";

const MODULE_DEFINITIONS = [
  {
    id: 'mod1',
    key: 'dentavizion-mod1-done',
    title: 'Ayo Sikat Gigi! 🪥',
    subtitle: 'Pahlawan Sikat Gigi',
    description: 'Selesaikan modul dasar sikat gigi untuk membuka piala pertama.',
    xp: 250,
    color: 'coral'
  },
  {
    id: 'mod2',
    key: 'dentavizion-mod2-done',
    title: 'Scaling Gigi ✨',
    subtitle: 'Gigi Super Kinclong',
    description: 'Pahami cara merawat gigi dari karang agar senyum makin cerah.',
    xp: 250,
    color: 'teal'
  },
  {
    id: 'mod3',
    key: 'dentavizion-mod3-done',
    title: 'Tambal Gigi 🦷',
    subtitle: 'Perisai Gigi Sehat',
    description: 'Selesaikan modul tambal gigi untuk jaga gigi tetap kuat.',
    xp: 250,
    color: 'coral'
  },
  {
    id: 'mod4',
    key: 'dentavizion-mod4-done',
    title: 'Cabut Gigi 💪',
    subtitle: 'Sahabat Dokter Gigi',
    description: 'Tuntaskan modul cabut gigi dan buka pencapaian terakhir.',
    xp: 250,
    color: 'teal'
  }
];

const WEEKDAY_LABELS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
const WEEKLY_STREAK_XP = 150;
const WEEKLY_STREAK_TARGET = 7;

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (_error) {
    return fallback;
  }
}

function toDateKey(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTodayDate(now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function getWeekStart(now = new Date()) {
  const today = getTodayDate(now);
  const dayIndex = (today.getDay() + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - dayIndex);
  return monday;
}

function getWeekDates(now = new Date()) {
  const monday = getWeekStart(now);
  return Array.from({ length: 7 }, (_value, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return date;
  });
}

function getLocalUser() {
  return readJSON('dentavizion-user', null);
}

function normalizeScopeToken(value) {
  return String(value || 'guest')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'guest';
}

function getUserScopeToken(user = null) {
  const source = user || getCurrentUser() || getLocalUser() || {};
  if (source.uid) return `uid_${normalizeScopeToken(source.uid)}`;
  if (source.email) return `email_${normalizeScopeToken(source.email)}`;
  if (source.username) return `name_${normalizeScopeToken(source.username)}`;
  if (source.name) return `name_${normalizeScopeToken(source.name)}`;
  return 'guest';
}

function getScopedKey(baseKey, user = null) {
  return `${baseKey}:${getUserScopeToken(user)}`;
}

function getLocalReports(user = null) {
  return readJSON(getScopedKey('dentavizion-reports', user), []);
}

function getStoredProgress(user = null) {
  return readJSON(getScopedKey('dentavizion-progress', user), { completedModuleIds: [] });
}

function saveStoredProgress(progress, user = null) {
  localStorage.setItem(getScopedKey('dentavizion-progress', user), JSON.stringify(progress));
}

function getLocalModuleIds(user = null) {
  const progress = getStoredProgress(user);
  if (Array.isArray(progress.completedModuleIds)) {
    return MODULE_DEFINITIONS
      .map((module) => module.id)
      .filter((id) => progress.completedModuleIds.includes(id));
  }

  return [];
}

function saveLocalReports(reports, user = null) {
  localStorage.setItem(getScopedKey('dentavizion-reports', user), JSON.stringify(reports));
}

function uniqueReports(reports) {
  const seen = new Set();
  const output = [];

  reports.forEach((report) => {
    if (!report) return;
    const signature = [
      report.date || '',
      report.time || '',
      report.notes || '',
      report.photoURL || ''
    ].join('|');

    if (seen.has(signature)) return;
    seen.add(signature);
    output.push(report);
  });

  return output;
}

async function loadMergedReports(userEmail, user = null) {
  const localReports = getLocalReports(user);
  const remoteReports = userEmail ? await getUserReports(userEmail).catch(() => []) : [];
  return uniqueReports([...localReports, ...remoteReports]);
}

function getCompletedModuleIds(profileProgress = null, user = null) {
  const ids = new Set(getLocalModuleIds(user));

  if (profileProgress && Array.isArray(profileProgress.completedModuleIds)) {
    profileProgress.completedModuleIds.forEach((id) => ids.add(id));
  }

  return MODULE_DEFINITIONS
    .map((module) => module.id)
    .filter((id) => ids.has(id));
}

function getWeeklyReportState(reports, now = new Date()) {
  const weekDates = getWeekDates(now);
  const reportDays = new Set(
    reports
      .map((report) => toDateKey(report.date))
      .filter(Boolean)
  );

  const todayKey = toDateKey(now);
  const latestReportKey = [...reportDays].sort().at(-1) || null;
  const dayItems = weekDates.map((date, index) => {
    const key = toDateKey(date);
    const done = reportDays.has(key);
    const isToday = key === todayKey;
    let state = 'upcoming';

    if (done) {
      state = 'done';
    } else if (isToday) {
      state = 'today';
    } else if (date < getTodayDate(now)) {
      state = 'miss';
    }

    return {
      key,
      label: WEEKDAY_LABELS[index],
      date,
      done,
      isToday,
      state
    };
  });

  const completedDays = dayItems.filter((item) => item.done).length;
  const todayDone = dayItems.some((item) => item.isToday && item.done);
  const streakAnchorKey = reportDays.has(todayKey) ? todayKey : latestReportKey;
  const currentStreak = getConsecutiveStreak(reportDays, streakAnchorKey || undefined);

  return {
    dayItems,
    completedDays,
    totalDays: 7,
    todayDone,
    currentStreak,
    progressPercent: Math.round((completedDays / 7) * 100)
  };
}

function getConsecutiveStreak(reportDays, anchorKey) {
  if (!reportDays || reportDays.size === 0) return 0;

  let cursor = anchorKey ? new Date(`${anchorKey}T12:00:00`) : null;
  if (!cursor || Number.isNaN(cursor.getTime())) {
    const latestKey = [...reportDays].sort().at(-1);
    if (!latestKey) return 0;
    cursor = new Date(`${latestKey}T12:00:00`);
  }

  let streak = 0;
  while (cursor) {
    const key = toDateKey(cursor);
    if (!reportDays.has(key)) break;
    streak += 1;
    cursor = new Date(cursor);
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function getLevelFromXp(totalXp) {
  const safeXp = Math.max(0, Number(totalXp) || 0);
  const level = Math.floor(safeXp / 100) + 1;
  const levelBaseXp = (level - 1) * 100;
  const nextLevelXp = level * 100;
  return {
    level,
    levelBaseXp,
    nextLevelXp,
    xpIntoLevel: safeXp - levelBaseXp,
    xpToNextLevel: nextLevelXp - safeXp
  };
}

function getLevelTitle(level) {
  if (level >= 12) return 'Legenda Senyum 🏆';
  if (level >= 9) return 'Pahlawan Senyum ✨';
  if (level >= 6) return 'Jagoan Konsisten 🌟';
  if (level >= 3) return 'Penjelajah Gigi 🚀';
  return 'Pemula Hebat 🦷';
}

function buildAchievements(profileProgress, weeklyState) {
  const moduleAchievements = MODULE_DEFINITIONS.map((module) => ({
    ...module,
    unlocked: profileProgress.completedModuleIds.includes(module.id),
    badge: profileProgress.completedModuleIds.includes(module.id)
      ? 'Terbuka'
      : 'Belum terbuka'
  }));

  const reportAchievements = [];
  if (weeklyState.completedDays >= WEEKLY_STREAK_TARGET) {
    reportAchievements.push({
      id: 'weekly-streak',
      title: 'Pahlawan Sikat Gigi 🪥',
      subtitle: '7 Hari Berturut-turut',
      description: 'Kamu menyelesaikan semua hari dalam minggu ini.',
      xp: WEEKLY_STREAK_XP,
      unlocked: true
    });
  }

  return {
    moduleAchievements,
    reportAchievements
  };
}

async function buildProgressSnapshot({ user = null, profile = null } = {}) {
  const localUser = getLocalUser();
  const resolvedUser = user || getCurrentUser() || localUser || null;
  const scopeUser = resolvedUser || localUser || null;
  const profileProgress = profile?.progress || profile?.achievementProgress || {};
  const userEmail = resolvedUser?.email || localUser?.email || profile?.email || null;
  const reports = await loadMergedReports(userEmail, scopeUser);

  const weeklyState = getWeeklyReportState(reports);
  const completedModuleIds = getCompletedModuleIds(profileProgress, scopeUser);
  const profileModuleIds = Array.isArray(profileProgress.completedModuleIds)
    ? profileProgress.completedModuleIds
    : [];

  const mergedModuleIds = Array.from(new Set([...completedModuleIds, ...profileModuleIds]))
    .filter((id) => MODULE_DEFINITIONS.some((module) => module.id === id));

  const normalizedProgress = {
    completedModuleIds: mergedModuleIds,
    totalReports: reports.length,
    weeklyCompletedDays: weeklyState.completedDays,
    currentStreak: weeklyState.currentStreak,
    lastSyncAt: new Date().toISOString()
  };

  const { moduleAchievements, reportAchievements } = buildAchievements(
    { completedModuleIds: mergedModuleIds },
    weeklyState
  );

  const moduleXp = moduleAchievements
    .filter((achievement) => achievement.unlocked)
    .reduce((sum, achievement) => sum + achievement.xp, 0);

  const reportXp = reportAchievements
    .filter((achievement) => achievement.unlocked)
    .reduce((sum, achievement) => sum + achievement.xp, 0);

  const totalXp = moduleXp + reportXp;
  const levelInfo = getLevelFromXp(totalXp);
  const levelTitle = getLevelTitle(levelInfo.level);

  return {
    user: resolvedUser,
    userEmail,
    progress: normalizedProgress,
    reports,
    weeklyState,
    moduleAchievements,
    reportAchievements,
    totalXp,
    moduleXp,
    reportXp,
    level: levelInfo.level,
    levelTitle,
    xpIntoLevel: levelInfo.xpIntoLevel,
    xpToNextLevel: levelInfo.xpToNextLevel,
    progressPercent: Math.min(100, Math.round((levelInfo.xpIntoLevel / 100) * 100)),
    moduleCompletionCount: mergedModuleIds.length,
    moduleCompletionTotal: MODULE_DEFINITIONS.length,
    reportCompletionCount: weeklyState.completedDays,
    reportCompletionTotal: 7
  };
}

async function syncProgressToProfile(progressSnapshot) {
  const currentUser = getCurrentUser();
  if (!currentUser || !currentUser.uid) return false;

  try {
    await saveUserProfile(currentUser.uid, {
      achievementProgress: {
        ...progressSnapshot.progress,
        totalXp: progressSnapshot.totalXp,
        level: progressSnapshot.level,
        levelTitle: progressSnapshot.levelTitle,
        moduleXp: progressSnapshot.moduleXp,
        reportXp: progressSnapshot.reportXp
      }
    });
    return true;
  } catch (_error) {
    return false;
  }
}

async function completeModuleProgress(moduleId) {
  const module = MODULE_DEFINITIONS.find((item) => item.id === moduleId);
  if (!module) {
    throw new Error(`Unknown module: ${moduleId}`);
  }

  const currentUser = getCurrentUser() || getLocalUser();
  const existingProgress = getStoredProgress(currentUser);
  const completedModuleIds = new Set(Array.isArray(existingProgress.completedModuleIds) ? existingProgress.completedModuleIds : []);
  const alreadyCompleted = completedModuleIds.has(module.id);
  completedModuleIds.add(module.id);

  saveStoredProgress({
    ...existingProgress,
    completedModuleIds: Array.from(completedModuleIds),
    lastUpdatedAt: new Date().toISOString()
  }, currentUser);

  const snapshot = await buildProgressSnapshot();
  await syncProgressToProfile(snapshot);

  return {
    module,
    alreadyCompleted,
    snapshot,
    message: alreadyCompleted
      ? `✅ Progress modul tetap tersimpan. Piala ${module.subtitle} sudah terbuka.`
      : `🏆 Piala ${module.subtitle} terbuka! +${module.xp} XP`
  };
}

export {
  MODULE_DEFINITIONS,
  WEEKDAY_LABELS,
  buildProgressSnapshot,
  completeModuleProgress,
  getLevelFromXp,
  getLevelTitle,
  getLocalReports,
  getWeeklyReportState,
  getUserScopeToken,
  saveLocalReports,
  syncProgressToProfile,
  toDateKey
};
