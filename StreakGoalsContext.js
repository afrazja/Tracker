import React, { createContext, useContext, useMemo, useCallback, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTrackers } from './TrackersContext';

/* Streak goal base schema (derived fields computed):
 * { id, name, trackerId, targetDays }
 */
const StreakGoalsContext = createContext(null);

function datesWithRecords(records) {
  const set = new Set();
  (records || []).forEach(r => { if (r.date) set.add(r.date); });
  return set;
}

function calcCurrentStreak(dateSet) {
  if (!dateSet.size) return 0;
  let streak = 0;
  const today = new Date();
  for (let i=0; i<400; i++) { // hard cap safety
    const d = new Date(today.getTime() - i*24*60*60*1000);
    const dateStr = d.toISOString().slice(0,10);
    if (dateSet.has(dateStr)) streak++; else break;
  }
  return streak;
}

function calcLongestStreak(dateSet) {
  if (!dateSet.size) return 0;
  // Convert set to sorted array
  const days = Array.from(dateSet).sort();
  let longest = 0, curr = 0, prev = null;
  for (const ds of days) {
    if (!prev) { curr = 1; } else {
      const prevDate = new Date(prev);
      const thisDate = new Date(ds);
      const diff = (thisDate - prevDate) / 86400000;
      curr = diff === 1 ? curr + 1 : 1;
    }
    if (curr > longest) longest = curr;
    prev = ds;
  }
  return longest;
}

export function StreakGoalsProvider({ children }) {
  const { trackers } = useTrackers();
  const [streakGoals, setStreakGoals] = useState([]);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveTimer, setSaveTimer] = useState(null);

  // --- Schema Versioning ---
  // v0 legacy plain array; v1 adds createdAt backfill + numeric normalization for targetDays
  const STREAK_GOALS_SCHEMA_VERSION = 1;
  const streakGoalMigrations = {
    0: (data) => (Array.isArray(data) ? data : []).map(g => ({
      createdAt: g.createdAt || new Date().toISOString(),
      targetDays: Math.max(1, Number(g.targetDays) || 1),
      ...g
    }))
  };

  const runMigrations = (raw, version) => {
    let v = version;
    let data = raw;
    while (v < STREAK_GOALS_SCHEMA_VERSION) {
      const migrate = streakGoalMigrations[v];
      if (typeof migrate === 'function') {
        try { data = migrate(data); } catch (err) { console.warn('Streak goal migration failed', v, err); break; }
      }
      v += 1;
    }
    return { data, version: v };
  };

  const hydrate = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const raw = await AsyncStorage.getItem('streak_goal_data');
      if (raw) {
        let parsed = null; try { parsed = JSON.parse(raw); } catch { parsed = null; }
        let storedVersion = 0; let arr = [];
        if (Array.isArray(parsed)) { arr = parsed; storedVersion = 0; }
        else if (parsed && Array.isArray(parsed.data)) { arr = parsed.data; storedVersion = parsed.__v || 0; }
        const { data, version } = runMigrations(arr, storedVersion);
        setStreakGoals(data);
        if (version !== storedVersion) {
          AsyncStorage.setItem('streak_goal_data', JSON.stringify({ __v: version, data })).catch(()=>{});
        }
      }
    } catch(e) {
      console.warn('Failed to hydrate streak goals', e);
      setError('Could not load streak goals');
    } finally {
      setHydrated(true); setLoading(false);
    }
  }, []);

  useEffect(() => { hydrate(); }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    if (saveTimer) clearTimeout(saveTimer);
    const t = setTimeout(() => { AsyncStorage.setItem('streak_goal_data', JSON.stringify({ __v: STREAK_GOALS_SCHEMA_VERSION, data: streakGoals })).catch(()=>{}); }, 350);
    setSaveTimer(t);
    return () => clearTimeout(t);
  }, [streakGoals, hydrated]);

  const addStreakGoal = useCallback(g => {
    if (!g || !g.name || !g.trackerId || !g.targetDays) return;
    setStreakGoals(prev => [...prev, { id: g.id || Date.now().toString(), name: g.name.trim(), trackerId: g.trackerId, targetDays: Number(g.targetDays) || 1 }]);
  }, []);
  const deleteStreakGoal = useCallback(id => { setStreakGoals(prev => prev.filter(g => g.id !== id)); }, []);

  const streakGoalsWithProgress = useMemo(() => {
    return streakGoals.map(g => {
      const tracker = trackers.find(t => t.id === g.trackerId);
      const dateSet = tracker ? datesWithRecords(tracker.records) : new Set();
      const currentStreak = calcCurrentStreak(dateSet);
      const longestStreak = calcLongestStreak(dateSet);
      const percent = Math.min(100, (currentStreak / g.targetDays) * 100);
      return { ...g, currentStreak, longestStreak, percent };
    });
  }, [streakGoals, trackers]);

  // Return provider in single line to avoid accidental whitespace text nodes causing RN text warning
  return <StreakGoalsContext.Provider value={{ streakGoals: streakGoalsWithProgress, addStreakGoal, deleteStreakGoal, hydrated, loading, error, retryHydrate: hydrate }}>{children}</StreakGoalsContext.Provider>;
}

export function useStreakGoals() {
  const ctx = useContext(StreakGoalsContext);
  if (!ctx) {
    if (__DEV__) console.warn('useStreakGoals called outside StreakGoalsProvider – returning inert fallback');
    return { streakGoals: [], hydrated: false, loading: true, error: 'StreakGoalsProvider missing', retryHydrate: () => {}, addStreakGoal: () => {}, deleteStreakGoal: () => {} };
  }
  return ctx;
}
