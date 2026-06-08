/**
 * Ace Kernel Manager - 加载动画组件
 * MIUIx 风格液态加载
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Spacing } from '../constants';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface LoadingSpinnerProps {
  size?: number;
  color?: string;
}

export function LoadingSpinner({ size = 36, color = Colors.primary }: LoadingSpinnerProps) {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  React.useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1000, easing: Easing.linear }),
      -1,
      false
    );
    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 600, easing: Easing.easeInOut }),
        withTiming(0.9, { duration: 600, easing: Easing.easeInOut })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }, { scale: scale.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.ring, animatedStyle, { width: size, height: size, borderColor: `${color}30`, borderRadius: size / 2 }]}>
        <View style={[styles.dot, { backgroundColor: color, width: size * 0.15, height: size * 0.15, borderRadius: size * 0.075 }]} />
      </Animated.View>
    </View>
  );
}

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = '加载中...' }: LoadingScreenProps) {
  return (
    <View style={styles.screenContainer}>
      <LoadingSpinner size={48} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    borderWidth: 3,
    borderStyle: 'solid',
    borderTopColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  dot: {
    position: 'absolute',
    top: -1,
    left: '50%',
    marginLeft: -4,
  },
  screenContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    gap: Spacing.lg,
  },
});
