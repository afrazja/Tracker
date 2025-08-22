import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
// Diagnostics: increment to verify bundler picked latest code
const __TRACKERS_HOOK_VERSION = 'v2';
if (__DEV__) { try { console.log('[Diag] TrackersContext loaded', __TRACKERS_HOOK_VERSION); } catch {} }
import AsyncStorage from '@react-native-async-storage/async-storage';

const TrackersContext = createContext(null);

// --- Schema Versioning ---
// Increment this when persisted tracker shape changes (add/remove/rename fields needing migration).
const TRACKERS_SCHEMA_VERSION = 2; // v0 legacy (plain array), v1 adds valueFieldId, v2 adds createdAt & normalizes fields

// Migrations: key = fromVersion, value = function(dataArray) => upgradedDataArray (toVersion = fromVersion+1)
// Each function MUST be pure & idempotent for already-upgraded data.
const trackerMigrations = {
  0: (data) => {
    // v0 -> v1: ensure valueFieldId populated using inference rules
    return (Array.isArray(data) ? data : []).map(t => {
      if (t.valueFieldId) return t;
      let inferred = null;
      if (t.id === 'reading') inferred = 'pages';
      else if (t.id === 'expense') inferred = 'amount';
      else if (t.id === 'workout') inferred = 'time';
      else if (t.id === 'meditation') inferred = 'duration';
      else if (Array.isArray(t.fields) && t.fields.length) inferred = t.fields[0].id;
      return { ...t, valueFieldId: inferred };
    });
  },
  1: (data) => {
    // v1 -> v2: ensure each tracker has createdAt & field objects have expected keys
    return data.map(t => ({
      createdAt: t.createdAt || new Date().toISOString(),
      ...t,
      fields: (t.fields || []).map(f => ({ id: f.id, label: f.label ?? f.id, unit: f.unit || '', inherited: !!f.inherited }))
    }));
  }
};

const initialTrackers = [
  { id: 'expense', title: 'Expense', icon: '💸', value: 0, unit: '$', color: '#EF4444', filterField: 'category', records: [], valueFieldId: 'amount', fields: [{ id: 'amount', label: 'Amount', unit: '$', inherited: false }] },
  { id: 'workout', title: 'Workout', icon: '🏋️', value: 0, unit: 'min', color: '#10B981', filterField: 'workoutType', records: [], valueFieldId: 'time', fields: [{ id: 'time', label: 'Time', unit: 'min', inherited: false }] },
  { id: 'reading', title: 'Reading', icon: '📖', value: 0, unit: 'pages', color: '#F59E0B', filterField: 'title', records: [], valueFieldId: 'pages', fields: [{ id: 'pages', label: 'Pages', unit: 'pages', inherited: false }] },
  { id: 'meditation', title: 'Meditation', icon: '🧘', value: 0, unit: 'min', color: '#A855F7', filterField: 'satisfaction', records: [], valueFieldId: 'duration', fields: [{ id: 'duration', label: 'Duration', unit: 'min', inherited: false }] },
];

