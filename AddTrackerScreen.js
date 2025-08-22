// AddTrackerScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import ScreenHeader from './components/ScreenHeader';
import { useTrackers } from './TrackersContext';

export default function AddTrackerScreen({ navigation }) {
  const [name, setName] = useState('');
  const [fields, setFields] = useState([
    { id: 1, label: '', unit: '' }
  ]);
  const [filterField, setFilterField] = useState(null); // id or built-in key
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  // Simplified: only main trackers supported (sub trackers removed)
  const [errors, setErrors] = useState({});
  const { addTracker, trackers } = useTrackers();
  const [showAdvanced, setShowAdvanced] = useState(false);

  function addField() {
  setFields(prev => [...prev, { id: Date.now(), label: '', unit: '' }]);
  }
  function removeField(id) {
    setFields(prev => prev.length > 1 ? prev.filter(f => f.id !== id) : prev);
  }
  function updateField(id, patch) {
    setFields(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f));
  }

  function validate() {
    const e = {};
    if (!name.trim()) e.name = 'Tracker name is required.';
    if (!fields.length) e.fields = 'Add at least one field.';
    fields.forEach((f, idx) => {
      if (!f.label.trim()) e[`field-${f.id}`] = `Field ${idx + 1} needs a name.`;
  // goal removed
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function submit() {
    try {
      if (!validate()) return;
      const payload = { name: name.trim(), fields };
      const primary = fields[0];
      addTracker({
        title: payload.name,
        icon: '',
        value: 0,
        unit: primary?.unit || '',
        color: '#4B5563',
        fields: fields.map(f => ({ id: f.id.toString(), label: f.label, unit: f.unit, inherited: false })),
        filterField: filterField,
        valueFieldId: fields[0]?.id.toString()
      });
      Alert.alert('Tracker created', `${payload.name}`);
      navigation?.goBack?.();
    } catch (error) {
      console.error('Error creating tracker:', error);
      Alert.alert('Error', 'Failed to create tracker. Please try again.');
    }
  }

  // No need for effect: sub trackers always inherit current parent's fields

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      <ScreenHeader title="Add Tracker" onBack={() => navigation?.goBack?.()} />
      {/* Basics / Wizard Content */}
  <>
          <Text style={s.sectionTitle}>Basics</Text>
          <View style={s.card}>
            <Text style={s.label}>Tracker name</Text>
            <TextInput
              style={[s.input, errors.name && s.inputError]}
              placeholder="e.g., Reading Log, Expenses, Meditation"
              value={name}
              onChangeText={setName}
            />
            {errors.name ? <Text style={s.error}>{errors.name}</Text> : null}
          </View>
  </>

  <>
          <TouchableOpacity onPress={() => setShowAdvanced(s=>!s)} activeOpacity={0.7} style={s.disclosureHeader}>
            <Text style={s.sectionTitle}>Fields & Advanced</Text>
            <Text style={s.disclosureChevron}>{showAdvanced ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {showAdvanced && (
          <View style={s.card}>
            {fields.map((f, idx) => (
              <View key={f.id} style={s.fieldRow} accessibilityLabel={`Field row ${idx + 1}`}>
                <View style={s.fieldNameCol}>
                  <Text style={s.smallLabel}>Field name</Text>
                  <TextInput
                    style={[s.input, errors[`field-${f.id}`] && s.inputError]}
                    placeholder={idx === 0 ? 'e.g., Pages' : 'e.g., Duration'}
                    value={f.label}
                    onChangeText={t => updateField(f.id, { label: t })}
                  />
                  {errors[`field-${f.id}`] ? <Text style={s.error}>{errors[`field-${f.id}`]}</Text> : null}
                </View>
                <View style={s.unitCol}>
                  <Text style={s.smallLabel}>Unit</Text>
                  <TextInput
                    style={[s.input, { height: 44 }]}
                    placeholder="e.g., km, $, pages"
                    value={f.unit}
                    onChangeText={t => updateField(f.id, { unit: t })}
                  />
                </View>
                {/* goal input removed */}
                <View style={s.rowActions}>
                  {idx !== 0 && (
                    <TouchableOpacity accessibilityLabel="Remove field" onPress={() => removeField(f.id)} style={[s.iconBtn, { backgroundColor: '#eee' }]}><Text style={s.iconTxt}>−</Text></TouchableOpacity>
                  )}
                  {idx === fields.length - 1 && (
                    <TouchableOpacity accessibilityLabel="Add field" onPress={addField} style={[s.iconBtn, { backgroundColor: '#e6f6ef' }]}><Text style={[s.iconTxt, { color: '#0f9d58' }]}>＋</Text></TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
            {/* Filter field picker */}
            <View style={{ marginTop: 4 }}>
              <Text style={s.smallLabel}>Filter field (optional)</Text>
              <View style={s.pickerWrap}>
                <TouchableOpacity
                  style={s.pickerButton}
                  onPress={() => setShowFilterOptions(o => !o)}
                >
                  <Text style={s.pickerButtonText}>{filterField || 'None'}</Text>
                  <Text style={s.pickerButtonIcon}>▼</Text>
                </TouchableOpacity>
                {showFilterOptions && (
                  <View style={s.dropdown}>
                    {fields.map(f => (
                      <TouchableOpacity key={f.id} style={s.dropdownItem} onPress={() => { setFilterField(f.id.toString()); setShowFilterOptions(false); }}>
                        <Text style={s.dropdownItemText}>{f.label || `Field ${f.id}`}</Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity style={s.dropdownItem} onPress={() => { setFilterField(null); setShowFilterOptions(false); }}>
                      <Text style={s.dropdownItemText}>None</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </View>
          )}
  </>

      {/* Actions */}
      <View style={s.actions}>
        <>
            <View style={s.primaryRow}>
              <TouchableOpacity style={[s.primary, { flex: 1 }]} onPress={submit}>
                <Text style={s.primaryTxt}>Create tracker</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.cancelBtn} onPress={() => navigation?.goBack?.()} accessibilityLabel="Cancel and go back"><Text style={s.cancelTxt}>Cancel</Text></TouchableOpacity>
            </View>
              <TouchableOpacity style={s.secondary} onPress={() => { if (validate()) { Alert.alert('Saved', 'Tracker saved. Add another.'); setName(''); setFields([{ id: Date.now(), label: '', unit: '' }]); setErrors({}); } }}>
              <Text style={s.secondaryTxt}>Save & add another</Text>
            </TouchableOpacity>
          </>
      </View>
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#3F4B83' },
  content: { padding: 16, paddingTop: 72, paddingBottom: 48 },
  // header styles removed (shared ScreenHeader used)
  sectionTitle: { color: 'white', fontSize: 16, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  card: { backgroundColor: 'white', borderRadius: 16, padding: 16, gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#111827' },
  smallLabel: { fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 4 },
  input: {
    backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14
  },
  inputError: { borderColor: '#EF4444' },
  error: { color: '#EF4444', fontSize: 12, marginTop: 4 },
  pickerWrap: {
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, overflow: 'hidden', backgroundColor: '#F9FAFB',
    // Match TextInput visual height (paddingVertical 10 + borders) ~44
    height: 44, justifyContent: 'center'
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    height: '100%',
  },
  pickerButtonText: {
    fontSize: 14,
    color: '#111827',
  },
  pickerButtonIcon: {
    fontSize: 12,
    color: '#6B7280',
  },
  dropdown: { position: 'absolute', top: 50, left: 0, right: 0, backgroundColor: 'white', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingVertical: 4, zIndex: 20, shadowColor:'#000', shadowOpacity:0.15, shadowRadius:8, elevation:4 },
  dropdownItem: { paddingVertical: 10, paddingHorizontal: 12 },
  dropdownItemText: { fontSize: 14, color: '#111827' },
  fieldRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12 },
  fieldNameCol: { flex: 2 },
  unitCol: { width: 90, marginLeft: 8 },
  rowActions: { marginLeft: 8, gap: 8, alignItems: 'center' },
  iconBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  iconTxt: { fontSize: 18, fontWeight: '700', color: '#111' },
  actions: { marginTop: 16, gap: 14 },
  primaryRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  primary: { backgroundColor: '#10B981', padding: 14, borderRadius: 14, alignItems: 'center' },
  primaryTxt: { color: 'white', fontWeight: '700' },
  cancelBtn: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)' },
  cancelTxt: { color: 'white', fontWeight: '600' },
  secondary: { backgroundColor: 'transparent', padding: 12, borderRadius: 12, alignItems: 'center' },
  secondaryTxt: { color: 'white', opacity: 0.9, fontWeight: '600' },
  // preview removed
  modeTabs: { flexDirection: 'row', marginBottom: 12, backgroundColor: 'rgba(255,255,255,0.15)', padding: 4, borderRadius: 12 },
  modeTab: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  modeTabActive: { backgroundColor: 'white' },
  modeTabTxt: { color: 'white', fontWeight: '600' },
  modeTabTxtActive: { color: '#111827' },
  inheritedBox: { marginTop: 12, backgroundColor: '#F3F4F6', borderRadius: 12, padding: 12 },
  inheritedTitle: { fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 4, textTransform: 'uppercase' },
  inheritedField: { fontSize: 12, color: '#374151' },
  inheritedRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1, borderColor: '#9CA3AF', marginRight: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: 'white' },
  checkboxChecked: { backgroundColor: '#10B981', borderColor: '#10B981' },
  checkboxMark: { color: 'white', fontSize: 12, fontWeight: '700' },
  // removed multi-step wizard styles
  parentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  parentCard: { width: '48%', backgroundColor: 'white', borderRadius: 14, padding: 12, marginBottom: 12, borderWidth: 2, borderColor: 'transparent' },
  parentCardActive: { borderColor: '#10B981', backgroundColor: '#ECFDF5' },
  parentCardTitle: { fontWeight: '600', fontSize: 14, color: '#111827' },
  parentCardDesc: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  fieldEditRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  inlineInput: { flex: 1, marginRight: 8 },
  unitInput: { width: 70, marginRight: 8, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 8, fontSize: 12 },
  deleteMini: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' },
  deleteMiniTxt: { color: '#B91C1C', fontSize: 18, fontWeight: '700', marginTop: -2 },
  addMini: { marginTop: 12, backgroundColor: '#e6f6ef', paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  addMiniTxt: { color: '#0f9d58', fontWeight: '600' },
  wizardButtons: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  reviewLine: { color: '#111827', marginBottom: 6, fontSize: 14 },
  reviewLabel: { fontWeight: '600', color: '#374151' },
  reviewField: { fontSize: 12, color: '#374151', marginTop: 2 },
  inheritedFieldLabel: { fontSize: 13, color: '#374151' },
  disclosureHeader: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginTop:16, paddingHorizontal:4 },
  disclosureChevron: { color:'white', fontSize:14, fontWeight:'600' }
});
