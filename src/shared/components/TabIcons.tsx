import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface IconProps {
  color: string;
}

/** A stack of three lines, standing for the story list. */
export function LibraryIcon({ color }: IconProps) {
  return (
    <View style={styles.box}>
      {[0, 1, 2].map(row => (
        <View key={row} style={[styles.bar, { backgroundColor: color }]} />
      ))}
    </View>
  );
}

export function FavoritesIcon({ color }: IconProps) {
  return <Text style={[styles.heart, { color }]}>♥</Text>;
}

/** A ring with a dot, standing for settings. */
export function SettingsIcon({ color }: IconProps) {
  return (
    <View style={[styles.ring, { borderColor: color }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: 22,
    height: 22,
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  bar: { height: 3, borderRadius: 2 },
  heart: { fontSize: 22, lineHeight: 24 },
  ring: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
