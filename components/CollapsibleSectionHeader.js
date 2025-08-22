import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function CollapsibleSectionHeader({ title, subtitle, collapsed, onToggle, primary }) {
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onToggle} style={[styles.row, primary && styles.primaryRow]}>
      <View style={{ flex:1 }}>
        <Text style={[styles.title, primary && styles.primaryTitle]}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <Text style={[styles.chevron, primary && styles.primaryChevron]}>{collapsed ? '▼' : '▲'}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection:'row', alignItems:'center', paddingVertical:6, marginTop:24 },
  primaryRow: { marginTop:32 },
  title: { fontSize:16, fontWeight:'600', color:'#E5E7EB' },
  primaryTitle: { fontSize:20, fontWeight:'700', color:'#FFFFFF' },
  subtitle: { fontSize:11, color:'#9CA3AF', marginTop:2 },
  chevron: { fontSize:14, color:'#9CA3AF', fontWeight:'600', paddingHorizontal:4 },
  primaryChevron: { color:'#FFFFFF' }
});
