import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useTrackers } from './TrackersContext';

export default function DisplayTrackerFieldsScreen({ route, navigation }) {
  const { trackerId } = route.params || {};
  const { trackers, updateTracker } = useTrackers();
  const tracker = trackers.find(t => t.id === trackerId);

  const candidates = useMemo(() => {
    if (!tracker) return [];
    const fieldMeta = (tracker.fields || []).reduce((acc,f)=>{ acc[f.id] = f; return acc; }, {});
    const numericKeys = new Set();
    // Built-in expected numeric/raw fields per tracker even if no records yet
    const builtinExpected = {
      reading: ['pages','duration'],
      expense: ['amount'],
      workout: ['time','sets','reps'],
      meditation: ['duration','satisfaction']
    };
    (builtinExpected[tracker.id] || []).forEach(k => numericKeys.add(k));
    // Recent record scan for numeric (number or numeric string)
    (tracker.records || []).slice(-50).forEach(r => {
      Object.keys(r).forEach(k => {
        if (['id','date','createdAt','title'].includes(k)) return;
        const v = r[k];
        if (typeof v === 'number' && !Number.isNaN(v)) numericKeys.add(k);
        else if (typeof v === 'string' && v.trim() && !isNaN(parseFloat(v))) numericKeys.add(k);
      });
    });
    Object.keys(fieldMeta).forEach(k => numericKeys.add(k));
    // Derived metric options per tracker
    const derived = [];
    if (tracker.id === 'reading') derived.push({ id:'derived_pagesPerHour', label:'Pages / hour' });
    if (tracker.id === 'expense') {
      derived.push({ id:'derived_avgAmount', label:'Average Amount' });
      derived.push({ id:'derived_count', label:'Entry Count' });
    }
    if (tracker.id === 'workout') {
      derived.push({ id:'derived_totalSets', label:'Total Sets' });
      derived.push({ id:'derived_totalReps', label:'Total Reps' });
      derived.push({ id:'derived_volume', label:'Volume (Sets x Reps)' });
    }
    if (tracker.id === 'meditation') {
      derived.push({ id:'derived_avgSatisfaction', label:'Avg Satisfaction' });
    }
    const base = Array.from(numericKeys).map(id => ({ id, label: fieldMeta[id]?.label || (id.charAt(0).toUpperCase()+id.slice(1)) }));
    // Merge (avoid duplicates)
    const seen = new Set();
    const merged = [];
    [...base, ...derived].forEach(c => { if (!seen.has(c.id)) { seen.add(c.id); merged.push(c); } });
    return merged;
  }, [tracker]);

  const [selected, setSelected] = useState(() => tracker?.displayFields && tracker.displayFields.length ? [...tracker.displayFields] : tracker?.valueFieldId ? [tracker.valueFieldId] : []);

  const toggle = (id) => {
    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 2) {
        Alert.alert('Limit reached','You can show up to 2 measurements on the card.');
        return prev;
      }
      return [...prev, id];
    });
  };

  const save = () => {
    if (!tracker) return;
    updateTracker(tracker.id, { displayFields: selected });
    navigation.goBack();
  };

  if (!tracker) {
    return (
      <View style={s.screen}> 
        <Text style={{ color:'#fff', marginTop:80 }}>Tracker not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.back}>&lt; Back</Text></TouchableOpacity>
      <Text style={s.heading}>Display Fields</Text>
      <Text style={s.sub}>Choose up to 2 measurements to show on the {tracker.title} card.</Text>
      <View style={s.list}>
        {candidates.map(c => {
          const active = selected.includes(c.id);
          return (
            <TouchableOpacity key={c.id} style={[s.row, active && s.rowActive]} onPress={() => toggle(c.id)} activeOpacity={0.7}>
              <Text style={s.rowLabel}>{c.label}</Text>
              <View style={[s.checkbox, active && s.checkboxOn]}>{active && <Text style={s.checkTxt}>✓</Text>}</View>
            </TouchableOpacity>
          );
        })}
        {candidates.length === 0 && <Text style={s.empty}>No numeric fields available yet.</Text>}
      </View>
      <TouchableOpacity style={[s.saveBtn, { opacity: selected.length ? 1:0.5 }]} disabled={!selected.length} onPress={save}>
        <Text style={s.saveTxt}>Save</Text>
      </TouchableOpacity>
      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex:1, backgroundColor:'#394579' },
  content: { padding:16, paddingTop:72 },
  back: { color:'#FFFFFF', fontSize:14, fontWeight:'600', marginBottom:12 },
  heading: { color:'#FFFFFF', fontSize:22, fontWeight:'700', marginBottom:8 },
  sub: { color:'rgba(255,255,255,0.75)', fontSize:13, marginBottom:16 },
  list: { },
  row: { backgroundColor:'rgba(255,255,255,0.08)', padding:14, borderRadius:14, flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:10 },
  rowActive: { backgroundColor:'rgba(16,185,129,0.25)', borderWidth:1, borderColor:'#10B981' },
  rowLabel: { color:'#FFFFFF', fontSize:15, fontWeight:'500' },
  checkbox: { width:26, height:26, borderRadius:8, backgroundColor:'rgba(255,255,255,0.15)', alignItems:'center', justifyContent:'center' },
  checkboxOn: { backgroundColor:'#10B981' },
  checkTxt: { color:'#FFFFFF', fontSize:16, fontWeight:'700', marginTop:-2 },
  empty: { color:'rgba(255,255,255,0.6)', fontSize:13 },
  saveBtn: { backgroundColor:'#10B981', paddingVertical:16, borderRadius:18, alignItems:'center', marginTop:12 },
  saveTxt: { color:'#FFFFFF', fontSize:16, fontWeight:'700', letterSpacing:0.5 }
});
