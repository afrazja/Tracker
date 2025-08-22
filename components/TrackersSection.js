import React from 'react';
import { View, Text, TouchableOpacity, Platform, UIManager, LayoutAnimation, StyleSheet } from 'react-native';
import { TrackerCard } from './TrackerCard';

// Two-column trackers section (simplified production version)
export default function TrackersSection({ trackers, selectedIds, expanded, onToggleExpand, navigation, openAddRecord, hideHeader }) {
  return (
    <View style={{ marginTop: 32 }}>
      {!hideHeader && <Text style={styles.header}>Trackers</Text>}
      <View style={styles.grid}>{(() => {
        const displaying = expanded ? selectedIds : selectedIds.slice(0, 4);
        if (displaying.length === 0) return <Text style={styles.empty}>No trackers selected</Text>;
        return Array.from({ length: Math.ceil(displaying.length / 2) }).map((_, rowIdx) => (
          <View key={rowIdx} style={styles.row}>
            {displaying.slice(rowIdx * 2, rowIdx * 2 + 2).map(id => {
              const t = trackers.find(tr => tr.id === id); if (!t) return null;
              return (
                <TrackerCard
                  key={t.id}
                  tracker={t}
                  onPress={() => { if (t.id === 'reading') navigation.navigate('ReadingDetail', { trackerId: t.id }); else navigation.navigate('TrackerDetail', { trackerId: t.id }); }}
                  onAdd={() => openAddRecord(t)}
                />
              );
            })}
            {displaying.length % 2 !== 0 && rowIdx === Math.floor(displaying.length / 2) ? <View style={{ width: '48%' }} /> : null}
          </View>
        ));
      })()}</View>
      {selectedIds.length > 4 && (
        <View style={styles.dividerWrapper}>
          <TouchableOpacity
            onPress={() => {
              if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
                UIManager.setLayoutAnimationEnabledExperimental(true);
              }
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              onToggleExpand();
            }}
            activeOpacity={0.7}
            style={styles.dividerTouchable}
          >
            <View style={styles.dragHandle} />
            <Text style={styles.dividerLabel}>{expanded ? 'Hide extra trackers ▲' : `Show ${selectedIds.length - 4} more ▼`}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 16, marginLeft: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, width: '100%' },
  empty: { color: '#fff', marginTop: 24, textAlign: 'center', opacity: 0.7, width: '100%' },
  dividerWrapper: { marginTop: -4, marginBottom: 8, alignItems: 'center' },
  dividerTouchable: { width: '100%', backgroundColor: 'rgba(255,255,255,0.08)', paddingVertical: 10, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dragHandle: { width: 60, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.4)', marginBottom: 6 },
  dividerLabel: { color: '#FFFFFF', fontSize: 12, fontWeight: '600', letterSpacing: 0.5 }
});
