import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function DailyGoalsSection({ goals, navigation, hideHeader }) {
  const daily = goals.filter(g => g.type === 'daily');
  return (
    <View style={{ marginTop:8 }}>
  {!hideHeader && <Text style={styles.header}>Daily Goals</Text>}
      {daily.length === 0 && <Text style={styles.empty}>No daily goals yet</Text>}
      {daily.map(g => {
        const pct = (g.percent || 0).toFixed(0);
        return (
          <TouchableOpacity key={g.id} style={styles.card} activeOpacity={0.75} onPress={() => navigation.navigate('EditGoal', { goalId: g.id })}>
            <View style={styles.rowTop}>
              <Text style={styles.name} numberOfLines={1}>{g.name || 'Daily Goal'}</Text>
              <Text style={styles.pct}>{pct}%</Text>
            </View>
            <View style={styles.barBg}><View style={[styles.barFill,{ width: pct+'%' }]} /></View>
            <Text style={styles.meta}>{(g.progress || 0)} / {(g.target || 0)} {g.unit || ''}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { color:'#fff', fontSize:20, fontWeight:'700', marginBottom:12, marginLeft:4 },
  empty: { color:'#fff', opacity:0.6, textAlign:'center', marginBottom:12 },
  card: { backgroundColor:'#FFFFFF', borderRadius:16, padding:14, marginBottom:12, marginHorizontal:2 },
  rowTop: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:6 },
  name: { fontSize:14, fontWeight:'600', color:'#111827', flex:1, marginRight:8 },
  pct: { fontSize:14, fontWeight:'700', color:'#10B981' },
  barBg: { height:8, backgroundColor:'#E5E7EB', borderRadius:6, overflow:'hidden', marginBottom:4 },
  barFill: { height:'100%', backgroundColor:'#10B981' },
  meta: { fontSize:12, color:'#6B7280' }
});
