import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function StreakGoalsSection({ streakGoals, navigation, hideHeader }) {
  return (
    <View style={{ marginTop:8 }}>
      {!hideHeader && (
        <View style={styles.headerRow}>
          <Text style={styles.header}>Streak Goals</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AddStreakGoal')} style={styles.addBtn}>
            <Text style={styles.addTxt}>＋ Add</Text>
          </TouchableOpacity>
        </View>
      )}
      {streakGoals.length === 0 && <Text style={styles.empty}>No streak goals yet</Text>}
      {streakGoals.map(sg => (
        <View key={sg.id} style={styles.card}>
          <View style={styles.topRow}>
            <Text style={styles.name}>{sg.name}</Text>
            <Text style={styles.pct}>{sg.percent.toFixed(0)}%</Text>
          </View>
          <View style={styles.barBg}><View style={[styles.barFill,{ width: sg.percent+'%' }]} /></View>
            <Text style={styles.meta}>{sg.currentStreak} / {sg.targetDays} days • Longest {sg.longestStreak}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12 },
  header: { color:'#fff', fontSize:20, fontWeight:'700', marginLeft:4 },
  addBtn: { paddingHorizontal:12, paddingVertical:6, backgroundColor:'rgba(255,255,255,0.15)', borderRadius:12 },
  addTxt: { color:'#fff', fontWeight:'600' },
  empty: { color:'#fff', opacity:0.6, textAlign:'center' },
  card: { backgroundColor:'#FFFFFF', borderRadius:16, padding:14, marginBottom:12, marginHorizontal:2 },
  topRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  name: { fontSize:14, fontWeight:'600', color:'#111827', flex:1, marginRight:8 },
  pct: { fontSize:14, fontWeight:'700', color:'#6366F1' },
  barBg: { height:8, backgroundColor:'#E5E7EB', borderRadius:6, overflow:'hidden', marginBottom:4, marginTop:6 },
  barFill: { height:'100%', backgroundColor:'#6366F1' },
  meta: { fontSize:12, color:'#6B7280' }
});
