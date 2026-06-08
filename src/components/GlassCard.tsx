/**
 * Ace Kernel Manager - 液态玻璃卡片组件
 * MIUIx/HyperOS 3.0 风格，高斯模糊 + 折射色散
 */
import React, { useMemo } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors, Radius, Spacing } from '../constants';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'subtle';
  padding?: number;
  noBlur?: boolean;
}

export function GlassCard({
  children,
  style,
  variant = 'default',
  padding = Spacing.lg,
  noBlur = false,
}: GlassCardProps) {
  const containerStyle = useMemo(() => {
    const base: ViewStyle = {
      borderRadius: Radius.card,
      overflow: 'hidden',
      borderWidth: 0.5,
      borderColor: Colors.glass.border,
    };

    switch (variant) {
      case 'elevated':
        return {
          ...base,
          shadowColor: Colors.glass.shadow,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 1,
          shadowRadius: 24,
          elevation: 12,
        };
      case 'subtle':
        return {
          ...base,
          shadowColor: 'transparent',
          elevation: 0,
          borderWidth: 0,
        };
      default:
        return {
          ...base,
          shadowColor: Colors.glass.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 1,
          shadowRadius: 12,
          elevation: 4,
        };
    }
  }, [variant]);

  const innerStyle = useMemo(
    () => ({
      padding,
      backgroundColor: Colors.glass.background,
    }),
    [padding]
  );

  if (noBlur) {
    return (
      <View style={[containerStyle, innerStyle, style]}>
        {/* 折射色散层 */}
        <View style={styles.chromaticLayer} />
        {children}
      </View>
    );
  }

  return (
    <View style={[containerStyle, style]}>
      <BlurView intensity={80} tint="light" style={[StyleSheet.absoluteFill, styles.blur]}>
        {/* 折射色散效果 */}
        <View style={styles.chromaticLayer} />
        <View style={styles.refractionLayer} />
      </BlurView>
      <View style={innerStyle}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  blur: {
    overflow: 'hidden',
  },
  chromaticLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.glass.chromatic,
    borderRadius: Radius.card,
  },
  refractionLayer: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    borderRadius: Radius.card + 20,
    borderWidth: 1,
    borderColor: 'rgba(180, 180, 255, 0.06)',
    backgroundColor: 'rgba(200, 200, 255, 0.03)',
  },
});
