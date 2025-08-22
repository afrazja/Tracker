import React from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useTrackers } from '../TrackersContext';
import { theme } from '../theme';

// Lightweight add-record modal for core built-in tracker types.
export default function AddRecordModal({ tracker, visible, onClose }) {
  const { addRecord } = useTrackers();
  const [form, setForm] = React.useState({});
  const [submitting, setSubmitting] = React.useState(false);
  React.useEffect(() => { if (tracker) { setForm({}); } }, [tracker]);
  // Always call hooks in the same order; compute fieldDefs even when tracker is null
  const fieldDefs = React.useMemo(() => {
    if (!tracker) return [];
    let base = [];
    switch (tracker.id) {
      case 'reading': base = [
        { key: 'title', label: 'Title', keyboardType: 'default', type: 'string', required: true },
        { key: 'pages', label: 'Pages', keyboardType: 'numeric', type: 'number', min: 0, required: true },
        { key: 'duration', label: 'Duration (min)', keyboardType: 'numeric', type: 'number', min: 0 }
      ]; break;
      case 'expense': base = [
        { key: 'category', label: 'Category', keyboardType: 'default', type: 'string', required: true },
        { key: 'amount', label: 'Amount', keyboardType: 'numeric', type: 'number', min: 0, decimals: 2, required: true }
      ]; break;
      case 'workout': base = [
        { key: 'workoutType', label: 'Workout Type', keyboardType: 'default', type: 'string', required: true },
        { key: 'sets', label: 'Sets', keyboardType: 'numeric', type: 'number', min: 0 },
        { key: 'reps', label: 'Reps', keyboardType: 'numeric', type: 'number', min: 0 },
        { key: 'time', label: 'Time (min)', keyboardType: 'numeric', type: 'number', min: 0 }
      ]; break;
      case 'meditation': base = [
        { key: 'duration', label: 'Duration (min)', keyboardType: 'numeric', type: 'number', min: 0, required: true },
        { key: 'satisfaction', label: 'Satisfaction (1-10)', keyboardType: 'numeric', type: 'number', min: 1, max: 10 }
      ]; break;
      default: {
        const primary = tracker.valueFieldId || tracker.fields?.[0]?.id || 'value';
        const fMeta = tracker.fields?.find(f=>f.id===primary);
        base = [ { key: primary, label: fMeta?.label || 'Value', keyboardType: 'numeric', type: fMeta?.type || 'number', min: 0 } ];
      }
    }
    return [...base, { key: 'date', label: 'Date (YYYY-MM-DD)', keyboardType: 'default', type: 'string' }];
  }, [tracker]);
  if (!tracker) return null;

  const onChange = (k,v) => setForm(prev => ({ ...prev, [k]: v }));
  // Validation logic: required fields present, numeric fields valid & within min/max
  const validation = React.useMemo(() => {
    const errors = {};
    fieldDefs.forEach(fd => {
      const val = form[fd.key];
      if (fd.required && (val === undefined || val === null || String(val).trim() === '')) {
        errors[fd.key] = 'Required';
        return;
      }
      if (fd.type === 'number' && val !== undefined && val !== null && String(val).trim() !== '') {
        const num = Number(val);
        if (Number.isNaN(num)) {
          errors[fd.key] = 'Invalid number';
          return;
        }
        if (fd.min !== undefined && num < fd.min) errors[fd.key] = `Min ${fd.min}`;
        if (fd.max !== undefined && num > fd.max) errors[fd.key] = `Max ${fd.max}`;
      }
      if (fd.key === 'date' && val) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(String(val))) errors[fd.key] = 'YYYY-MM-DD';
      }
    });
    return { errors, valid: Object.keys(errors).length === 0 };
  }, [fieldDefs, form]);
  const canSubmit = validation.valid && fieldDefs.some(f => form[f.key] && String(form[f.key]).trim() !== '');
  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      const payload = {};
      fieldDefs.forEach(fd => {
        const raw = form[fd.key];
        if (raw === undefined || raw === null || raw === '') return;
        if (fd.type === 'number') {
          const num = Number(raw);
            if (!Number.isNaN(num)) {
              let final = num;
              if (typeof fd.decimals === 'number') final = Number(num.toFixed(fd.decimals));
              payload[fd.key] = final;
            }
        } else {
          payload[fd.key] = raw;
        }
      });
  if (!payload.date) payload.date = new Date().toISOString().slice(0,10);
      addRecord(tracker.id, payload);
      onClose?.();
    } finally { setSubmitting(false); }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS==='ios' ? 'padding' : undefined}>
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <Text style={styles.title}>Add {tracker.title} Record</Text>
            <ScrollView contentContainerStyle={{ paddingBottom: 4 }} style={{ maxHeight: 340 }}>
              {fieldDefs.map(fd => {
                const err = validation.errors[fd.key];
                return (
                  <View key={fd.key} style={styles.fieldRow}>
                    <Text style={styles.label}>{fd.label}{fd.required ? ' *' : ''}</Text>
                    <TextInput
                      value={form[fd.key] ? String(form[fd.key]) : ''}
                      onChangeText={t => onChange(fd.key, t)}
                      placeholder={fd.label}
                      keyboardType={fd.keyboardType}
                      style={[styles.input, err ? styles.inputError : null]}
                      placeholderTextColor="#9CA3AF"
                    />
                    {err ? <Text style={styles.errorTxt}>{err}</Text> : null}
                  </View>
                );
              })}
            </ScrollView>
            <View style={styles.actions}>
              <TouchableOpacity onPress={onClose} style={[styles.btn, styles.cancelBtn]} disabled={submitting}>
                <Text style={styles.cancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSubmit} style={[styles.btn, canSubmit ? styles.submitBtn : styles.submitBtnDisabled]} disabled={!canSubmit || submitting}>
                <Text style={styles.submitTxt}>{submitting ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex:1 },
  backdrop: { flex:1, backgroundColor:'rgba(0,0,0,0.4)', alignItems:'center', justifyContent:'flex-end' },
  card: { width:'100%', backgroundColor:'#1F2937', borderTopLeftRadius:28, borderTopRightRadius:28, padding:20, paddingBottom:28 },
  title: { color:'#fff', fontSize:18, fontWeight:'700', marginBottom:12, textAlign:'center' },
  fieldRow: { marginBottom:14 },
  label: { color:'#F3F4F6', fontSize:13, fontWeight:'600', marginBottom:6 },
  input: { borderWidth:1, borderColor:'rgba(255,255,255,0.15)', borderRadius:12, paddingHorizontal:12, paddingVertical:10, color:'#fff', fontSize:15, backgroundColor:'rgba(255,255,255,0.06)' },
  inputError: { borderColor:'#F87171' },
  actions: { flexDirection:'row', justifyContent:'flex-end', marginTop:12, gap:12 },
  btn: { paddingHorizontal:18, paddingVertical:12, borderRadius:12 },
  cancelBtn: { backgroundColor:'rgba(255,255,255,0.12)' },
  cancelTxt: { color:'#fff', fontWeight:'600' },
  submitBtn: { backgroundColor: theme?.colors?.accentBlue || '#2563EB' },
  submitBtnDisabled: { backgroundColor:'rgba(255,255,255,0.20)' },
  submitTxt: { color:'#fff', fontWeight:'700' }
  ,errorTxt: { color:'#FCA5A5', fontSize:11, marginTop:4 }
});
