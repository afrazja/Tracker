import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useGoals } from './GoalsContext';
import { useTrackers } from './TrackersContext';
import { useStreakGoals } from './StreakGoalsContext';

export default function GoalsDashboardScreen({ navigation }) {
  const { goals } = useGoals();
  const { trackers } = useTrackers();
  const { streakGoals } = useStreakGoals();
  const [collapsed, setCollapsed] = useState({ daily:false, weekly:false, monthly:false, yearly:false, streak:false });

  if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    try { UIManager.setLayoutAnimationEnabledExperimental(true); } catch {}
  }

  const grouped = useMemo(() => {
    const bucket = { daily:[], weekly:[], monthly:[], yearly:[] };
    goals.forEach(g => {
      const tf = ['daily','weekly','monthly','yearly'].includes(g.timeframe) ? g.timeframe : 'daily';
      bucket[tf].push(g);
    });
    return bucket;
  }, [goals]);

  const sectionOrder = ['daily','weekly','monthly','yearly'];

  const toggle = (key) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <View style={s.screen}>
      <ScrollView contentContainerStyle={s.content}>
        <TouchableOpacity onPress={() => navigation.goBack?.()} style={s.backWrap}>
          <Text style={s.back}>BACK</Text>
        </TouchableOpacity>
        <View style={s.headerRow}>
          <Text style={s.heading}>Goals</Text>
          <View style={s.createRow}> 
            <TouchableOpacity style={s.createBtn} onPress={() => navigation.navigate('AddGoal')}>
              <Text style={s.createBtnTxt}>＋ Goal</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.createBtn,{backgroundColor:'#6366F1'}]} onPress={() => navigation.navigate('AddStreakGoal')}>
              <Text style={s.createBtnTxt}>＋ Streak</Text>
            </TouchableOpacity>
          </View>
        </View>
        {sectionOrder.map(key => {
          const list = grouped[key];
          const label = key.charAt(0).toUpperCase()+key.slice(1)+' Goals';
          return (
            <View key={key} style={s.sectionBlock}>
              <TouchableOpacity style={s.sectionHeaderRow} activeOpacity={0.75} onPress={() => toggle(key)}>
                <Text style={s.sectionHeader}>{label}</Text>
                <Text style={s.sectionChevron}>{collapsed[key] ? '▼' : '▲'}</Text>
              </TouchableOpacity>
              {!collapsed[key] && (
                list.length === 0 ? (
                  <Text style={s.emptySmall}>No {key} goals</Text>
                ) : (
                  list.map(g => {
                    const pct = g.percent.toFixed(0);
                    const trackerLabels = trackers.filter(t => g.trackerIds.includes(t.id)).map(t => t.title).join(', ');
                    const ahead = g.type === 'daily' && g.target ? g.progress >= g.target : false;
                    return (
                      <TouchableOpacity key={g.id} style={s.goalCard} activeOpacity={0.8} onPress={() => navigation.navigate('EditGoal', { goalId: g.id })}>
                        <View style={s.goalHeader}>
                          <Text style={s.goalName}>{g.name}</Text>
                          <Text style={[s.goalPct, ahead && { color:'#0EA5E9' }]}>{pct}%</Text>
                        </View>
                        <View style={s.progressBar}><View style={[s.progressFill,{ width: pct+'%' }]} /></View>
                        <Text style={s.meta}>{g.progress} / {g.target} {g.unit} • {g.type} • {trackerLabels}</Text>
                      </TouchableOpacity>
                    );
                  })
                )
              )}
            </View>
          );
        })}
        {/* Streak Goals Section */}
        <View style={s.sectionBlock}>
          <TouchableOpacity style={s.sectionHeaderRow} activeOpacity={0.75} onPress={() => toggle('streak')}>
            <Text style={s.sectionHeader}>Streak Goals</Text>
            <Text style={s.sectionChevron}>{collapsed.streak ? '▼' : '▲'}</Text>
          </TouchableOpacity>
          {!collapsed.streak && (
            streakGoals.length === 0 ? (
              <Text style={s.emptySmall}>No streak goals</Text>
            ) : (
              streakGoals.map(sg => (
                <View key={sg.id} style={s.goalCard}>
                  <View style={s.goalHeader}>
                    <Text style={s.goalName}>{sg.name}</Text>
                    <Text style={[s.goalPct,{ color:'#6366F1' }]}>{sg.percent.toFixed(0)}%</Text>
                  </View>
                  <View style={s.progressBar}><View style={[s.progressFill,{ width: sg.percent+'%', backgroundColor:'#6366F1' }]} /></View>
                  <Text style={s.meta}>{sg.currentStreak} / {sg.targetDays} days • Longest {sg.longestStreak}</Text>
                </View>
              ))
            )
          )}
        </View>
        {goals.length === 0 && streakGoals.length === 0 && (
          <Text style={s.empty}>No goals yet. Tap + to create one.</Text>
        )}
        <View style={{ height: 120 }} />
      </ScrollView>
  {/* Removed floating FAB in favor of top inline create buttons */}
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex:1, backgroundColor:'#394579' },
  content: { padding:16, paddingTop:72 },
  backWrap: { marginBottom:12 },
  back: { color:'white', fontSize:14, fontWeight:'700', letterSpacing:0.5 },
  heading: { color:'white', fontSize:22, fontWeight:'700', marginBottom:24 },
  sectionBlock: { backgroundColor:'rgba(255,255,255,0.06)', borderRadius:18, padding:14, marginBottom:20, borderWidth:1, borderColor:'rgba(255,255,255,0.08)' },
  sectionHeaderRow: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:4 },
  sectionHeader: { color:'#FFFFFF', fontSize:16, fontWeight:'600' },
  sectionChevron: { color:'#9CA3AF', fontSize:14, fontWeight:'600' },
  headerRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:24 },
  createRow: { flexDirection:'row', alignItems:'center' },
  createBtn: { backgroundColor:'#10B981', paddingHorizontal:14, paddingVertical:10, borderRadius:12, marginLeft:8 },
  createBtnTxt: { color:'white', fontWeight:'600', fontSize:14 },
  empty: { color:'rgba(255,255,255,0.7)', fontSize:14, marginBottom:16 },
  emptySmall: { color:'rgba(255,255,255,0.55)', fontSize:12, marginBottom:10, paddingHorizontal:4 },
  goalCard: { backgroundColor:'white', borderRadius:16, padding:16, marginBottom:16 },
  goalHeader: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:8 },
  goalName: { fontSize:16, fontWeight:'600', color:'#111827', flex:1, marginRight:8 },
  goalPct: { fontSize:14, fontWeight:'600', color:'#10B981' },
  progressBar: { height:10, backgroundColor:'#E5E7EB', borderRadius:6, overflow:'hidden', marginBottom:6 },
  progressFill: { height:'100%', backgroundColor:'#10B981' },
  meta: { fontSize:12, color:'#6B7280' }
});
