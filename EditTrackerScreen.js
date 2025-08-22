import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import ScreenHeader from './components/ScreenHeader';
import { useTrackers } from './TrackersContext';

export default function EditTrackerScreen({ route, navigation }) {
  const { trackerId } = route.params || {};
  const { trackers, updateTracker } = useTrackers();
  const tracker = trackers.find(t => t.id === trackerId);

  const [name, setName] = useState('');
  const [fields, setFields] = useState([]);
  const [filterField, setFilterField] = useState(null);
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [errors, setErrors] = useState({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (tracker) {
      setName(tracker.title || '');
    let baseFields = (tracker.fields || []).map(f => ({ id: f.id, label: f.label, unit: f.unit }));
      if (tracker.id === 'workout') {
        const workoutBuiltins = [
      { id: 'workoutType', label: 'Workout Type', unit: '' },
      { id: 'sets', label: 'Sets', unit: 'count' },
      { id: 'reps', label: 'Reps', unit: 'count' },
      { id: 'time', label: 'Time', unit: 'min' },
      { id: 'date', label: 'Date', unit: '' },
        ];
        // Merge without duplicating existing ids
        workoutBuiltins.forEach(f => { if (!baseFields.find(b => b.id === f.id)) baseFields.push(f); });
      }
      setFields(baseFields);
      setFilterField(tracker.filterField || null);
    }
  }, [trackerId, tracker]);

  function updateField(id, patch) {
    setFields(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f));
  }
  function addField() {
    setFields(prev => [...prev, { id: Date.now().toString(), label: '', unit: '' }]);
  }
  function removeField(id) {
    setFields(prev => prev.length > 1 ? prev.filter(f => f.id !== id) : prev);
    setFilterField(prev => (prev === id ? null : prev));
  }

  function validate() {
    const e = {};
    if (!name.trim()) e.name = 'Name required';
    fields.forEach((f,i) => {
      if (!f.label.trim()) e['f'+f.id] = `Field ${i+1} label required`;
  // goal removed
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function save() {
    try {
      if (!tracker) return;
      if (!validate()) return;
      updateTracker(tracker.id, {
        title: name.trim(),
        fields: fields.map(f => ({ id: f.id.toString(), label: f.label, unit: f.unit, inherited: false })),
        filterField: filterField,
        valueFieldId: fields[0]?.id.toString()
      });
      Alert.alert('Saved','Tracker updated');
      navigation.goBack();
    } catch (e) {
      console.error('Error saving tracker', e);
      Alert.alert('Error','Could not update tracker');
    }
  }

  if (!tracker) {
    return (
      <View style={st.screen}> 
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={st.back}>BACK</Text></TouchableOpacity>
        <Text style={st.missing}>Tracker not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={st.screen} contentContainerStyle={{ padding:16, paddingTop:72, paddingBottom:40 }}>
      <ScreenHeader title="Edit Tracker" onBack={() => navigation.goBack()} />
      <Text style={st.sectionTitle}>Basics</Text>
      <View style={st.card}>
        <Text style={st.label}>Tracker name</Text>
        <TextInput style={[st.input, errors.name && st.inputError]} placeholder="e.g., Reading Log" value={name} onChangeText={setName} />
        {errors.name ? <Text style={st.error}>{errors.name}</Text> : null}
      </View>
      <TouchableOpacity onPress={() => setShowAdvanced(s=>!s)} activeOpacity={0.7} style={st.disclosureHeader}>
        <Text style={st.sectionTitle}>Fields & Advanced</Text>
        <Text style={st.disclosureChevron}>{showAdvanced ? '▲':'▼'}</Text>
      </TouchableOpacity>
      {showAdvanced && (
      <View style={st.card}>
        {fields.map((f, idx) => (
          <View key={f.id} style={st.fieldRow}>
            <View style={st.fieldNameCol}>
              <Text style={st.smallLabel}>Field name</Text>
              <TextInput style={[st.input, errors['f'+f.id] && st.inputError]} placeholder={idx===0?'Primary':'Field name'} value={f.label} onChangeText={t => updateField(f.id,{ label: t })} />
              {errors['f'+f.id] ? <Text style={st.error}>{errors['f'+f.id]}</Text> : null}
            </View>
            <View style={st.unitCol}>
              <Text style={st.smallLabel}>Unit</Text>
              <TextInput style={st.input} placeholder="km, $, pages" value={f.unit} onChangeText={t=>updateField(f.id,{ unit: t })} />
            </View>
            <View style={st.rowActions}>
              {idx !== 0 && (
                <TouchableOpacity onPress={() => removeField(f.id)} style={[st.iconBtn,{ backgroundColor:'#eee' }]}><Text style={st.iconTxt}>−</Text></TouchableOpacity>
              )}
              {idx === fields.length - 1 && (
                <TouchableOpacity onPress={addField} style={[st.iconBtn,{ backgroundColor:'#e6f6ef' }]}><Text style={[st.iconTxt,{ color:'#0f9d58' }]}>＋</Text></TouchableOpacity>
              )}
            </View>
          </View>
        ))}
        <View style={{ marginTop:4 }}>
          <Text style={st.smallLabel}>Filter field (optional)</Text>
          <View style={st.pickerWrap}>
            <TouchableOpacity style={st.pickerButton} onPress={() => setShowFilterOptions(o=>!o)}>
              <Text style={st.pickerButtonText}>{filterField || 'None'}</Text>
              <Text style={st.pickerButtonIcon}>▼</Text>
            </TouchableOpacity>
            {showFilterOptions && (
              <View style={st.dropdown}>
                {fields.map(f => (
                  <TouchableOpacity key={f.id} style={st.dropdownItem} onPress={() => { setFilterField(f.id.toString()); setShowFilterOptions(false); }}>
                    <Text style={st.dropdownItemText}>{f.label || f.id}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={st.dropdownItem} onPress={() => { setFilterField(null); setShowFilterOptions(false); }}>
                  <Text style={st.dropdownItemText}>None</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
  </View>
  )}
      <View style={st.actions}>
        <View style={st.primaryRow}>
          <TouchableOpacity style={[st.primary,{ flex:1 }]} onPress={save}><Text style={st.primaryTxt}>Save changes</Text></TouchableOpacity>
          <TouchableOpacity style={st.cancelBtn} onPress={()=>navigation.goBack()}><Text style={st.cancelTxt}>Cancel</Text></TouchableOpacity>
        </View>
      </View>
      <View style={{ height:32 }} />
    </ScrollView>
  );
}

const st = StyleSheet.create({
  screen: { flex:1, backgroundColor:'#394579' },
  sectionTitle: { color:'white', fontSize:16, fontWeight:'600', marginTop:16, marginBottom:8, paddingHorizontal:4 },
  card: { backgroundColor:'white', borderRadius:16, padding:16, gap:8 },
  label: { fontSize:14, fontWeight:'600', color:'#111827' },
  smallLabel: { fontSize:12, fontWeight:'600', color:'#374151', marginBottom:4 },
  input: { backgroundColor:'#F9FAFB', borderWidth:1, borderColor:'#E5E7EB', borderRadius:12, paddingHorizontal:12, paddingVertical:10, fontSize:14 },
  inputError: { borderColor:'#EF4444' },
  error: { color:'#EF4444', fontSize:12, marginTop:4 },
  fieldRow: { flexDirection:'row', alignItems:'flex-end', marginBottom:12 },
  fieldNameCol: { flex:2 },
  unitCol: { width:90, marginLeft:8 },
  rowActions: { marginLeft:8, gap:8, alignItems:'center' },
  iconBtn: { width:36, height:36, borderRadius:10, alignItems:'center', justifyContent:'center' },
  iconTxt: { fontSize:18, fontWeight:'700', color:'#111' },
  pickerWrap: { borderWidth:1, borderColor:'#E5E7EB', borderRadius:12, overflow:'hidden', backgroundColor:'#F9FAFB', height:44, justifyContent:'center', marginTop:4 },
  pickerButton: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:12, height:'100%' },
  pickerButtonText: { fontSize:14, color:'#111827' },
  pickerButtonIcon: { fontSize:12, color:'#6B7280' },
  dropdown: { position:'absolute', top:50, left:0, right:0, backgroundColor:'white', borderWidth:1, borderColor:'#E5E7EB', borderRadius:12, paddingVertical:4, zIndex:20, shadowColor:'#000', shadowOpacity:0.15, shadowRadius:8, elevation:4 },
  dropdownItem: { paddingVertical:10, paddingHorizontal:12 },
  dropdownItemText: { fontSize:14, color:'#111827' },
  actions: { marginTop:16, gap:14 },
  primaryRow: { flexDirection:'row', alignItems:'center', gap:12 },
  primary: { backgroundColor:'#10B981', padding:14, borderRadius:14, alignItems:'center' },
  primaryTxt: { color:'white', fontWeight:'700' },
  cancelBtn: { paddingHorizontal:18, paddingVertical:12, borderRadius:12, backgroundColor:'rgba(255,255,255,0.12)' },
  cancelTxt: { color:'white', fontWeight:'600' }
  ,disclosureHeader: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginTop:16, paddingHorizontal:4 },
  disclosureChevron: { color:'white', fontSize:14, fontWeight:'600' }
});
