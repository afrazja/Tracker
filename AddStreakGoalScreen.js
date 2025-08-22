import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import ScreenHeader from './components/ScreenHeader';
import { useTrackers } from './TrackersContext';
import { useStreakGoals } from './StreakGoalsContext';

export default function AddStreakGoalScreen({ navigation }) {
  const { trackers } = useTrackers();
  const { addStreakGoal } = useStreakGoals();
  const [name, setName] = useState('');
  const [trackerId, setTrackerId] = useState(trackers[0]?.id || '');
  const [targetDays, setTargetDays] = useState('7');
  const [showTrackerList, setShowTrackerList] = useState(false);
  const [errors, setErrors] = useState({});

  function validate() {
    const e = {};
    if (!name.trim()) e.name = 'Name required';
    if (!trackerId) e.trackerId = 'Pick tracker';
    if (!targetDays || isNaN(Number(targetDays))) e.targetDays = 'Valid number';
    setErrors(e);
    return Object.keys(e).length === 0;
  }
  function submit() {
    if (!validate()) return;
    addStreakGoal({ name, trackerId, targetDays: Number(targetDays) });
    navigation.goBack();
  }

  return (
    <ScrollView style={s.screen} contentContainerStyle={{ padding:16, paddingTop:72, paddingBottom:48 }}>
      <ScreenHeader title="New Streak Goal" onBack={() => navigation.goBack()} />
      <View style={s.card}>
        <Text style={s.label}>Name</Text>
        <TextInput style={[s.input, errors.name && s.inputError]} value={name} onChangeText={setName} placeholder="Daily Reading" />
        {errors.name && <Text style={s.error}>{errors.name}</Text>}

        <Text style={[s.label,{ marginTop:16 }]}>Tracker</Text>
        <View style={s.pickerWrap}>
          <TouchableOpacity style={s.pickerBtn} onPress={() => setShowTrackerList(o=>!o)}>
            <Text style={s.pickerTxt}>{trackers.find(t => t.id === trackerId)?.title || 'Select tracker'}</Text>
            <Text style={s.pickerCaret}>▼</Text>
          </TouchableOpacity>
          {showTrackerList && (
            <View style={s.dropdown}>
              {trackers.map(t => (
                <TouchableOpacity key={t.id} style={s.dropdownItem} onPress={() => { setTrackerId(t.id); setShowTrackerList(false); }}>
                  <Text style={s.dropdownItemText}>{t.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        {errors.trackerId && <Text style={s.error}>{errors.trackerId}</Text>}

        <Text style={[s.label,{ marginTop:16 }]}>Target days</Text>
        <TextInput style={[s.input, errors.targetDays && s.inputError]} value={targetDays} onChangeText={setTargetDays} keyboardType='numeric' placeholder='7' />
        {errors.targetDays && <Text style={s.error}>{errors.targetDays}</Text>}
      </View>
      <View style={s.actions}>
        <TouchableOpacity style={s.primary} onPress={submit}><Text style={s.primaryTxt}>Create</Text></TouchableOpacity>
        <TouchableOpacity style={s.cancel} onPress={() => navigation.goBack()}><Text style={s.cancelTxt}>Cancel</Text></TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex:1, backgroundColor:'#394579' },
  // header styles removed (using ScreenHeader)
  card: { backgroundColor:'white', borderRadius:16, padding:16 },
  label: { fontSize:14, fontWeight:'600', color:'#374151', marginBottom:6 },
  input: { backgroundColor:'#F9FAFB', borderWidth:1, borderColor:'#E5E7EB', borderRadius:12, paddingHorizontal:12, paddingVertical:10, fontSize:14 },
  inputError: { borderColor:'#EF4444' },
  error: { color:'#EF4444', fontSize:12, marginTop:4 },
  pickerWrap: { borderWidth:1, borderColor:'#E5E7EB', borderRadius:12, backgroundColor:'#F9FAFB', height:44, justifyContent:'center', marginTop:4 },
  pickerBtn: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:12, height:'100%' },
  pickerTxt: { fontSize:14, color:'#111827' },
  pickerCaret: { fontSize:12, color:'#6B7280' },
  dropdown: { position:'absolute', top:50, left:0, right:0, backgroundColor:'white', borderWidth:1, borderColor:'#E5E7EB', borderRadius:12, paddingVertical:4, zIndex:30, shadowColor:'#000', shadowOpacity:0.15, shadowRadius:8, elevation:5 },
  dropdownItem: { paddingVertical:10, paddingHorizontal:12 },
  dropdownItemText: { fontSize:14, color:'#111827' },
  actions: { marginTop:24, gap:12 },
  primary: { backgroundColor:'#10B981', paddingVertical:14, borderRadius:14, alignItems:'center' },
  primaryTxt: { color:'white', fontWeight:'700' },
  cancel: { backgroundColor:'rgba(255,255,255,0.12)', paddingVertical:14, borderRadius:14, alignItems:'center' },
  cancelTxt: { color:'white', fontWeight:'600' }
});
