import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function HomeMenuCards({ navigation }) {
  return (
    <View style={styles.row}>
      <TouchableOpacity style={[styles.card,{ backgroundColor:'#2563EB', marginRight:8 }]} onPress={() => navigation.navigate('TrackerPicker')}>
        <Text style={styles.icon}>📋</Text>
        <Text style={styles.label}>Trackers</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.card,{ backgroundColor:'#10B981', marginHorizontal:4 }]} onPress={() => navigation.navigate('GoalsDashboard')}>
        <Text style={styles.icon}>🎯</Text>
        <Text style={styles.label}>Goals</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.card,{ backgroundColor:'#F59E0B', marginLeft:8 }]} onPress={() => navigation.navigate('Insights')}>
        <Text style={styles.icon}>📈</Text>
        <Text style={styles.label}>Insights</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection:'row', justifyContent:'space-between', marginVertical:24 },
  card: { flex:1, borderRadius:16, alignItems:'center', paddingVertical:32 },
  icon: { fontSize:32, color:'white', marginBottom:8 },
  label: { color:'white', fontWeight:'700', fontSize:18 }
});
