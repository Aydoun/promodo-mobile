import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FocusRing } from '@/components/focus-ring';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  BottomTabInset,
  Fonts,
  MaxContentWidth,
  PhaseColors,
  Spacing,
} from '@/constants/theme';
import { SessionsPerCycle, usePomodoro, type Phase } from '@/hooks/use-pomodoro';
import { useTheme } from '@/hooks/use-theme';

const PhaseLabels: Record<Phase, string> = {
  focus: 'Focus',
  shortBreak: 'Short break',
  longBreak: 'Long break',
};

// Fixed rather than derived from the window width: web pre-renders with a width
// of 0, and fits the narrowest phones (320pt) inside the horizontal padding.
const RingSize = 268;

// On web the tab bar floats over the top of the screen.
const WebTopInset = Platform.OS === 'web' ? 88 : 0;

function formatClock(ms: number) {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatDuration(ms: number) {
  const totalMinutes = Math.round(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export default function HomeScreen() {
  const theme = useTheme();
  const timer = usePomodoro();

  const accent = PhaseColors[timer.phase];
  const sessionNumber = Math.min(timer.cycleCount + 1, SessionsPerCycle);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <ThemedText type="smallBold">{PhaseLabels[timer.phase]}</ThemedText>
        </View>

        <View style={styles.timerSection}>
          <FocusRing
            progress={timer.progress}
            size={RingSize}
            color={accent}
            trackColor={theme.backgroundElement}>
            <ThemedText style={styles.clock} accessibilityRole="timer">
              {formatClock(timer.remainingMs)}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {timer.phase === 'focus'
                ? `Session ${sessionNumber} of ${SessionsPerCycle}`
                : PhaseLabels[timer.phase]}
            </ThemedText>
          </FocusRing>

          <View
            style={styles.dots}
            accessible
            accessibilityLabel={`${timer.cycleCount} of ${SessionsPerCycle} sessions done`}>
            {Array.from({ length: SessionsPerCycle }, (_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      i < timer.cycleCount ? PhaseColors.focus : theme.backgroundSelected,
                  },
                ]}
              />
            ))}
          </View>

          <View style={styles.controls}>
            <IconButton
              icon={{ ios: 'arrow.counterclockwise', android: 'refresh', web: 'refresh' }}
              label="Reset timer"
              onPress={timer.reset}
            />
            <Pressable
              onPress={timer.toggle}
              accessibilityRole="button"
              accessibilityLabel={timer.isRunning ? 'Pause' : 'Start'}
              style={({ pressed }) => [
                styles.primaryButton,
                { backgroundColor: accent },
                pressed && styles.pressed,
              ]}>
              <SymbolView
                name={
                  timer.isRunning
                    ? { ios: 'pause.fill', android: 'pause', web: 'pause' }
                    : { ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' }
                }
                tintColor="#000000"
                size={30}
              />
            </Pressable>
            <IconButton
              icon={{ ios: 'forward.end.fill', android: 'skip_next', web: 'skip_next' }}
              label="Skip to next phase"
              onPress={timer.skip}
            />
          </View>
        </View>

        <ThemedView type="backgroundElement" style={styles.todayCard}>
          <ThemedText type="small" themeColor="textSecondary">
            Today
          </ThemedText>
          <ThemedText type="small">
            {timer.today.sessions} {timer.today.sessions === 1 ? 'session' : 'sessions'} ·{' '}
            {formatDuration(timer.today.focusMs)}
          </ThemedText>
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

function IconButton({
  icon,
  label,
  onPress,
}: {
  icon: SymbolViewProps['name'];
  label: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={({ pressed }) => [
        styles.iconButton,
        { backgroundColor: theme.backgroundElement },
        pressed && styles.pressed,
      ]}>
      <SymbolView name={icon} tintColor={theme.textSecondary} size={22} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingTop: WebTopInset,
    paddingBottom: BottomTabInset + Spacing.three,
    gap: Spacing.three,
  },
  header: {
    paddingTop: Spacing.three,
  },
  timerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.four,
  },
  clock: {
    fontSize: 56,
    lineHeight: 64,
    fontWeight: 500,
    fontFamily: Fonts.rounded,
    fontVariant: ['tabular-nums'],
  },
  dots: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.four,
  },
  iconButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  todayCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.four,
  },
});
