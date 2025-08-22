import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function ScreenHeader({ title, onBack, right }) {
  return (
    <View style={s.row}>
      <TouchableOpacity onPress={onBack} accessibilityRole="button" accessibilityLabel="Go back" style={s.backHit}>
        <Text style={s.back}>&lt; Back</Text>
      </TouchableOpacity>
      <Text style={s.title} numberOfLines={1}>{title}</Text>
      <View style={{ width:60, alignItems:'flex-end' }}>
        {right}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:20, marginTop:-40 },
  backHit: { paddingVertical:8, paddingRight:12, paddingLeft:4 },
  back: { color:'#FFFFFF', fontSize:14, fontWeight:'600' },
  title: { color:'#FFFFFF', fontSize:22, fontWeight:'700', textAlign:'center', flex:1, paddingHorizontal:4 },
});
