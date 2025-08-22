import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GoalsProvider, useGoals } from './GoalsContext';
import AddTrackerScreen from './AddTrackerScreen';
import AddGoalScreen from './AddGoalScreen';
import AddStreakGoalScreen from './AddStreakGoalScreen';
import GoalsDashboardScreen from './GoalsDashboardScreen';
import InsightsScreen from './InsightsScreen';
import TrackerPickerScreen from './TrackerPickerScreen';
import DisplayTrackerFieldsScreen from './DisplayTrackerFieldsScreen';
import ReadingDetailScreen from './ReadingDetailScreen';
import GenericDetailScreen from './GenericDetailScreen';
import EditGoalScreen from './EditGoalScreen';
import EditTrackerScreen from './EditTrackerScreen';
import { TrackersProvider, useTrackers } from './TrackersContext';
import { StreakGoalsProvider, useStreakGoals } from './StreakGoalsContext';
import { InsightsProvider } from './InsightsContext';
import HomeTopBar from './components/HomeTopBar';
import HomeMenuCards from './components/HomeMenuCards';
import TrackersSection from './components/TrackersSection';
import AddRecordModal from './components/AddRecordModal';
// Removed unused DailyGoalsSection/StreakGoalsSection imports after cleanup
import EmptyStateCard from './components/EmptyStateCard';

const HomeScreen = ({ navigation }) => {
  const { trackers = [], selectedTrackerIds = [], hydrated: trackersHydrated = true } = useTrackers();
  const { goals = [], hydrated: goalsHydrated = true } = useGoals();
  const { streakGoals = [], hydrated: streakHydrated = true } = useStreakGoals();
  const [expanded, setExpanded] = React.useState(false);
  const [addModalTracker, setAddModalTracker] = React.useState(null);
  const ready = trackersHydrated && goalsHydrated && streakHydrated;
  const handleAddRecord = React.useCallback((tracker) => {
    if (!tracker) return;
    setAddModalTracker(tracker);
  }, [navigation]);
  return (
    <ScrollView style={{ flex:1, backgroundColor:'#394579', paddingTop:72, paddingHorizontal:16 }} contentContainerStyle={{ paddingBottom:120 }}>
      <HomeTopBar trackersCount={trackers.length} goalsCount={goals.length} />
      <HomeMenuCards navigation={navigation} />
      {!ready && (
        <View style={{ padding:20, backgroundColor:'rgba(255,255,255,0.08)', borderRadius:16 }}>
          <Text style={{ color:'#fff' }}>Loading data…</Text>
        </View>
      )}
      {ready && (
        <TrackersSection
          trackers={trackers}
          selectedIds={selectedTrackerIds}
          expanded={expanded}
          onToggleExpand={() => setExpanded(e => !e)}
          navigation={navigation}
          openAddRecord={handleAddRecord}
        />
      )}
      {ready && trackers.length === 0 && (
        <EmptyStateCard title="No trackers yet" subtitle="Create your first tracker to begin" actionLabel="Add Tracker" onAction={() => navigation.navigate('AddTracker')} />
      )}
  <AddRecordModal tracker={addModalTracker} visible={!!addModalTracker} onClose={() => setAddModalTracker(null)} />
    </ScrollView>
  );
};

// ================= Root Assembly =================
const Stack = createNativeStackNavigator();

class ErrorBoundary extends React.Component {
  state = { hasError:false, error:null };
  static getDerivedStateFromError(e){ return { hasError:true, error:e }; }
  componentDidCatch(e,info){ console.error('Boundary', e, info); }
  render(){
    if (this.state.hasError) {
      return <View style={{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:'#222'}}><Text style={{color:'#fff'}}>Crashed</Text></View>;
    }
    return this.props.children;
  }
}

