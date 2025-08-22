import React, { createContext, useContext, useMemo } from 'react';
import { useTrackers } from './TrackersContext';
import { useGoals } from './GoalsContext';
import { useStreakGoals } from './StreakGoalsContext';

const InsightsContext = createContext(null);

function lastNDates(n) {
  const out = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86400000);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

function sumValueFromRecord(tracker, record) {
  if (!tracker || !record) return 0;
  if (tracker.valueFieldId && Object.prototype.hasOwnProperty.call(record, tracker.valueFieldId)) {
    const v = record[tracker.valueFieldId];
    return Number(typeof v === 'string' ? parseFloat(v) : v) || 0;
  }
  if (tracker.id === 'reading') return Number(record.pages) || 0;
  if (tracker.id === 'expense') return Number(record.amount) || 0;
  if (tracker.id === 'workout') return Number(record.time) || 0;
  if (tracker.id === 'meditation') return Number(record.duration) || 0;
  return 0;
}

export function InsightsProvider({ children }) {
  const { trackers, hydrated: trackersHydrated } = useTrackers();
  const { goals, hydrated: goalsHydrated } = useGoals();
  const { streakGoals, hydrated: streakHydrated } = useStreakGoals();

  const insights = useMemo(() => {
    const ready = trackersHydrated && goalsHydrated && streakHydrated;
    if (!ready) return { ready: false };
    const todayStr = new Date().toISOString().slice(0, 10);
    const last7 = lastNDates(7);
    const last14 = lastNDates(14);

    const perTrackerDaily = {};
    trackers.forEach(t => {
      const map = {};
      last14.forEach(d => (map[d] = 0));
      (t.records || []).forEach(r => {
        if (map.hasOwnProperty(r.date)) {
          map[r.date] += sumValueFromRecord(t, r);
        }
      });
      perTrackerDaily[t.id] = map;
    });

    const priorityIds = ['reading', 'workout', 'meditation', 'expense'];
    const customs = trackers.filter(t => !priorityIds.includes(t.id)).slice(0, 2).map(t => t.id);
    const summaryTrackerIds = [...priorityIds, ...customs].filter(id => trackers.find(t => t.id === id));
    const todaySummary = summaryTrackerIds.map(id => {
      const t = trackers.find(tr => tr.id === id);
      const todayValue = (t.records || []).filter(r => r.date === todayStr).reduce((s, r) => s + sumValueFromRecord(t, r), 0);
      return { trackerId: id, title: t.title, value: todayValue, unit: t.unit };
    });

    const firstWeek = last14.slice(0, 7);
    const secondWeek = last14.slice(7);
    const trends = trackers.map(t => {
      const w1 = firstWeek.reduce((s, d) => s + (perTrackerDaily[t.id][d] || 0), 0);
      const w2 = secondWeek.reduce((s, d) => s + (perTrackerDaily[t.id][d] || 0), 0);
      const change = w1 === 0 && w2 === 0 ? 0 : ((w2 - w1) / (w1 || 1)) * 100;
      return { trackerId: t.id, title: t.title, current: w2, previous: w1, change };
    });

    let expenseCategories = [];
    const expenseTracker = trackers.find(t => t.id === 'expense');
    if (expenseTracker) {
      const now = new Date();
      const monthPrefix = now.toISOString().slice(0, 7);
      const catMap = {};
      (expenseTracker.records || []).forEach(r => {
        if (r.date && r.date.startsWith(monthPrefix)) {
          const cat = r.category || 'Uncategorized';
          catMap[cat] = (catMap[cat] || 0) + (Number(r.amount) || 0);
        }
      });
      const entries = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
      const top3 = entries.slice(0, 3);
      const rest = entries.slice(3).reduce((s, [, v]) => s + v, 0);
      expenseCategories = top3.map(([name, value]) => ({ name, value }));
      if (rest > 0) expenseCategories.push({ name: 'Other', value: rest });
      const total = expenseCategories.reduce((s, c) => s + c.value, 0) || 1;
      expenseCategories = expenseCategories.map(c => ({ ...c, percent: (c.value / total) * 100 }));
    }

    const goalsPace = goals.filter(g => g.type === 'daily').map(g => {
      const start = new Date(g.startDate || todayStr);
      const end = new Date(g.endDate || todayStr);
      const daysTotal = Math.max(1, Math.round((end - start) / 86400000) + 1);
      const elapsed = Math.min(daysTotal, Math.round((new Date() - start) / 86400000) + 1);
      const requiredPerDay = g.target ? g.target / daysTotal : 0;
      const expectedByNow = requiredPerDay * elapsed;
      const delta = (g.progress || 0) - expectedByNow;
      return { id: g.id, name: g.name, target: g.target, progress: g.progress, requiredPerDay, expectedByNow, delta, unit: g.unit };
    });

    const streakSummary = [...streakGoals]
      .sort((a, b) => b.currentStreak - a.currentStreak)
      .slice(0, 3)
      .map(s => ({ id: s.id, name: s.name, current: s.currentStreak, longest: s.longestStreak, percent: s.percent }));

    const recent = [];
    trackers.forEach(t => {
      (t.records || []).forEach(r => {
        recent.push({
          trackerId: t.id,
          trackerTitle: t.title,
          id: r.id,
          date: r.date,
          createdAt: r.createdAt || r.date,
          value: sumValueFromRecord(t, r),
          unit: t.unit,
        });
      });
    });
    recent.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    const recentActivity = recent.slice(0, 15);

    return {
      ready: true,
      todaySummary,
      trends,
      expenseCategories,
      goalsPace,
      streakSummary,
      recentActivity,
    };
  }, [trackers, trackersHydrated, goals, goalsHydrated, streakGoals, streakHydrated]);

  return <InsightsContext.Provider value={insights}>{children}</InsightsContext.Provider>;
}

export function useInsights() {
  const ctx = useContext(InsightsContext);
  if (!ctx) throw new Error('useInsights must be used within InsightsProvider');
  return ctx;
}
