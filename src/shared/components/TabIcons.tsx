import React from 'react';
import { StyleSheet, View } from 'react-native';

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

/**
 * A heart built from two rotated rounded rectangles. A text glyph would be
 * swapped for a color emoji on Android and ignore the tab color.
 */
export function FavoritesIcon({ color }: IconProps) {
  return (
    <View style={styles.heart}>
      <View
        style={[styles.lobe, styles.lobeLeft, { backgroundColor: color }]}
      />
      <View
        style={[styles.lobe, styles.lobeRight, { backgroundColor: color }]}
      />
    </View>
  );
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
  heart: { width: 24, height: 22 },
  lobe: {
    position: 'absolute',
    top: 0,
    width: 11,
    height: 17,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  lobeLeft: {
    left: 12,
    transform: [{ rotate: '-45deg' }],
    transformOrigin: '0% 100%',
  },
  lobeRight: {
    left: 1,
    transform: [{ rotate: '45deg' }],
    transformOrigin: '100% 100%',
  },
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