const MobileTrackerApp = () => {
  // Order matters: TrackersProvider must wrap Goals/Streak providers since they consume useTrackers.
  const ProviderTree = ({ children }) => (
    <TrackersProvider>
      <GoalsProvider>
        <StreakGoalsProvider>
          <InsightsProvider>
            {children}
          </InsightsProvider>
        </StreakGoalsProvider>
      </GoalsProvider>
    </TrackersProvider>
  );
  return (
    <ErrorBoundary>
      <ProviderTree>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown:false }}>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="AddTracker" component={AddTrackerScreen} />
            <Stack.Screen name="AddGoal" component={AddGoalScreen} />
            <Stack.Screen name="AddStreakGoal" component={AddStreakGoalScreen} />
            <Stack.Screen name="GoalsDashboard" component={GoalsDashboardScreen} />
            <Stack.Screen name="TrackerPicker" component={TrackerPickerScreen} />
            <Stack.Screen name="ReadingDetail" component={ReadingDetailScreen} />
            <Stack.Screen name="TrackerDetail" component={GenericDetailScreen} />
            <Stack.Screen name="EditGoal" component={EditGoalScreen} />
            <Stack.Screen name="EditTracker" component={EditTrackerScreen} />
            <Stack.Screen name="Insights" component={InsightsScreen} />
            <Stack.Screen name="DisplayTrackerFields" component={DisplayTrackerFieldsScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </ProviderTree>
    </ErrorBoundary>
  );
};

