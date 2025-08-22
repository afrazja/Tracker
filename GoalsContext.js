import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTrackers } from './TrackersContext';

/** Goal schema
 * id: string
 * type: 'daily' | 'total'
 * name: string
 * trackerIds: string[]
 * target: number
 * unit: string
 * timeframe: 'daily' | 'weekly' | 'monthly' | 'yearly'
 * startDate?: string (YYYY-MM-DD) | null
 * endDate?: string (YYYY-MM-DD) | null
 * createdAt: ISO string
 */

const GoalsContext = createContext(null);

export function GoalsProvider({ children }) {
  const { trackers } = useTrackers();
  const [goals, setGoals] = useState([]);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveTimer, setSaveTimer] = useState(null);
  // Undo delete state
  const [pendingUndoGoal, setPendingUndoGoal] = useState(null);
  const undoTimerRef = React.useRef(null);

  // --- Schema Versioning ---
  // v0 legacy (plain array), v1 adds start/end date normalization & createdAt backfill, v2 reserves for future
  const GOALS_SCHEMA_VERSION = 1;
  const goalMigrations = {
    0: (data) => {
      // Ensure createdAt, startDate, endDate exist (default to today)
      const today = new Date().toISOString().slice(0,10);
      return (Array.isArray(data) ? data : []).map(g => ({
        createdAt: g.createdAt || new Date().toISOString(),
        startDate: g.startDate || today,
        endDate: g.endDate || g.startDate || today,
        timeframe: ['daily','weekly','monthly','yearly'].includes(g.timeframe) ? g.timeframe : 'daily',
        ...g
      }));
    }
  };

  const runMigrations = (raw, version) => {
    let v = version;
    let data = raw;
    while (v < GOALS_SCHEMA_VERSION) {
      const migrate = goalMigrations[v];
      if (typeof migrate === 'function') {
        try { data = migrate(data); } catch (err) { console.warn('Goal migration failed', v, err); break; }
      }
      v += 1;
    }
    return { data, version: v };
  };

  const hydrate = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const raw = await AsyncStorage.getItem('goal_data');
      if (raw) {
        let parsed = null; try { parsed = JSON.parse(raw); } catch { parsed = null; }
        let storedVersion = 0; let dataArr = [];
        if (Array.isArray(parsed)) { dataArr = parsed; storedVersion = 0; }
        else if (parsed && Array.isArray(parsed.data)) { dataArr = parsed.data; storedVersion = parsed.__v || 0; }
        const { data, version } = runMigrations(dataArr, storedVersion);
        setGoals(data);
        if (version !== storedVersion) {
          AsyncStorage.setItem('goal_data', JSON.stringify({ __v: version, data })).catch(()=>{});
        }
      }
    } catch(e) {
      console.warn('Failed to hydrate goals', e);
      setError('Could not load goals');
    } finally {
      setHydrated(true); setLoading(false);
    }
  }, []);

  useEffect(() => { hydrate(); }, [hydrate]);

  // Debounced persistence
  useEffect(() => {
    if (!hydrated) return;
    if (saveTimer) clearTimeout(saveTimer);
    const t = setTimeout(() => { AsyncStorage.setItem('goal_data', JSON.stringify({ __v: GOALS_SCHEMA_VERSION, data: goals })).catch(()=>{}); }, 350);
    setSaveTimer(t);
    return () => clearTimeout(t);
  }, [goals, hydrated]);

  const addGoal = useCallback(goal => {
    try {
      if (!goal || typeof goal !== 'object') {
        console.error('Invalid goal object provided to addGoal');
        return;
      }
      setGoals(prev => [...prev, { ...goal, id: goal.id || Date.now().toString(), createdAt: new Date().toISOString() }]);
    } catch (error) {
      console.error('Error adding goal:', error);
    }
  }, []);

  // Compute progress for each goal based on trackers & tracker records
  const goalsWithProgress = useMemo(() => {
    const today = new Date().toISOString().slice(0,10);
    return goals.map(g => {
      let current = 0;
      const relevantTrackers = trackers.filter(t => g.trackerIds.includes(t.id));
      if (g.type === 'daily') {
        relevantTrackers.forEach(t => {
          const primaryField = t.valueFieldId; // may be undefined for legacy
          (t.records || []).forEach(r => {
            if (r.date !== today) return;
            let add = 0;
            if (primaryField && r.hasOwnProperty(primaryField)) {
              const raw = r[primaryField];
              add = Number(typeof raw === 'string' ? parseFloat(raw) : raw) || 0;
            } else {
              // Legacy fallback by tracker type/unit
              if (t.id === 'reading') add = Number(r.pages) || 0;
              else if (t.id === 'expense') add = Number(r.amount) || 0;
              else if (t.id === 'workout') add = Number(r.time) || 0;
              else if (t.id === 'meditation') add = Number(r.duration) || 0;
            }
            current += add;
          });
        });
      } else if (g.type === 'total') {
        // Aggregate card value already reflects primary field via TrackersContext
        relevantTrackers.forEach(t => { current += Number(t.value) || 0; });
      }
      const percent = g.target ? Math.min(100, (current / g.target) * 100) : 0;
      return { ...g, progress: current, percent };
    });
  }, [goals, trackers]);

  const updateGoal = useCallback((goalId, patch) => {
    try {
      if (!goalId || !patch) return;
      setGoals(prev => prev.map(g => g.id === goalId ? { ...g, ...patch } : g));
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  }, []);

  const deleteGoal = useCallback((goalId) => {
    try {
      if (!goalId) return;
      setGoals(prev => {
        const target = prev.find(g => g.id === goalId);
        if (!target) return prev;
        // If an undo is already pending, finalize (drop) it
        if (undoTimerRef.current) {
          clearTimeout(undoTimerRef.current);
          undoTimerRef.current = null;
          setPendingUndoGoal(null); // previous is discarded
        }
        setPendingUndoGoal(target);
        // Start 5s timer to finalize (do nothing; goal already removed)
        undoTimerRef.current = setTimeout(() => {
          setPendingUndoGoal(null);
          undoTimerRef.current = null;
        }, 5000);
        return prev.filter(g => g.id !== goalId);
      });
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  }, []);

  const undoDeleteGoal = useCallback(() => {
    if (!pendingUndoGoal) return;
    // Cancel timer
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
    setGoals(prev => [...prev, pendingUndoGoal]);
    setPendingUndoGoal(null);
  }, [pendingUndoGoal]);

  // Cleanup on unmount
  useEffect(() => () => { if (undoTimerRef.current) clearTimeout(undoTimerRef.current); }, []);

  const value = { goals: goalsWithProgress, addGoal, updateGoal, deleteGoal, hydrated, loading, error, retryHydrate: hydrate, pendingUndoGoal, undoDeleteGoal };
  return <GoalsContext.Provider value={value}>{children}</GoalsContext.Provider>;
}

export function useGoals() {
  const ctx = useContext(GoalsContext);
  if (!ctx) {
    if (__DEV__) console.warn('useGoals called outside GoalsProvider – returning inert fallback');
    return { goals: [], hydrated: false, loading: true, error: 'GoalsProvider missing', retryHydrate: () => {}, addGoal: () => {}, updateGoal: () => {}, deleteGoal: () => {}, pendingUndoGoal: null, undoDeleteGoal: () => {} };
  }
  return ctx;
}
