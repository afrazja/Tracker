import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

/* Generic empty state card.
Props:
 - icon (string emoji)
 - title (string)
 - subtitle (string)
 - actionLabel (string)
 - onAction () => void
 - secondaryAction?: { label, onPress }
*/
export default function EmptyStateCard({ icon='✨', title, subtitle, actionLabel='Get Started', onAction, secondaryAction }) {
  return (
    <View style={styles.card}>
      <Text style={styles.icon}>{icon}</Text>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {onAction && (
        <TouchableOpacity style={styles.primaryBtn} onPress={onAction} accessibilityRole="button">
          <Text style={styles.primaryTxt}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
      {secondaryAction && (
        <TouchableOpacity style={styles.secondaryBtn} onPress={secondaryAction.onPress} accessibilityRole="button">
          <Text style={styles.secondaryTxt}>{secondaryAction.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor:'rgba(255,255,255,0.1)', borderRadius:20, padding:20, alignItems:'center', marginVertical:8 },
  icon: { fontSize:40, marginBottom:4 },
  title: { fontSize:18, fontWeight:'700', color:'#FFFFFF', textAlign:'center', marginTop:4 },
  subtitle: { fontSize:13, color:'#D1D5DB', textAlign:'center', marginTop:8, lineHeight:18 },
  primaryBtn: { marginTop:16, backgroundColor:'#10B981', paddingHorizontal:22, paddingVertical:12, borderRadius:14 },
  primaryTxt: { color:'#FFFFFF', fontSize:14, fontWeight:'700' },
  secondaryBtn: { marginTop:10, paddingHorizontal:18, paddingVertical:10 },
  secondaryTxt: { color:'#FFFFFF', fontSize:13, fontWeight:'500', textDecorationLine:'underline' }
});
