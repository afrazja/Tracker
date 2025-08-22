import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import dayjs from 'dayjs';
import ScreenHeader from './components/ScreenHeader';
import { useGoals } from './GoalsContext';
import { useTrackers } from './TrackersContext';
import DateInput from './components/DateInput';

export default function EditGoalScreen({ route, navigation }) {
  const { goalId } = route.params || {};
  const { goals, updateGoal, deleteGoal } = useGoals();
  const { trackers } = useTrackers();
  const goal = goals.find(g => g.id === goalId);

  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [timeframe, setTimeframe] = useState('daily');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedTrackers, setSelectedTrackers] = useState([]);
  const [errors, setErrors] = useState({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (goal) {
      setName(goal.name || '');
      setTarget(goal.target != null ? String(goal.target) : '');
      setTimeframe(goal.timeframe || 'daily');
  setStartDate(goal.startDate || '');
  setEndDate(goal.endDate || '');
      setSelectedTrackers(goal.trackerIds || []);
    }
  }, [goalId, goal]);

  function toggleTracker(id) {
    setSelectedTrackers(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  }

  function validate() {
    const e = {};
    if (!name.trim()) e.name = 'Name required';
    if (!selectedTrackers.length) e.trackers = 'Pick at least one';
    if (!target || isNaN(Number(target)) || Number(target) <= 0) e.target = 'Positive number';
    const tfValid = ['daily','weekly','monthly','yearly'].includes(timeframe.trim());
    if (!tfValid) e.timeframe = 'Invalid timeframe';
  const sDt = startDate ? dayjs(startDate, 'YYYY-MM-DD', true) : null;
  const eDt = endDate ? dayjs(endDate, 'YYYY-MM-DD', true) : null;
  if (startDate && (!sDt || !sDt.isValid())) e.startDate = 'Bad start date';
  if (endDate && (!eDt || !eDt.isValid())) e.endDate = 'Bad end date';
  if (sDt && eDt && sDt.isAfter(eDt)) e.range = 'Start > End';
    setErrors(e);
    return Object.keys(e).length === 0;
  }
  function save() {
    try {
      if (!goal) return;
      if (!validate()) return;
      updateGoal(goal.id, {
        name: name.trim(),
        target: Number(target) || 0,
        timeframe: timeframe.trim() || 'daily',
        startDate: startDate || '',
        endDate: endDate || '',
        trackerIds: selectedTrackers,
      });
      Alert.alert('Saved', 'Goal updated');
      navigation.goBack();
    } catch (error) {
      console.error('Error saving goal:', error);
      Alert.alert('Error', 'Could not save goal');
    }
  }

  function remove() {
    if (!goal) return;
    Alert.alert('Delete Goal', 'Are you sure you want to delete this goal?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deleteGoal(goal.id); navigation.goBack(); } }
    ]);
  }

  if (!goal) {
    return (
      <View style={s.container}> 
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.back}>&lt; Back</Text></TouchableOpacity>
        <Text style={s.missing}>Goal not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <ScreenHeader title="Edit Goal" onBack={() => navigation.goBack()} />
      <View style={s.card}>
  <Text style={s.label}>Name</Text>
  <TextInput style={[s.input, errors.name && s.inputError]} value={name} placeholder="Goal name" onChangeText={setName} />
  {errors.name ? <Text style={s.error}>{errors.name}</Text> : null}
        <Text style={[s.label,{marginTop:16}]}>Trackers</Text>
  <View style={s.chipsWrap}>
          {trackers.map(t => (
            <TouchableOpacity key={t.id} style={[s.chip, selectedTrackers.includes(t.id) && s.chipActive]} onPress={() => toggleTracker(t.id)}>
              <Text style={[s.chipTxt, selectedTrackers.includes(t.id) && s.chipTxtActive]}>{t.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
  {errors.trackers ? <Text style={s.error}>{errors.trackers}</Text> : null}
  <Text style={[s.label,{marginTop:16}]}>Goal ({goal.unit || ''})</Text>
  <TextInput style={[s.input, errors.target && s.inputError]} value={target} onChangeText={setTarget} placeholder="e.g. 50" keyboardType="numeric" />
  {errors.target ? <Text style={s.error}>{errors.target}</Text> : null}
        <TouchableOpacity activeOpacity={0.7} onPress={() => setShowAdvanced(s=>!s)} style={s.advHeader}>
          <Text style={s.advHeaderTxt}>Advanced (timeframe & dates)</Text>
          <Text style={s.advChevron}>{showAdvanced ? '▲':'▼'}</Text>
        </TouchableOpacity>
        {showAdvanced && (
          <>
            <Text style={[s.label,{marginTop:16}]}>Timeframe</Text>
            <TextInput style={[s.input, errors.timeframe && s.inputError]} value={timeframe} onChangeText={setTimeframe} placeholder="daily / weekly / monthly" />
            {errors.timeframe ? <Text style={s.error}>{errors.timeframe}</Text> : null}
            <View style={[s.row,{marginTop:16}]}> 
              <DateInput label="Start date" value={startDate} onChange={setStartDate} />
              <View style={{ width:12 }} />
              <DateInput label="End date" value={endDate} onChange={setEndDate} min={startDate} />
            </View>
            {errors.range ? <Text style={s.error}>{errors.range}</Text> : null}
          </>
        )}
      </View>
      <View style={s.actions}>
        <TouchableOpacity style={[s.deleteBtn]} onPress={remove}><Text style={s.deleteTxt}>Delete</Text></TouchableOpacity>
        <TouchableOpacity style={s.saveBtn} onPress={save}><Text style={s.saveTxt}>Save</Text></TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex:1, backgroundColor:'#394579', padding:16, paddingTop:72 },
  // header styles replaced by shared ScreenHeader
  missing: { color:'white', marginTop:24, fontSize:16 },
  card: { backgroundColor:'white', borderRadius:16, padding:16 },
  label: { fontSize:14, fontWeight:'600', color:'#374151', marginBottom:6 },
  input: { borderWidth:1, borderColor:'#E5E7EB', borderRadius:12, backgroundColor:'#F9FAFB', paddingHorizontal:12, paddingVertical:10, fontSize:14 },
  chipsWrap: { flexDirection:'row', flexWrap:'wrap', gap:8 },
  chip: { paddingHorizontal:12, paddingVertical:8, borderRadius:20, backgroundColor:'#F3F4F6' },
  chipActive: { backgroundColor:'#10B981' },
  chipTxt: { fontSize:12, fontWeight:'600', color:'#374151' },
  chipTxtActive: { color:'white' },
  actions: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginTop:24 },
  saveBtn: { backgroundColor:'#10B981', paddingHorizontal:24, paddingVertical:14, borderRadius:14 },
  saveTxt: { color:'white', fontWeight:'700' },
  deleteBtn: { backgroundColor:'#DC2626', paddingHorizontal:24, paddingVertical:14, borderRadius:14 },
  deleteTxt: { color:'white', fontWeight:'700' },
  row: { flexDirection:'row', alignItems:'flex-start' },
  col: { flex:1 },
  advHeader: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingVertical:4, marginTop:8 },
  advHeaderTxt: { fontSize:14, fontWeight:'600', color:'#374151' },
  advChevron: { fontSize:14, fontWeight:'600', color:'#6B7280' }
});