// (Former debug instrumentation removed)

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#394579', paddingStart: 40, paddingEnd: 16, paddingTop: 72 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  profileInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#6B7280', marginRight: 12 },
  greeting: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
  summary: { color: '#9CA3AF', fontSize: 14 },
  settingsIcon: { fontSize: 24, color: '#FFFFFF' },
  tabRow: { flexDirection: 'row', marginBottom: 20 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, marginRight: 4, borderRadius: 12 },
  trackerTab: { backgroundColor: '#2563EB' },
  goalTab: { backgroundColor: '#10B981' },
  insightTab: { backgroundColor: '#F59E0B' },
  tabIcon: { fontSize: 20, marginBottom: 4, color: 'white' },
  tabLabel: { fontSize: 14, fontWeight: '600', color: 'white' },
  cardsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  goalsHeader: { color: '#FFFFFF', fontSize: 20, fontWeight: '600', marginVertical: 16 },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, gap: 8 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
  dividerLabel: { color: '#FFFFFF', fontWeight: '600', fontSize: 14, letterSpacing: 0.5 },
  goalRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  goalLabel: { flex: 1, color: '#FFFFFF', fontWeight: '500', marginRight: 8 },
  progressBar: { flex: 2, height: 20, backgroundColor: '#E5E7EB', borderRadius: 12, overflow: 'hidden', marginRight: 8 },
  progressFill: { height: '100%', borderRadius: 12 },
  goalInfo: { fontSize: 12, color: '#FFFFFF', marginRight: 8 },
  dailyGoalCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 12, marginHorizontal: 2 },
  dailyGoalName: { fontSize: 14, fontWeight: '600', color: '#111827', flex: 1, marginRight: 8 },
  dailyGoalPct: { fontSize: 14, fontWeight: '700', color: '#10B981' },
  dailyProgressBar: { height: 8, backgroundColor: '#E5E7EB', borderRadius: 6, overflow: 'hidden', marginBottom: 4 },
  dailyProgressFill: { height: '100%', backgroundColor: '#10B981' },
  dailyGoalMeta: { fontSize: 12, color: '#6B7280' },
  streakCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 12, marginHorizontal: 2 },
  streakName: { fontSize: 14, fontWeight: '600', color: '#111827', flex: 1, marginRight: 8 },
  streakPct: { fontSize: 14, fontWeight: '700', color: '#6366F1' },
  streakProgressBar: { height: 8, backgroundColor: '#E5E7EB', borderRadius: 6, overflow: 'hidden', marginBottom: 4 },
  streakProgressFill: { height: '100%', backgroundColor: '#6366F1' },
  streakMeta: { fontSize: 12, color: '#6B7280' },
  trackerDividerWrapper: { marginTop: -4, marginBottom: 8, alignItems: 'center' },
  trackerDividerTouchable: { width: '100%', backgroundColor: 'rgba(255,255,255,0.08)', paddingVertical: 10, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dragHandle: { width: 60, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.4)', marginBottom: 6 },
  dividerLabelText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },
  dueTagContainer: { backgroundColor: '#4B5563', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  dueTagText: { fontSize: 10, color: '#FFFFFF' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  modalCard: { width: '90%', maxWidth: 420, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, elevation: 6 },
  modalClose: { position: 'absolute', top: 12, right: 12 },
  modalTitle: { textAlign: 'center', fontWeight: '700', fontSize: 20, color: '#111827', marginBottom: 8 },
  formGroup: { marginBottom: 16 },
  formLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 4 },
  formInput: { borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  modalPrimaryBtn: { backgroundColor: '#10B981', borderRadius: 16, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  modalPrimaryTxt: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  retryChip: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  retryChipTxt: { color: '#fff', fontSize: 11, fontWeight: '600' },
  insightsHeader: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginBottom: 12, marginTop: 8 },
  insightCardRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16, gap: 12 },
  secondaryGroup: { backgroundColor: 'rgba(255,255,255,0.045)', padding: 12, borderRadius: 16, marginTop: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  collapsedSummary: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  collapsedSummaryText: { color: '#E5E7EB', fontSize: 13, fontWeight: '500' },
  collapsedSummaryBtn: { backgroundColor: '#2563EB', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10 },
  collapsedSummaryBtnTxt: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  miniCard: { backgroundColor: 'rgba(255,255,255,0.12)', padding: 12, borderRadius: 14, width: '30%' },
  miniCardTitle: { color: '#D1D5DB', fontSize: 11, fontWeight: '600', marginBottom: 4 },
  miniCardValue: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  trendRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  trendTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: '600', width: 90 },
  trendBarsWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 },
  trendBar: { height: 10, borderRadius: 4 },
  trendDelta: { width: 50, textAlign: 'right', fontSize: 12, fontWeight: '700' },
  expenseRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  expenseName: { color: '#FFFFFF', fontSize: 12, width: 90 },
  expenseBarBg: { flex: 1, height: 10, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 6, marginHorizontal: 8 },
  expenseBarFill: { height: '100%', backgroundColor: '#F59E0B', borderRadius: 6 },
  expenseValue: { color: '#FFFFFF', fontSize: 12, fontWeight: '600', width: 50, textAlign: 'right' },
  goalPaceCard: { backgroundColor: 'rgba(255,255,255,0.12)', padding: 12, borderRadius: 14, marginBottom: 12 },
  goalPaceTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: '600', flex: 1, marginRight: 8 },
  goalPaceBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, color: '#fff', overflow: 'hidden', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  goalPaceBarBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 6, overflow: 'hidden', marginVertical: 4 },
  goalPaceBarFill: { height: '100%', backgroundColor: '#10B981' },
  goalPaceMeta: { color: '#D1D5DB', fontSize: 11, marginTop: 2 },
  streakRowInsight: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 12 },
  streakRowTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: '600', marginBottom: 4 },
  streakInsightBarBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 4, overflow: 'hidden', marginTop: 4 },
  streakInsightBarFill: { height: '100%', backgroundColor: '#6366F1' },
  streakRowMeta: { color: '#FFFFFF', fontSize: 11, fontWeight: '600', width: 70, textAlign: 'right' },
  activityRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  activityTitle: { color: '#FFFFFF', fontSize: 12, flex: 1 },
  activityValue: { color: '#FFFFFF', fontSize: 12, fontWeight: '600', width: 70 },
  activityDate: { color: '#9CA3AF', fontSize: 11, width: 80, textAlign: 'right' },
  snackbar: { position: 'absolute', left: 16, right: 16, bottom: 24, backgroundColor: '#111827', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  snackbarText: { color: '#FFFFFF', fontSize: 14, fontWeight: '500', flex: 1 },
  snackbarAction: { marginLeft: 12, paddingHorizontal: 8, paddingVertical: 4 },
  snackbarActionText: { color: '#10B981', fontSize: 14, fontWeight: '700', letterSpacing: 0.5 }
});

export default MobileTrackerApp;
