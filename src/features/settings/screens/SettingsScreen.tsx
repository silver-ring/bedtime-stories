import React from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { Button } from '../../../shared/components/Button';
import { ScreenContainer } from '../../../shared/components/ScreenContainer';
import { useTheme } from '../../../shared/theme/ThemeProvider';
import {
  READER_BASE_FONT_SIZE,
  READER_LINE_HEIGHT_RATIO,
  radius,
  spacing,
} from '../../../shared/theme/tokens';
import type { ThemeName } from '../../../types/domain';
import { allProgressCleared } from '../../progress/progressSlice';
import { fetchStories } from '../../stories/storiesSlice';
import { simulateFailureSet } from '../devSlice';
import {
  fontScaleDecreased,
  fontScaleIncreased,
  MAX_FONT_SCALE,
  MIN_FONT_SCALE,
  themeSet,
} from '../readerSettingsSlice';

const THEME_OPTIONS: ReadonlyArray<{ value: ThemeName; label: string }> = [
  { value: 'system', label: 'Match device' },
  { value: 'light', label: 'Light' },
  { value: 'sepia', label: 'Sepia' },
  { value: 'dark', label: 'Dark' },
];

export function SettingsScreen() {
  const dispatch = useAppDispatch();
  const { palette } = useTheme();
  const { fontScale, theme } = useAppSelector(state => state.readerSettings);
  const simulateFailure = useAppSelector(state => state.dev.simulateFailure);
  const previewSize = READER_BASE_FONT_SIZE * fontScale;

  const confirmReset = () => {
    Alert.alert(
      'Reset reading progress?',
      'Your favorites and settings are kept.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => dispatch(allProgressCleared()),
        },
      ],
    );
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content}>
        <Section title="Theme">
          {THEME_OPTIONS.map(option => {
            const selected = option.value === theme;
            return (
              <Pressable
                key={option.value}
                onPress={() => dispatch(themeSet(option.value))}
                accessibilityRole="radio"
                accessibilityLabel={`${option.label} theme`}
                accessibilityState={{ selected }}
                style={[
                  styles.option,
                  {
                    backgroundColor: palette.surface,
                    borderColor: selected ? palette.accent : palette.border,
                  },
                ]}
              >
                <Text style={[styles.optionLabel, { color: palette.text }]}>
                  {option.label}
                </Text>
                <Text style={[styles.radio, { color: palette.accent }]}>
                  {selected ? '●' : '○'}
                </Text>
              </Pressable>
            );
          })}
        </Section>

        <Section title="Text size">
          <View style={styles.stepper}>
            <Button
              label="A−"
              accessibilityLabel="Decrease text size"
              variant="secondary"
              onPress={() =>
                fontScale > MIN_FONT_SCALE && dispatch(fontScaleDecreased())
              }
            />
            <Text style={[styles.optionLabel, { color: palette.text }]}>
              {Math.round(fontScale * 100)}%
            </Text>
            <Button
              label="A+"
              accessibilityLabel="Increase text size"
              variant="secondary"
              onPress={() =>
                fontScale < MAX_FONT_SCALE && dispatch(fontScaleIncreased())
              }
            />
          </View>
          <Text
            maxFontSizeMultiplier={2}
            style={{
              color: palette.text,
              fontSize: previewSize,
              lineHeight: previewSize * READER_LINE_HEIGHT_RATIO,
            }}
          >
            Once upon a time, in a land far away, a little lantern glowed all
            night.
          </Text>
        </Section>

        <Section title="Reading progress">
          <Button
            label="Reset reading progress"
            variant="secondary"
            onPress={confirmReset}
          />
        </Section>

        <Section title="Developer">
          <View
            style={[
              styles.option,
              { backgroundColor: palette.surface, borderColor: palette.border },
            ]}
          >
            <Text style={[styles.optionLabel, { color: palette.text }]}>
              Simulate load failure
            </Text>
            <Switch
              value={simulateFailure}
              onValueChange={value => {
                dispatch(simulateFailureSet(value));
              }}
              accessibilityLabel="Simulate load failure"
            />
          </View>
          <Button
            label="Reload stories"
            variant="secondary"
            onPress={() => dispatch(fetchStories({ force: true }))}
          />
        </Section>
      </ScrollView>
    </ScreenContainer>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { palette } = useTheme();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: palette.textMuted }]}>
        {title}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: 48 },
  section: { gap: spacing.sm, marginBottom: spacing.xl },
  sectionTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase' },
  option: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
  },
  optionLabel: { fontSize: 16, fontWeight: '600' },
  radio: { fontSize: 18 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
