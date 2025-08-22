import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import ScreenHeader from './components/ScreenHeader';
import { useTrackers } from './TrackersContext';

export default function ReadingDetailScreen({ route, navigation }) {
  const { trackerId = 'reading' } = route.params || {};
  const { trackers, updateRecord, deleteRecord, restoreRecord } = useTrackers();
  const [undo, setUndo] = useState(null); // {trackerId, record}
  const tracker = trackers.find(t => t.id === trackerId);
  const [editing, setEditing] = useState(null); // record id
  const [editValues, setEditValues] = useState({ title: '', pages: '', duration: '', date: '' });

  const records = tracker?.records || [];

  // Memoized aggregate stats (uses length + summed values for dependency proxy)
  const readingAgg = useMemo(() => {
    if (!tracker || tracker.id !== 'reading') return null;
    let totalPages = 0; let totalDuration = 0;
    for (const r of records) { totalPages += Number(r.pages) || 0; totalDuration += Number(r.duration) || 0; }
    const hours = totalDuration / 60;
    const pagesPerHour = hours > 0 ? (totalPages / hours) : 0;
    return { totalPages, totalDuration, pagesPerHour };
  }, [tracker?.id, records.length, ...records.slice(0,50).map(r=>r.id)]); // cheap length/id dependency; deep values not required for recalculation frequency
  // auto-hide undo snackbar
  useEffect(() => {
    if (!undo) return;
    const t = setTimeout(() => setUndo(null), 5000);
    return () => clearTimeout(t);
  }, [undo]);
  
  // Early return if tracker not found
  if (!tracker) {
    return (
      <View style={s.container}>
  <ScreenHeader title="Tracker Not Found" onBack={() => navigation.goBack()} />
        <Text style={s.empty}>The requested tracker could not be found.</Text>
      </View>
    );
  }

  // Dynamic columns based on tracker fields + derived pagesPerHour
  const config = useMemo(() => {
    if (!tracker) return { columns: [], buildRow: () => [] };
    // Special layout for reading so title / pages / duration / pagesPerHour / date always appear & align.
    if (tracker.id === 'reading') {
      const cols = [
        { id:'title', label:'Title' },
        { id:'pages', label:'Pages' },
        { id:'duration', label:'Duration (min)' },
        { id:'pagesPerHour', label:'Pages/hr' },
        { id:'date', label:'Date' }
      ];
      return {
        columns: cols,
        buildRow: r => {
          const pagesNum = Number(r.pages) || 0;
          const durationNum = Number(r.duration) || 0; // minutes
          const hours = durationNum > 0 ? durationNum / 60 : 0;
          const pph = hours > 0 ? (pagesNum / hours) : null;
          return cols.map(c => {
            if (c.id === 'pagesPerHour') return pph == null ? '' : pph.toFixed(1);
            return r[c.id];
          });
        }
      };
    }
    // Fallback generic behaviour (should not normally run for reading)
    const declared = (tracker.fields || []).map(f => ({ id: f.id, label: f.label || f.id }));
    const cols = [...declared, { id:'date', label:'Date' }];
    return { columns: cols, buildRow: r => cols.map(c => r[c.id]) };
  }, [tracker, records]);

  function openEdit(r) {
    setEditing(r.id);
  setEditValues({ title: r.title, pages: String(r.pages), duration: String(r.duration), date: r.date || '' });
  }
  function saveEdit() {
    try {
      if (!editing) return;
      updateRecord(trackerId, editing, {
        title: editValues.title,
        pages: Number(editValues.pages) || 0,
        duration: Number(editValues.duration) || 0,
        date: editValues.date
      });
      setEditing(null);
    } catch (error) {
      console.error('Error saving edit:', error);
    }
  }

  return (
    <View style={s.container}>
  <ScreenHeader title={`${tracker?.title || 'Reading'} Records`} onBack={() => navigation.goBack()} />
      <View style={s.summaryBox}>
        <Text style={s.summaryValue}>{tracker?.value} pages total</Text>
        <Text style={s.summaryUnit}>Sessions: {records.length}</Text>
        <View style={s.structureBox}>
          <Text style={s.structureTitle}>Structure</Text>
          <View style={s.structureTags}>
            {(tracker.fields || []).map(f => (
              <View key={f.id} style={s.tag}><Text style={s.tagTxt}>{f.label || f.id}{f.unit ? ` (${f.unit})` : ''}</Text></View>
            ))}
          </View>
        </View>
        <TouchableOpacity style={s.displayBtn} onPress={() => navigation.navigate('DisplayTrackerFields', { trackerId })}>
          <Text style={s.displayBtnTxt}>Customize Display Fields</Text>
        </TouchableOpacity>
      </View>
      <View style={s.headerRow}>
        {config.columns.map(c => (
          <Text key={c.id} style={[s.hCell, c.id==='title'? { flex:2 } : { flex:1 }]} numberOfLines={1}>{c.label}</Text>
        ))}
  <Text style={[s.hCell, { width: 50 }]}>Edit</Text>
  <Text style={[s.hCell, { width: 60 }]}>Delete</Text>
      </View>
      <FlashList
        data={records}
        keyExtractor={item => item.id}
        estimatedItemSize={52}
        contentContainerStyle={{ paddingBottom: 40 }}
        renderItem={({ item }) => (
          <View style={s.row}>
            {config.buildRow(item).map((v,i) => {
              const col = config.columns[i];
              const isTitle = col.id === 'title';
              const display = (v === 0 || v) ? String(v) : (v === '' ? '' : '—');
              return <Text key={col.id+item.id} style={[s.cell, isTitle ? { flex:2 } : { flex:1 }]} numberOfLines={1}>{display}</Text>;
            })}
            <TouchableOpacity style={s.editBtn} onPress={() => openEdit(item)}>
              <Text style={s.editTxt}>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.deleteBtn} onPress={() => {
              Alert.alert('Delete Record','Are you sure you want to delete this record?',[
                { text:'Cancel', style:'cancel' },
                { text:'Delete', style:'destructive', onPress: () => { setUndo({ trackerId, record: item }); deleteRecord(trackerId, item.id); } }
              ]);
            }}>
              <Text style={s.deleteTxt}>🗑️</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={s.empty}>No reading sessions yet. Tap + on the Reading card to log your first session.</Text>}
      />
      {undo && (
        <View style={s.snackbar}>
          <Text style={s.snackbarText}>Record deleted</Text>
          <TouchableOpacity style={s.snackbarAction} onPress={() => { restoreRecord(undo.trackerId, undo.record); setUndo(null); }}>
            <Text style={s.snackbarActionText}>Undo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.snackbarAction} onPress={() => setUndo(null)}>
            <Text style={s.snackbarActionText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={!!editing} transparent animationType="fade" onRequestClose={() => setEditing(null)}>
        <View style={s.modalBackdrop}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Edit Record</Text>
            <TextInput style={s.input} placeholder="Title" value={editValues.title} onChangeText={t => setEditValues(v => ({ ...v, title: t }))} />
            <TextInput style={s.input} placeholder="Pages" keyboardType="numeric" value={editValues.pages} onChangeText={t => setEditValues(v => ({ ...v, pages: t }))} />
            <TextInput style={s.input} placeholder="Duration (min)" keyboardType="numeric" value={editValues.duration} onChangeText={t => setEditValues(v => ({ ...v, duration: t }))} />
            <TextInput style={s.input} placeholder="Date (YYYY-MM-DD)" value={editValues.date} onChangeText={t => setEditValues(v => ({ ...v, date: t }))} />
            <View style={s.modalActions}>
              <TouchableOpacity style={[s.btn, s.cancel]} onPress={() => setEditing(null)}><Text style={s.btnTxt}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[s.btn, s.save]} onPress={saveEdit}><Text style={[s.btnTxt, { color: '#fff' }]}>Save</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#394579', paddingTop: 80, paddingHorizontal: 16 },
  // header styles removed (using ScreenHeader)
  summaryBox: { backgroundColor: 'rgba(255,255,255,0.15)', padding: 12, borderRadius: 12, marginBottom: 12 },
  summaryValue: { color: 'white', fontWeight: '700' },
  summaryUnit: { color: '#E5E7EB', marginTop: 4 },
  structureBox: { marginTop:8 },
  structureTitle: { color:'#E5E7EB', fontSize:12, fontWeight:'600', marginBottom:4, letterSpacing:0.5 },
  structureTags: { flexDirection:'row', flexWrap:'wrap', gap:6 },
  tag: { backgroundColor:'rgba(255,255,255,0.15)', paddingHorizontal:8, paddingVertical:4, borderRadius:8, marginRight:6, marginBottom:6 },
  tagTxt: { color:'#FFFFFF', fontSize:11, fontWeight:'600' },
  displayBtn: { marginTop:12, backgroundColor:'#10B981', alignSelf:'flex-start', paddingHorizontal:14, paddingVertical:10, borderRadius:12 },
  displayBtnTxt: { color:'#FFFFFF', fontSize:13, fontWeight:'600', letterSpacing:0.5 },
  headerRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.15)', marginBottom: 4 },
  hCell: { color: '#E5E7EB', fontSize: 12, fontWeight: '600', flex: 1 },
  row: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  cell: { color: 'white', fontSize: 14, flex: 1 },
  editBtn: { width: 40, alignItems: 'center' },
  editTxt: { fontSize: 16 },
  deleteBtn: { width: 60, alignItems:'center' },
  deleteTxt: { fontSize:16 },
  empty: { color: '#E5E7EB', marginTop: 20, textAlign: 'center' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  modalCard: { width: '85%', maxWidth: 400, backgroundColor: 'white', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, color: '#111827' },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, backgroundColor: '#F9FAFB', paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, marginBottom: 12 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  btn: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10 },
  cancel: { backgroundColor: '#F3F4F6' },
  save: { backgroundColor: '#10B981' },
  btnTxt: { color: '#111827', fontWeight: '600' },
});
