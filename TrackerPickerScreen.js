import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useTrackers } from './TrackersContext';

export default function TrackerPickerScreen({ navigation, route }) {
  const { trackers, selectedTrackerIds, addTrackerToMain, removeTrackerFromMain } = useTrackers();
  const [selected, setSelected] = useState(new Set(selectedTrackerIds || []));

  function toggleTracker(id) {
    if (selected.has(id)) {
      Alert.alert(
        'Remove Tracker',
        'Removing this tracker will also delete all its information. Are you sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Remove', style: 'destructive', onPress: () => {
            setSelected(prev => {
              const next = new Set(prev);
              next.delete(id);
              removeTrackerFromMain(id);
              return next;
            });
          }}
        ]
      );
    } else {
      setSelected(prev => {
        const next = new Set(prev);
        next.add(id);
        addTrackerToMain(id);
        return next;
      });
    }
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => navigation.goBack?.()} accessibilityLabel="Go back" style={styles.backWrap}>
          <Text style={styles.backText}>BACK</Text>
        </TouchableOpacity>
        <Text style={styles.heading}>Available templates</Text>
        <View style={styles.grid}>
          {trackers.map(tracker => {
            const isSelected = selected.has(tracker.id);
            return (
              <View key={tracker.id} style={styles.templateCol}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[styles.card, isSelected && styles.cardActive]}
                  onPress={() => navigation.navigate('EditTracker', { trackerId: tracker.id })}
                >
                  <Text style={styles.cardTitle}>{tracker.title}</Text>
                  <Text style={styles.cardSubtitle}>Tap to edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  accessibilityLabel={`Toggle ${tracker.title}`}
                  onPress={() => toggleTracker(tracker.id)}
                  style={[styles.checkbox, isSelected && styles.checkboxChecked]}
                >
                  {isSelected && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
        <View style={{ height: 120 }} />
      </ScrollView>
      <TouchableOpacity
        style={styles.addBtn}
        accessibilityLabel="Create a new tracker"
        onPress={() => navigation.navigate('AddTracker')}
        activeOpacity={0.85}
      >
        <Text style={styles.addBtnText}>Add Tracker</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#3F4B83' },
  content: { paddingHorizontal: 16, paddingTop: 72 },
  backWrap: { marginBottom: 8 },
  backText: { color: 'white', fontWeight: '700', fontSize: 14, letterSpacing: 0.5 },
  heading: { color: 'white', fontSize: 16, fontWeight: '600', marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  templateCol: { width: '48%', marginBottom: 28 },
  card: { backgroundColor: 'white', borderRadius: 12, paddingVertical: 28, alignItems: 'center', justifyContent: 'center' },
  cardActive: { borderWidth: 2, borderColor: '#10B981' },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
  cardSubtitle: { marginTop: 6, fontSize: 11, color: '#6B7280', fontWeight: '500' },
  checkbox: { width: 26, height: 26, borderRadius: 6, borderWidth: 2, borderColor: '#111827', backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: '#111827' },
  checkmark: { color: 'white', fontWeight: '700', fontSize: 16, marginTop: -2 },
  addBtn: { position: 'absolute', left:16, right:16, bottom:32, backgroundColor:'#10B981', borderRadius:16, paddingVertical:16, alignItems:'center', justifyContent:'center', shadowColor:'#000', shadowOpacity:0.25, shadowRadius:6, elevation:4 },
  addBtnText: { color:'#FFFFFF', fontSize:16, fontWeight:'700', letterSpacing:0.5 },
});
