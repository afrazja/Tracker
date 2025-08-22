import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import dayjs from 'dayjs';
import ScreenHeader from './components/ScreenHeader';
import { useGoals } from './GoalsContext';
import { useTrackers } from './TrackersContext';
import DateInput from './components/DateInput';

export default function AddGoalScreen({ navigation }) {
  const { addGoal } = useGoals();
  const { trackers } = useTrackers();

  // Single-step form now (goalType selection removed; streak goals handled separately)
  const [name, setName] = useState('');
  const [selectedTrackers, setSelectedTrackers] = useState(['reading']);
  const [target, setTarget] = useState('');
  const [timeframe, setTimeframe] = useState('daily');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const today = dayjs().format('YYYY-MM-DD');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  function toggleTracker(id) {
    setSelectedTrackers(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  }

  function back() { navigation.goBack(); }

  const [errors, setErrors] = useState({});
  function validate() {
    const e = {};
    if (!name.trim()) e.name = 'Name is required';
    if (!selectedTrackers.length) e.trackers = 'Select at least one tracker';
    if (!target || isNaN(Number(target)) || Number(target) <= 0) e.target = 'Enter a positive number';
    const tfValid = ['daily','weekly','monthly','yearly'].includes(timeframe.trim());
    if (!tfValid) e.timeframe = 'Use daily / weekly / monthly / yearly';
  const sDt = dayjs(startDate, 'YYYY-MM-DD', true);
  const eDt = dayjs(endDate, 'YYYY-MM-DD', true);
  if (!sDt.isValid()) e.startDate = 'Invalid date';
  if (!eDt.isValid()) e.endDate = 'Invalid date';
  if (sDt.isValid() && eDt.isValid() && sDt.isAfter(eDt)) e.range = 'Start must be before end';
    setErrors(e);
    return Object.keys(e).length === 0;
  }
  function create() {
    try {
      if (!validate()) return;
      const unit = trackers.find(t => t.id === selectedTrackers[0])?.unit || '';
      const mappedType = timeframe === 'daily' ? 'daily' : 'total';
      addGoal({
        type: mappedType,
        name: name.trim(),
        trackerIds: selectedTrackers,
        target: Number(target) || 0,
        unit,
        timeframe: timeframe.trim(),
        startDate: startDate || today,
        endDate: endDate || today,
      });
      navigation.goBack();
    } catch (error) {
      console.error('Error creating goal:', error);
      alert('Error creating goal. Please try again.');
    }
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <ScreenHeader title="Add Goal" onBack={back} />
      <View style={s.card}>
        <View style={s.formGroup}>
          <Text style={s.label}>Goal name</Text>
          <TextInput style={s.input} placeholder="e.g., Read 50 pages" value={name} onChangeText={setName} />
          {errors.name ? <Text style={s.error}>{errors.name}</Text> : null}
        </View>
        <View style={s.formGroup}>
          <Text style={s.label}>Trackers</Text>
          <View style={s.chipsWrap}>
            {trackers.map(t => (
              <TouchableOpacity key={t.id} style={[s.chip, selectedTrackers.includes(t.id) && s.chipActive]} onPress={() => toggleTracker(t.id)}>
                <Text style={[s.chipTxt, selectedTrackers.includes(t.id) && s.chipTxtActive]}>{t.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.trackers ? <Text style={s.error}>{errors.trackers}</Text> : null}
        </View>
        <View style={s.formGroup}>
          <Text style={s.label}>Goal value</Text>
          <TextInput style={s.input} placeholder="e.g., 50" keyboardType="numeric" value={target} onChangeText={setTarget} />
          {errors.target ? <Text style={s.error}>{errors.target}</Text> : null}
        </View>
        <TouchableOpacity activeOpacity={0.7} onPress={() => setShowAdvanced(s=>!s)} style={s.advHeader}>
          <Text style={s.advHeaderTxt}>Advanced (timeframe & dates)</Text>
          <Text style={s.advChevron}>{showAdvanced ? '▲':'▼'}</Text>
        </TouchableOpacity>
        {showAdvanced && (
          <>
            <View style={s.formGroup}>
              <Text style={s.label}>Timeframe (daily / weekly / monthly)</Text>
              <TextInput style={s.input} placeholder="daily" value={timeframe} onChangeText={setTimeframe} />
              {errors.timeframe ? <Text style={s.error}>{errors.timeframe}</Text> : null}
            </View>
            <View style={[s.formGroup, s.row]}>
              <DateInput label="Start date" value={startDate} onChange={setStartDate} />
              <View style={{ width:12 }} />
              <DateInput label="End date" value={endDate} onChange={setEndDate} min={startDate} />
            </View>
          </>
        )}
        {errors.startDate ? <Text style={s.error}>{errors.startDate}</Text> : null}
        {errors.endDate ? <Text style={s.error}>{errors.endDate}</Text> : null}
        {errors.range ? <Text style={s.error}>{errors.range}</Text> : null}
        <View style={{ flexDirection:'row', justifyContent:'flex-end', marginTop:4 }}>
          <TouchableOpacity style={[s.secondaryBtn,{ marginRight:12 }]} onPress={back}>
            <Text style={s.secondaryTxt}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.primaryBtn} onPress={create}>
            <Text style={s.primaryTxt}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#394579', padding: 16, paddingTop:72 },
  // header styles removed in favor of shared ScreenHeader
  card: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12, color: '#111827' },
  formGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, backgroundColor: '#F9FAFB', paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6' },
  chipActive: { backgroundColor: '#10B981' },
  chipTxt: { fontSize: 12, fontWeight: '600', color: '#374151' },
  chipTxtActive: { color: 'white' },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  col: { flex:1 },
  primaryBtn: { backgroundColor: '#10B981', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 12 },
  primaryTxt: { color: 'white', fontWeight: '700' },
  secondaryBtn: { backgroundColor: '#F3F4F6', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 12 },
  secondaryTxt: { color: '#111827', fontWeight: '600' },
  advHeader: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingVertical:4, marginTop:4 },
  advHeaderTxt: { fontSize:14, fontWeight:'600', color:'#374151' },
  advChevron: { fontSize:14, fontWeight:'600', color:'#6B7280' }
});