export function TrackersProvider({ children }) {
  const [trackers, setTrackers] = useState(initialTrackers);
  const [selectedTrackerIds, setSelectedTrackerIds] = useState(initialTrackers.map(t => t.id));
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveTimer, setSaveTimer] = useState(null);
  const [retentionConfig, setRetentionConfig] = useState({ perTrackerLimit: 1000, strategy: 'prune' }); // strategy: prune | archive
  const [archivedCounts, setArchivedCounts] = useState({}); // trackerId -> archived record count
  // Normalized records index (phase 1: kept in sync with trackers[].records for backward compatibility)
  // Shape: { [trackerId]: { byId: { [recordId]: record }, allIds: string[] }}
  const [recordsIndex, setRecordsIndex] = useState({});

  // Helper: rebuild full index from current trackers array (used at hydration or dev fallback)
  const rebuildIndexFromTrackers = useCallback((trackerList) => {
    const next = {};
    for (const t of trackerList) {
      const byId = {};
      const allIds = [];
      (t.records || []).forEach(r => { if (r && r.id) { byId[r.id] = r; allIds.push(r.id); }});
      next[t.id] = { byId, allIds };
    }
    return next;
  }, []);

  // Apply migrations sequentially up to current schema version
  const runMigrations = (rawData, startVersion) => {
    let version = startVersion;
    let data = rawData;
    while (version < TRACKERS_SCHEMA_VERSION) {
      const migrate = trackerMigrations[version];
      if (typeof migrate === 'function') {
        try {
          data = migrate(data);
        } catch (err) {
          console.warn('Tracker migration failed at version', version, err);
          // Break to avoid infinite loop; return best-effort data
          break;
        }
      }
      version += 1;
    }
    return { data, version };
  };

  // Hydrate from storage with versioned format
  const hydrate = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [tJson, sJson, rJson, aMetaJson] = await Promise.all([
        AsyncStorage.getItem('tracker_data'),
        AsyncStorage.getItem('tracker_selected'),
        AsyncStorage.getItem('tracker_retention'),
        AsyncStorage.getItem('tracker_archive_meta')
      ]);

      if (tJson) {
        let parsed = null;
        try { parsed = JSON.parse(tJson); } catch { parsed = null; }
        let storedVersion = 0;
        let dataArray = [];
        if (parsed) {
          if (Array.isArray(parsed)) {
            // legacy unversioned array => treat as v0
            dataArray = parsed;
            storedVersion = 0;
          } else if (parsed && Array.isArray(parsed.data)) {
            dataArray = parsed.data;
            storedVersion = parsed.__v || 0;
          }
        }
        const { data: migrated, version: finalVersion } = runMigrations(dataArray, storedVersion);
  setTrackers(migrated);
  setRecordsIndex(rebuildIndexFromTrackers(migrated));
        if (finalVersion !== storedVersion) {
          // Persist upgraded structure
          AsyncStorage.setItem('tracker_data', JSON.stringify({ __v: finalVersion, data: migrated })).catch(()=>{});
        }
      }

      if (sJson) {
        const parsedSel = JSON.parse(sJson);
        if (Array.isArray(parsedSel)) setSelectedTrackerIds(parsedSel);
      }
      if (rJson) {
        try {
          const parsedR = JSON.parse(rJson);
          if (parsedR && typeof parsedR === 'object') {
            if (typeof parsedR.perTrackerLimit === 'number' && parsedR.perTrackerLimit > 0) {
              // clamp to avoid unbounded memory
              parsedR.perTrackerLimit = Math.min(parsedR.perTrackerLimit, 20000);
            }
            if (!['prune','archive'].includes(parsedR.strategy)) parsedR.strategy = 'prune';
            setRetentionConfig(prev => ({ ...prev, ...parsedR }));
          }
        } catch {}
      }
      if (aMetaJson) {
        try { const parsedM = JSON.parse(aMetaJson); if (parsedM && typeof parsedM === 'object') setArchivedCounts(parsedM); } catch {}
      }
    } catch (e) {
      console.warn('Failed to hydrate trackers', e);
      setError('Could not load trackers');
    } finally {
      setHydrated(true); setLoading(false);
    }
  }, []);

  useEffect(() => { hydrate(); }, [hydrate]);

  // Persist trackers & selection (debounced minimal)
  // Debounced persistence to reduce write churn
  useEffect(() => {
    if (!hydrated) return;
    if (saveTimer) clearTimeout(saveTimer);
    const t = setTimeout(() => {
      AsyncStorage.setItem('tracker_data', JSON.stringify({ __v: TRACKERS_SCHEMA_VERSION, data: trackers })).catch(()=>{});
    }, 350);
    setSaveTimer(t);
    return () => clearTimeout(t);
  }, [trackers, hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem('tracker_selected', JSON.stringify(selectedTrackerIds)).catch(()=>{});
  }, [selectedTrackerIds, hydrated]);
  // Add tracker to main page
  const addTrackerToMain = useCallback((id) => {
    setSelectedTrackerIds(prev => prev.includes(id) ? prev : [...prev, id]);
  }, []);

  // Remove tracker from main page and delete its data
  const removeTrackerFromMain = useCallback((id) => {
    setSelectedTrackerIds(prev => prev.filter(tid => tid !== id));
    setTrackers(prev => prev.map(t => t.id === id ? { ...t, records: [], value: 0 } : t));
  }, []);

  const addTracker = useCallback((tracker) => {
    if (!tracker || typeof tracker !== 'object') return;
    setTrackers(prev => ([
      ...prev,
      {
        ...tracker,
        id: tracker.id || Date.now().toString(),
        filterField: tracker.filterField || null,
        fields: tracker.fields || (tracker.unit ? [{ id: 'primary', label: tracker.title, unit: tracker.unit, inherited: false }] : []),
        valueFieldId: tracker.valueFieldId || (tracker.fields && tracker.fields[0]?.id) || (tracker.unit ? 'primary' : null),
        records: tracker.records || []
      }
    ]));
  }, []);

  // Increment a tracker value (e.g. adding pages read) by delta
  // Add a record (currently optimized for reading). record: {title,pages,duration}
  const addRecord = useCallback((trackerId, record) => {
    let toArchive = null;
    setTrackers(prev => prev.map(t => {
      if (t.id !== trackerId) return t;
      const id = record.id || Date.now().toString();
      const dateStr = record.date || new Date().toISOString().slice(0,10);
      const existing = t.records || [];
      let newRecord = { id, date: dateStr, createdAt: new Date().toISOString(), ...record };
      if (trackerId === 'reading') {
        newRecord.pages = Number(record.pages) || 0;
        newRecord.duration = Number(record.duration) || 0;
      } else if (trackerId === 'expense') {
        newRecord.amount = Number(record.amount) || 0;
      } else if (trackerId === 'workout') {
        newRecord.sets = Number(record.sets) || 0;
        newRecord.reps = Number(record.reps) || 0;
        newRecord.time = Number(record.time) || 0;
      } else if (trackerId === 'meditation') {
        newRecord.duration = Number(record.duration) || 0;
        newRecord.satisfaction = record.satisfaction;
      }
      let records = [...existing, newRecord];
      // Retention enforcement
      const limit = retentionConfig?.perTrackerLimit || 0;
      if (limit > 0 && records.length > limit) {
        // sort by date then createdAt fallback
        const sortable = [...records].sort((a,b) => {
          const ad = (a.date || a.createdAt || '');
          const bd = (b.date || b.createdAt || '');
            if (ad < bd) return -1; if (ad > bd) return 1; return 0;
        });
        const removeCount = records.length - limit;
        const removed = sortable.slice(0, removeCount);
        const keepSet = new Set(removed.map(r => r.id));
        records = records.filter(r => !keepSet.has(r.id));
        if (retentionConfig.strategy === 'archive' && removed.length) {
          toArchive = { trackerId, removed };
        }
      }
      const value = aggregateValue(t, records);
  return { ...t, records, value };
    }));
    // Update index synchronously
    setRecordsIndex(prev => {
      const next = { ...prev };
      const bucket = next[trackerId] ? { ...next[trackerId] } : { byId: {}, allIds: [] };
      const newId = record.id || Date.now().toString();
      const existing = bucket.byId[newId];
      const newRec = existing ? { ...existing, ...record } : { id: newId, ...record };
      // Ensure date & createdAt (mirror logic above but cheaper)
      if (!newRec.date) newRec.date = new Date().toISOString().slice(0,10);
      if (!newRec.createdAt) newRec.createdAt = new Date().toISOString();
      bucket.byId[newRec.id] = newRec;
      if (!bucket.allIds.includes(newRec.id)) bucket.allIds = [...bucket.allIds, newRec.id];
      next[trackerId] = bucket;
      return next;
    });
    // Handle archiving outside state mutation
    if (toArchive && toArchive.removed?.length) {
      (async () => {
        try {
          const key = 'tracker_archive_' + toArchive.trackerId;
          const existingJson = await AsyncStorage.getItem(key);
          let existingArr = [];
          if (existingJson) { try { const p = JSON.parse(existingJson); if (Array.isArray(p)) existingArr = p; } catch {} }
          const updated = [...existingArr, ...toArchive.removed];
          // Cap archive growth at 50k for safety
          const ARCHIVE_CAP = 50000;
          let final = updated;
          if (updated.length > ARCHIVE_CAP) {
            final = updated.slice(updated.length - ARCHIVE_CAP);
          }
          await AsyncStorage.setItem(key, JSON.stringify(final));
          setArchivedCounts(prev => {
            const next = { ...prev, [toArchive.trackerId]: (prev[toArchive.trackerId] || 0) + toArchive.removed.length };
            AsyncStorage.setItem('tracker_archive_meta', JSON.stringify(next)).catch(()=>{});
            return next;
          });
        } catch (e) { console.warn('Archive failed', e); }
      })();
    }
  }, [retentionConfig]);

  const updateTracker = useCallback((trackerId, patch) => {
    try {
      if (!trackerId || !patch) return;
      setTrackers(prev => prev.map(t => {
        if (t.id !== trackerId) return t;
        // Ensure fields array integrity if provided
        let newFields = patch.fields ? patch.fields : t.fields;
        // If filterField removed or invalid, null it
        let newFilterField = patch.filterField !== undefined ? patch.filterField : t.filterField;
        if (newFilterField && newFields && !newFields.find(f => f.id === newFilterField) && !['title','category','payType','workoutType','satisfaction'].includes(newFilterField)) {
          newFilterField = null;
        }
        // Determine valueFieldId patch logic: preserve existing if still present, else switch to first field
        let valueFieldId = t.valueFieldId;
        if (patch.valueFieldId) {
          valueFieldId = patch.valueFieldId; // explicit override
        } else if (newFields && valueFieldId && !newFields.find(f => f.id === valueFieldId)) {
          valueFieldId = newFields[0]?.id || null;
        } else if (!valueFieldId) {
            valueFieldId = newFields && newFields[0] ? newFields[0].id : null;
        }
  return { ...t, ...patch, fields: newFields, filterField: newFilterField, valueFieldId };
      }));
    } catch (error) {
      console.error('Error updating tracker:', error);
    }
  }, []);
  const updateRecord = useCallback((trackerId, recordId, patch) => {
    try {
      if (!trackerId || !recordId || !patch) {
        console.error('Invalid parameters provided to updateRecord');
        return;
      }
      setTrackers(prev => prev.map(t => {
        if (t.id !== trackerId) return t;
        const records = (t.records || []).map(r => r.id === recordId ? { ...r, ...patch } : r);
        const value = aggregateValue(t, records);
        return { ...t, records, value };
      }));
      setRecordsIndex(prev => {
        const bucket = prev[trackerId];
        if (!bucket || !bucket.byId[recordId]) return prev; // nothing to update
        return {
          ...prev,
          [trackerId]: {
            ...bucket,
            byId: { ...bucket.byId, [recordId]: { ...bucket.byId[recordId], ...patch } }
          }
        };
      });
    } catch (error) {
      console.error('Error updating record:', error);
    }
  }, []);

  const deleteRecord = useCallback((trackerId, recordId) => {
    try {
      if (!trackerId || !recordId) return;
      setTrackers(prev => prev.map(t => {
        if (t.id !== trackerId) return t;
        const records = (t.records || []).filter(r => r.id !== recordId);
        const value = aggregateValue(t, records);
        return { ...t, records, value };
      }));
      setRecordsIndex(prev => {
        const bucket = prev[trackerId];
        if (!bucket || !bucket.byId[recordId]) return prev;
        const { [recordId]: _removed, ...rest } = bucket.byId;
        return {
          ...prev,
          [trackerId]: {
            byId: rest,
            allIds: bucket.allIds.filter(id => id !== recordId)
          }
        };
      });
    } catch (error) {
      console.error('Error deleting record:', error);
    }
  }, []);

  // Restore a previously deleted record (for undo snackbar)
  const restoreRecord = useCallback((trackerId, record) => {
    try {
      if (!trackerId || !record || !record.id) return;
      setTrackers(prev => prev.map(t => {
        if (t.id !== trackerId) return t;
        if ((t.records || []).some(r => r.id === record.id)) return t; // already exists
        const records = [...(t.records || []), { ...record }];
        const value = aggregateValue(t, records);
        return { ...t, records, value };
      }));
      setRecordsIndex(prev => {
        const bucket = prev[trackerId] ? { ...prev[trackerId] } : { byId: {}, allIds: [] };
        if (bucket.byId[record.id]) return prev; // already present
        const nextBucket = {
          byId: { ...bucket.byId, [record.id]: { ...record } },
          allIds: [...bucket.allIds, record.id]
        };
        return { ...prev, [trackerId]: nextBucket };
      });
    } catch (error) {
      console.error('Error restoring record:', error);
    }
  }, []);

  // Helper to compute card value based on tracker id
  const aggregateValue = (tracker, records) => {
    // If we have a declared primary (valueFieldId), sum it
    if (tracker.valueFieldId) {
      return records.reduce((sum, r) => {
        const vRaw = r[tracker.valueFieldId];
        const v = typeof vRaw === 'string' ? parseFloat(vRaw) : vRaw;
        return sum + (Number(v) || 0);
      }, 0);
    }
    // Fallback to legacy built-in switch
    switch (tracker.id) {
      case 'reading': return records.reduce((sum, r) => sum + (Number(r.pages) || 0), 0);
      case 'expense': return records.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
      case 'workout': return records.reduce((sum, r) => sum + (Number(r.time) || 0), 0);
      case 'meditation': return records.reduce((sum, r) => sum + (Number(r.duration) || 0), 0);
      default: return tracker.value;
    }
  };
  const value = { trackers, addTracker, addRecord, updateRecord, deleteRecord, restoreRecord, updateTracker, selectedTrackerIds, addTrackerToMain, removeTrackerFromMain, hydrated, loading, error, retryHydrate: hydrate, recordsIndex };
  // Retention helpers
  const updateRetentionConfig = useCallback(patch => {
    setRetentionConfig(prev => {
      const next = { ...prev, ...patch };
      if (typeof next.perTrackerLimit !== 'number' || next.perTrackerLimit <= 0) next.perTrackerLimit = 1000;
      next.perTrackerLimit = Math.min(next.perTrackerLimit, 20000);
      if (!['prune','archive'].includes(next.strategy)) next.strategy = 'prune';
      AsyncStorage.setItem('tracker_retention', JSON.stringify(next)).catch(()=>{});
      return next;
    });
  }, []);
  const getArchivedCount = useCallback(id => archivedCounts[id] || 0, [archivedCounts]);
  const fetchArchivedRecords = useCallback(async (id) => {
    try { const raw = await AsyncStorage.getItem('tracker_archive_'+id); if (!raw) return []; const parsed = JSON.parse(raw); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
  }, []);
  const contextValue = { ...value, retentionConfig, updateRetentionConfig, getArchivedCount, fetchArchivedRecords };
  return <TrackersContext.Provider value={contextValue}>{children}</TrackersContext.Provider>;
}

