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
        { key: 'title', label: 'Title', keyboardType: 'default' },
        { key: 'pages', label: 'Pages', keyboardType: 'numeric' },
        { key: 'duration', label: 'Duration (min)', keyboardType: 'numeric' }
      ]; break;
      case 'expense': base = [
        { key: 'category', label: 'Category', keyboardType: 'default' },
        { key: 'amount', label: 'Amount', keyboardType: 'numeric' }
      ]; break;
      case 'workout': base = [
        { key: 'workoutType', label: 'Workout Type', keyboardType: 'default' },
        { key: 'sets', label: 'Sets', keyboardType: 'numeric' },
        { key: 'reps', label: 'Reps', keyboardType: 'numeric' },
        { key: 'time', label: 'Time (min)', keyboardType: 'numeric' }
      ]; break;
      case 'meditation': base = [
        { key: 'duration', label: 'Duration (min)', keyboardType: 'numeric' },
        { key: 'satisfaction', label: 'Satisfaction (1-10)', keyboardType: 'numeric' }
      ]; break;
      default: {
        const primary = tracker.valueFieldId || tracker.fields?.[0]?.id || 'value';
        base = [ { key: primary, label: tracker.fields?.find(f=>f.id===primary)?.label || 'Value', keyboardType: 'numeric' } ];
      }
    }
    return [...base, { key: 'date', label: 'Date (YYYY-MM-DD)', keyboardType: 'default' }];
  }, [tracker]);
  if (!tracker) return null;

  const onChange = (k,v) => setForm(prev => ({ ...prev, [k]: v }));
  const canSubmit = fieldDefs.some(f => form[f.key] && String(form[f.key]).trim() !== '');
  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      const payload = {};
  fieldDefs.forEach(fd => {
        const raw = form[fd.key];
        let val = raw;
        if (/^[-+]?[0-9]*\.?[0-9]+$/.test(String(raw))) val = Number(raw);
        payload[fd.key] = val;
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
              {fieldDefs.map(fd => (
                <View key={fd.key} style={styles.fieldRow}>
                  <Text style={styles.label}>{fd.label}</Text>
                  <TextInput
                    value={form[fd.key] ? String(form[fd.key]) : ''}
                    onChangeText={t => onChange(fd.key, t)}
                    placeholder={fd.label}
                    keyboardType={fd.keyboardType}
                    style={styles.input}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              ))}
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
  actions: { flexDirection:'row', justifyContent:'flex-end', marginTop:12, gap:12 },
  btn: { paddingHorizontal:18, paddingVertical:12, borderRadius:12 },
  cancelBtn: { backgroundColor:'rgba(255,255,255,0.12)' },
  cancelTxt: { color:'#fff', fontWeight:'600' },
  submitBtn: { backgroundColor: theme?.colors?.accentBlue || '#2563EB' },
  submitBtnDisabled: { backgroundColor:'rgba(255,255,255,0.20)' },
  submitTxt: { color:'#fff', fontWeight:'700' }
});
