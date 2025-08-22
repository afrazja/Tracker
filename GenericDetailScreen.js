import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import ScreenHeader from './components/ScreenHeader';
import { useTrackers } from './TrackersContext';

// Generic detail screen for trackers other than reading
export default function GenericDetailScreen({ route, navigation }) {
  const { trackerId } = route.params;
  const { trackers, updateRecord, deleteRecord, restoreRecord } = useTrackers();
  const [undo, setUndo] = useState(null); // {trackerId, record}
  const tracker = trackers.find(t => t.id === trackerId);
  const [editing, setEditing] = useState(null);
  const [values, setValues] = useState({});
  const records = tracker?.records || [];
  // Lightweight memo for summary counts (depends on length + tracker.value)
  const entryCount = records.length;
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

  const config = useMemo(() => {
    if (!tracker) return { columns: [], buildRow: () => [] };
    const declared = (tracker.fields || []).map(f => ({ id: f.id, label: f.label || f.id }));
    const metaKeys = new Set();
    (tracker.records || []).slice(-25).forEach(r => {
      Object.keys(r).forEach(k => {
        if (['id','createdAt'].includes(k)) return;
        if (k === 'date') metaKeys.add('date');
        if (!declared.find(d => d.id === k) && k !== 'date') metaKeys.add(k);
      });
    });
    const extras = Array.from(metaKeys).filter(k => k !== 'date').map(k => ({ id:k, label:k.charAt(0).toUpperCase()+k.slice(1) }));
    let cols = [...declared, ...extras];
    if (metaKeys.has('date') && !cols.some(c => c.id === 'date')) cols.push({ id:'date', label:'Date' });
    // Deduplicate defensively
    const seen = new Set();
    cols = cols.filter(c => (seen.has(c.id) ? false : (seen.add(c.id), true)));
    return { columns: cols, buildRow: r => cols.map(c => r[c.id]) };
  }, [tracker]);

  function openEdit(r) {
    setEditing(r.id);
    setValues(r);
  }
  function saveEdit() {
    try {
      if (!editing) return;
      updateRecord(trackerId, editing, values);
      setEditing(null);
    } catch (error) {
      console.error('Error saving edit:', error);
    }
  }

  return (
    <View style={s.container}>
  <ScreenHeader title={`${tracker?.title} Records`} onBack={() => navigation.goBack()} />
      <View style={s.summaryBox}>
        <Text style={s.summaryValue}>{tracker?.value} {tracker?.unit}</Text>
        <Text style={s.summaryUnit}>Entries: {records.length}</Text>
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
        {config.columns.map((c) => (
          <Text key={c.id} style={[s.hCell, { flex: 1 }]} numberOfLines={1}>{c.label}</Text>
        ))}
  <Text style={[s.hCell, { width: 50 }]}>Edit</Text>
  <Text style={[s.hCell, { width: 60 }]}>Delete</Text>
      </View>
      <FlashList
        data={records}
        keyExtractor={item => item.id}
        estimatedItemSize={52}
        renderItem={({ item }) => (
          <View style={s.row}>
            {config.buildRow(item).map((v, idx) => (
              <Text key={idx} style={[s.cell, { flex: 1 }]} numberOfLines={1}>{(v === 0 || v) ? String(v) : '—'}</Text>
            ))}
            <TouchableOpacity style={s.editBtn} onPress={() => openEdit(item)}><Text style={s.editTxt}>✏️</Text></TouchableOpacity>
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
        ListEmptyComponent={<Text style={s.empty}>No records yet. Use the + button on the tracker card to add your first entry.</Text>}
        contentContainerStyle={{ paddingBottom: 40 }}
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
            <Text style={s.modalTitle}>Edit</Text>
            {Object.keys(values).filter(k => ['id','createdAt'].indexOf(k) === -1).map(k => (
              <TextInput key={k} style={s.input} value={String(values[k] ?? '')} onChangeText={t => setValues(v => ({ ...v, [k]: t }))} placeholder={k} />
            ))}
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
  hCell: { color: '#E5E7EB', fontSize: 12, fontWeight: '600' },
  row: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  cell: { color: 'white', fontSize: 14 },
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
  snackbar: { position:'absolute', left:16, right:16, bottom:24, backgroundColor:'#111827', flexDirection:'row', alignItems:'center', paddingHorizontal:16, paddingVertical:12, borderRadius:14 },
  snackbarText: { color:'#FFFFFF', fontSize:14, fontWeight:'500', flex:1 },
  snackbarAction: { marginLeft:12, paddingHorizontal:8, paddingVertical:4 },
  snackbarActionText: { color:'#10B981', fontSize:14, fontWeight:'700' },
});