export function useTrackers() {
  const ctx = useContext(TrackersContext);
  if (!ctx) {
    if (__DEV__) console.warn('useTrackers called outside TrackersProvider – returning inert fallback');
    return {
      trackers: [], selectedTrackerIds: [], addTracker: () => {}, addRecord: () => {}, updateRecord: () => {}, deleteRecord: () => {}, restoreRecord: () => {}, updateTracker: () => {}, addTrackerToMain: () => {}, removeTrackerFromMain: () => {}, hydrated: false, loading: true, error: 'TrackersProvider missing', retryHydrate: () => {}, retentionConfig: { perTrackerLimit:1000, strategy:'prune' }, updateRetentionConfig: () => {}, getArchivedCount: () => 0, fetchArchivedRecords: async () => [], recordsIndex: {}
    };
  }
  return ctx;
}

// Selector hook: get records for a tracker (sorted by date then createdAt)
export function useTrackerRecords(trackerId) {
  const { recordsIndex, trackers } = useTrackers();
  return useMemo(() => {
    if (!trackerId) return [];
    const bucket = recordsIndex?.[trackerId];
    if (bucket) {
      const arr = bucket.allIds.map(id => bucket.byId[id]).filter(Boolean);
      return arr.sort((a,b) => {
        const ad = (a.date || a.createdAt || '');
        const bd = (b.date || b.createdAt || '');
        if (ad < bd) return -1; if (ad > bd) return 1;
        const ac = a.createdAt || '';
        const bc = b.createdAt || '';
        if (ac < bc) return -1; if (ac > bc) return 1;
        return 0;
      });
    }
    // Fallback to searching trackers array if index not ready
    const t = trackers.find(t => t.id === trackerId);
    return (t?.records || []).slice();
  }, [recordsIndex, trackers, trackerId]);
}

// Selector hook: specialized reading stats (can be extended later)
export function useReadingStats() {
  const records = useTrackerRecords('reading');
  return useMemo(() => {
    let totalPages = 0; let totalDuration = 0;
    for (const r of records) {
      totalPages += Number(r.pages) || 0;
      totalDuration += Number(r.duration) || 0;
    }
    const pagesPerHour = totalDuration > 0 ? (totalPages / (totalDuration / 60)) : 0;
    return { totalPages, totalDuration, pagesPerHour };
  }, [records]);
}

export const __TRACKERS_CTX_VERSION = __TRACKERS_HOOK_VERSION;
