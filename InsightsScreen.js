import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useInsights } from './InsightsContext';
import ScreenHeader from './components/ScreenHeader';

export default function InsightsScreen({ navigation }) {
  const insights = useInsights();
  if (!insights.ready) {
    return (
      <View style={s.screen}> 
        <Text style={{ color:'#fff', opacity:0.7 }}>Preparing insights…</Text>
      </View>
    );
  }
  const { todaySummary, trends, expenseCategories, goalsPace, streakSummary, recentActivity } = insights;
  return (
    <ScrollView style={s.screen} contentContainerStyle={{ padding:16, paddingTop:72, paddingBottom:64 }}>
  <ScreenHeader title="Insights" onBack={() => navigation.goBack()} />
      {/* Today Summary */}
      <Text style={s.sectionTitle}>Today at a Glance</Text>
      <View style={s.miniRow}>
        {todaySummary.map(item => (
          <View key={item.trackerId} style={s.miniCard}>
            <Text style={s.miniCardTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={s.miniCardValue}>{item.value}{item.unit && item.unit !== '$' ? ` ${item.unit}` : item.unit === '$' ? '$' : ''}</Text>
          </View>
        ))}
        {todaySummary.length === 0 && <Text style={{ color:'#fff', opacity:0.6 }}>No data yet today</Text>}
      </View>
      {/* Trends */}
      <Text style={s.sectionTitle}>7‑Day Trend vs Prior Week</Text>
      {trends.filter(t => t.current + t.previous > 0).slice(0,8).map(t => {
        const pct = t.change.toFixed(0);
        const positive = t.change >= 0;
        const max = Math.max(t.current, t.previous) || 1;
        return (
          <View key={t.trackerId} style={s.trendRow}>
            <Text style={s.trendTitle}>{t.title}</Text>
            <View style={s.trendBarsWrap}>
              <View style={[s.trendBar,{ width: `${(t.previous/max)*100}%`, backgroundColor:'#6B7280' }]} />
              <View style={[s.trendBar,{ width: `${(t.current/max)*100}%`, backgroundColor: positive ? '#10B981':'#EF4444' }]} />
            </View>
            <Text style={[s.trendDelta,{ color: positive ? '#10B981':'#EF4444' }]}>{positive?'+':''}{pct}%</Text>
          </View>
        );
      })}
      {/* Expense Breakdown */}
      {expenseCategories.length > 0 && (
        <View style={{ marginTop:24 }}>
          <Text style={s.sectionTitle}>This Month Spending</Text>
          {expenseCategories.map(c => (
            <View key={c.name} style={s.expenseRow}>
              <Text style={s.expenseName}>{c.name}</Text>
              <View style={s.expenseBarBg}><View style={[s.expenseBarFill,{ width: `${c.percent.toFixed(2)}%` }]} /></View>
              <Text style={s.expenseValue}>${c.value.toFixed(0)}</Text>
            </View>
          ))}
        </View>
      )}
      {/* Goals Pace */}
      {goalsPace.length > 0 && (
        <View style={{ marginTop:24 }}>
          <Text style={s.sectionTitle}>Daily Goals Pace</Text>
          {goalsPace.map(g => {
            const ahead = g.delta >= 0;
            const pct = g.target ? Math.min(100,(g.progress/g.target)*100) : 0;
            return (
              <View key={g.id} style={s.goalPaceCard}>
                <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:4 }}>
                  <Text style={s.goalPaceTitle} numberOfLines={1}>{g.name}</Text>
                  <Text style={[s.goalPaceBadge,{ backgroundColor: ahead ? '#065F46':'#7F1D1D' }]}>{ahead? 'Ahead':'Behind'}</Text>
                </View>
                <View style={s.goalPaceBarBg}><View style={[s.goalPaceBarFill,{ width: pct+'%' }]} /></View>
                <Text style={s.goalPaceMeta}>{g.progress} / {g.target} {g.unit} ({ahead?'+':''}{g.delta.toFixed(1)} vs pace)</Text>
              </View>
            );
          })}
        </View>
      )}
      {/* Streaks */}
      {streakSummary.length > 0 && (
        <View style={{ marginTop:24 }}>
          <Text style={s.sectionTitle}>Top Streaks</Text>
          {streakSummary.map(sv => (
            <View key={sv.id} style={s.streakRowInsight}>
              <View style={{ flex:1 }}>
                <Text style={s.streakRowTitle} numberOfLines={1}>{sv.name}</Text>
                <View style={s.streakInsightBarBg}><View style={[s.streakInsightBarFill,{ width: sv.percent+'%' }]} /></View>
              </View>
              <Text style={s.streakRowMeta}>{sv.current}d / {sv.longest}d</Text>
            </View>
          ))}
        </View>
      )}
      {/* Recent Activity */}
      <View style={{ marginTop:24 }}>
        <Text style={s.sectionTitle}>Recent Activity</Text>
        {recentActivity.length === 0 && <Text style={{ color:'#fff', opacity:0.6 }}>No recent records</Text>}
        {recentActivity.map(r => (
          <View key={r.id} style={s.activityRow}>
            <Text style={s.activityTitle}>{r.trackerTitle}</Text>
            <Text style={s.activityValue}>{r.value}{r.unit && r.unit !== '$' ? ' '+r.unit : r.unit === '$' ? '$' : ''}</Text>
            <Text style={s.activityDate}>{r.date}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex:1, backgroundColor:'#394579' },
  // header replaced by shared ScreenHeader
  sectionTitle: { color:'#FFFFFF', fontSize:18, fontWeight:'700', marginBottom:12, marginTop:20, paddingHorizontal:4 },
  miniRow: { flexDirection:'row', flexWrap:'wrap', gap:12 },
  miniCard: { backgroundColor:'rgba(255,255,255,0.12)', padding:12, borderRadius:14, width:'30%' },
  miniCardTitle: { color:'#D1D5DB', fontSize:11, fontWeight:'600', marginBottom:4 },
  miniCardValue: { color:'#FFFFFF', fontSize:18, fontWeight:'700' },
  trendRow: { flexDirection:'row', alignItems:'center', marginBottom:10 },
  trendTitle: { color:'#FFFFFF', fontSize:13, fontWeight:'600', width:90 },
  trendBarsWrap: { flex:1, flexDirection:'row', alignItems:'center', gap:4 },
  trendBar: { height:10, borderRadius:4 },
  trendDelta: { width:50, textAlign:'right', fontSize:12, fontWeight:'700' },
  expenseRow: { flexDirection:'row', alignItems:'center', marginBottom:8 },
  expenseName: { color:'#FFFFFF', fontSize:12, width:90 },
  expenseBarBg: { flex:1, height:10, backgroundColor:'rgba(255,255,255,0.15)', borderRadius:6, marginHorizontal:8 },
  expenseBarFill: { height:'100%', backgroundColor:'#F59E0B', borderRadius:6 },
  expenseValue: { color:'#FFFFFF', fontSize:12, fontWeight:'600', width:50, textAlign:'right' },
  goalPaceCard: { backgroundColor:'rgba(255,255,255,0.12)', padding:12, borderRadius:14, marginBottom:12 },
  goalPaceTitle: { color:'#FFFFFF', fontSize:13, fontWeight:'600', flex:1, marginRight:8 },
  goalPaceBadge: { paddingHorizontal:8, paddingVertical:2, borderRadius:6, color:'#fff', overflow:'hidden', fontSize:10, fontWeight:'700', textTransform:'uppercase' },
  goalPaceBarBg: { height:8, backgroundColor:'rgba(255,255,255,0.15)', borderRadius:6, overflow:'hidden', marginVertical:4 },
  goalPaceBarFill: { height:'100%', backgroundColor:'#10B981' },
  goalPaceMeta: { color:'#D1D5DB', fontSize:11, marginTop:2 },
  streakRowInsight: { flexDirection:'row', alignItems:'center', marginBottom:10, gap:12 },
  streakRowTitle: { color:'#FFFFFF', fontSize:13, fontWeight:'600', marginBottom:4 },
  streakInsightBarBg: { height:6, backgroundColor:'rgba(255,255,255,0.15)', borderRadius:4, overflow:'hidden', marginTop:4 },
  streakInsightBarFill: { height:'100%', backgroundColor:'#6366F1' },
  streakRowMeta: { color:'#FFFFFF', fontSize:11, fontWeight:'600', width:70, textAlign:'right' },
  activityRow: { flexDirection:'row', alignItems:'center', marginBottom:8 },
  activityTitle: { color:'#FFFFFF', fontSize:12, flex:1 },
  activityValue: { color:'#FFFFFF', fontSize:12, fontWeight:'600', width:70 },
  activityDate: { color:'#9CA3AF', fontSize:11, width:80, textAlign:'right' },
});
