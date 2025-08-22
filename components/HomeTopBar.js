import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function HomeTopBar({ trackersCount, goalsCount }) {
  return (
    <View style={styles.topBar}>
      <View style={styles.profileInfo}>
        <View style={styles.avatar} />
        <View>
          <Text style={styles.greeting}>Hi, there</Text>
          <Text style={styles.summary}>{trackersCount} trackers · {goalsCount} goals</Text>
        </View>
      </View>
      <Text style={styles.settingsIcon}>⚙️</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:20 },
  profileInfo: { flexDirection:'row', alignItems:'center' },
  avatar: { width:40, height:40, borderRadius:20, backgroundColor:'#6B7280', marginRight:12 },
  greeting: { color:'#FFFFFF', fontSize:18, fontWeight:'600' },
  summary: { color:'#9CA3AF', fontSize:14 },
  settingsIcon: { fontSize:24, color:'#FFFFFF' }
});

export default HomeTopBar;
