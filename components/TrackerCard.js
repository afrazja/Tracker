import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../theme';
import { useTrackers } from '../TrackersContext';

export function TrackerCard({ tracker, onPress, onAdd, fullWidth }) {
  if (!tracker) return null;
  const { addRecord } = useTrackers();
  const [showQuick, setShowQuick] = React.useState(false);
  const fields = Array.isArray(tracker.displayFields) && tracker.displayFields.length ? tracker.displayFields.slice(0,2) : (tracker.valueFieldId ? [tracker.valueFieldId] : []);
  return (
    <TouchableOpacity style={[styles.card, fullWidth && styles.fullWidth]} activeOpacity={0.85} onPress={onPress} onLongPress={() => setShowQuick(s=>!s)}>
      <View style={[styles.stripe, { backgroundColor: tracker.color || theme.colors.accentBlue }]} />
      <View style={styles.headerRow}>
        <Text style={styles.icon}>{tracker.icon || '📊'}</Text>
        <Text style={styles.title} numberOfLines={1}>{tracker.title || 'Untitled'}</Text>
      </View>
      <View style={styles.valueRow}>
        {fields.length === 0 ? (
          <>
            <Text style={styles.value}>{tracker.unit === '$' ? `$${tracker.value || 0}` : (tracker.value || 0)}</Text>
            {tracker.unit && tracker.unit !== '$' ? <Text style={styles.unit}>{tracker.unit}</Text> : null}
          </>
        ) : fields.map(fid => {
          let label = fid;
          let valueDisplay = '0';
          const recs = tracker.records || [];
          if (fid.startsWith('derived_')) {
            switch (fid) {
              case 'derived_pagesPerHour': {
                const totalPages = recs.reduce((s,r)=> s + (Number(r.pages)||0), 0);
                const totalHours = recs.reduce((s,r)=> s + ((Number(r.duration)||0)/60), 0);
                valueDisplay = (totalHours>0? (totalPages/totalHours):0).toFixed(1); label='P/H'; break;
              }
              case 'derived_avgAmount': {
                const sum = recs.reduce((s,r)=> s + (Number(r.amount)||0), 0);
                valueDisplay = (recs.length? sum/recs.length:0).toFixed(0); label='Avg'; break;
              }
              case 'derived_count': { valueDisplay = String(recs.length); label='Cnt'; break; }
              case 'derived_totalSets': { valueDisplay = String(recs.reduce((s,r)=> s + (Number(r.sets)||0),0)); label='Sets'; break; }
              case 'derived_totalReps': { valueDisplay = String(recs.reduce((s,r)=> s + (Number(r.reps)||0),0)); label='Reps'; break; }
              case 'derived_volume': { valueDisplay = String(recs.reduce((s,r)=> s + ((Number(r.sets)||0)*(Number(r.reps)||0)),0)); label='Vol'; break; }
              case 'derived_avgSatisfaction': {
                const sats = recs.map(r=>Number(r.satisfaction)).filter(v=>!isNaN(v));
                valueDisplay = (sats.length? (sats.reduce((a,b)=>a+b,0)/sats.length):0).toFixed(1); label='AvgSat'; break; }
              default: valueDisplay='0';
            }
          } else {
            let agg = 0;
            if (recs.length) {
              agg = recs.reduce((sum,r)=> {
                const raw = r[fid];
                const num = typeof raw === 'string' ? parseFloat(raw) : raw;
                return sum + (Number(num) || 0);
              }, 0);
            } else if (tracker[fid] != null) {
              const raw = tracker[fid];
              agg = typeof raw === 'string' ? parseFloat(raw) || 0 : Number(raw) || 0;
            }
            valueDisplay = String(agg);
            // Improve label: use field meta unit or label instead of raw id (which may be numeric like '1')
            const meta = Array.isArray(tracker.fields) ? tracker.fields.find(f => f.id === fid) : null;
            if (meta) {
              if (meta.unit && meta.unit.trim()) {
                label = meta.unit.trim();
              } else if (meta.label && meta.label.trim()) {
                label = meta.label.trim();
              }
            }
          }
          return (
            <View key={fid} style={styles.multiStat}>
              <Text style={[styles.value, fid.startsWith('derived_') ? styles.derivedValue : null]}>{valueDisplay}</Text>
              <Text style={styles.unitSmall}>{label}</Text>
            </View>
          );
        })}
      </View>
      {showQuick && (
        <View style={styles.quickRow}>
          {tracker.id === 'reading' && [10,25,50].map(n => (
            <TouchableOpacity key={n} style={styles.quickChip} onPress={() => addRecord(tracker.id, { pages: n, duration: 0, title: `+${n} pages` })}>
              <Text style={styles.quickTxt}>+{n}</Text>
            </TouchableOpacity>
          ))}
          {tracker.id === 'workout' && [5,10,30].map(n => (
            <TouchableOpacity key={n} style={styles.quickChip} onPress={() => addRecord(tracker.id, { time: n })}>
              <Text style={styles.quickTxt}>+{n}m</Text>
            </TouchableOpacity>
          ))}
          {tracker.id === 'meditation' && [5,10,15].map(n => (
            <TouchableOpacity key={n} style={styles.quickChip} onPress={() => addRecord(tracker.id, { duration: n })}>
              <Text style={styles.quickTxt}>+{n}m</Text>
            </TouchableOpacity>
          ))}
          {tracker.id === 'expense' && [5,10,20].map(n => (
            <TouchableOpacity key={n} style={styles.quickChip} onPress={() => addRecord(tracker.id, { amount: n, category: 'Misc' })}>
              <Text style={styles.quickTxt}>+{n}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <TouchableOpacity style={styles.addBtn} onPress={(e) => { e.stopPropagation?.(); onAdd?.(); }} accessibilityLabel={`Add record to ${tracker.title}`}>
        <Text style={styles.addTxt}>＋</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    paddingVertical: 24,
    paddingHorizontal: 14,
    marginBottom: 16,
    position: 'relative',
    ...theme.shadow.card,
  },
  fullWidth: { width:'100%' },
  stripe: { position: 'absolute', top: 0, left: 0, right: 0, height: 4, borderTopLeftRadius: theme.radius.lg, borderTopRightRadius: theme.radius.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  icon: { fontSize: 26, marginRight: 8 },
  title: { fontSize: 15, fontWeight: '600', color: theme.colors.textPrimary, flexShrink: 1 },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', marginTop: 4 },
  value: { fontSize: 30, fontWeight: '700', color: theme.colors.textPrimary },
  unit: { fontSize: 13, color: theme.colors.textSecondary, marginLeft: 6, fontWeight: '500' },
  unitSmall: { fontSize:11, color: theme.colors.textSecondary, marginTop:2, fontWeight:'600', letterSpacing:0.5 },
  multiStat: { alignItems:'center', marginHorizontal:6 },
  addBtn: { position: 'absolute', left: 10, bottom: 10, backgroundColor: theme.colors.subtle, width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth:1, borderColor:'rgba(255,255,255,0.08)' },
  addTxt: { fontSize: 22, fontWeight: '600', color: theme.colors.textPrimary, marginTop: -2 },
  quickRow: { flexDirection:'row', flexWrap:'wrap', justifyContent:'center', marginTop:12 },
  quickChip: { backgroundColor:'rgba(255,255,255,0.08)', paddingHorizontal:10, paddingVertical:6, borderRadius:14, marginHorizontal:4, marginTop:6 },
  quickTxt: { color:'#fff', fontSize:12, fontWeight:'600' },
  derivedValue: { color:'#10B981' },
});
