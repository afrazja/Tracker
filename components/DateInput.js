import React, { useState, useEffect } from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import dayjs from 'dayjs';

/*
Reusable ISO date input enforcing YYYY-MM-DD.
Props:
 - label?: optional label (if parent wants its own label can omit)
 - value: string | undefined
 - onChange(dateStringOrEmpty)
 - min / max: optional dayjs() parseable limits
 - required?: boolean
 - allowEmpty?: boolean (default true)
 - error?: external error override
*/
export default function DateInput({ label, value, onChange, min, max, required, allowEmpty = true, error }) {
  const [text, setText] = useState(value || '');
  const [internalError, setInternalError] = useState('');

  useEffect(() => { setText(value || ''); }, [value]);

  function validateAndCommit(v) {
    let err = '';
    if (!v) {
      if (required && !allowEmpty) err = 'Required';
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || !dayjs(v, 'YYYY-MM-DD', true).isValid()) {
      err = 'Invalid date';
    } else {
      const d = dayjs(v);
      if (min && d.isBefore(dayjs(min), 'day')) err = 'Before min';
      if (!err && max && d.isAfter(dayjs(max), 'day')) err = 'After max';
    }
    setInternalError(err);
    if (!err) onChange(v);
    else if (v === '') onChange('');
  }

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={[styles.input, (error || internalError) && styles.inputError]}
        value={text}
        onChangeText={t => { setText(t); validateAndCommit(t); }}
        placeholder="YYYY-MM-DD"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="numbers-and-punctuation"
        maxLength={10}
      />
      {(error || internalError) ? <Text style={styles.err}>{error || internalError}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex:1 },
  label: { fontSize:12, fontWeight:'600', color:'#374151', marginBottom:4 },
  input: { backgroundColor:'#F9FAFB', borderWidth:1, borderColor:'#E5E7EB', borderRadius:12, paddingHorizontal:12, paddingVertical:10, fontSize:14 },
  inputError: { borderColor:'#EF4444' },
  err: { color:'#EF4444', fontSize:12, marginTop:4 }
});
