/**
 * Ace Kernel Manager - 状态标签组件
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors, Radius, Spacing, FontSize } from '../constants';

interface StatusBadgeProps {
  label: string;
  color?: string;
  variant?: 'filled' | 'glass' | 'outline';
  size?: 'sm' | 'md';
}

export function StatusBadge({
  label,
  color = Colors.primary,
  variant = 'glass',
  size = 'sm',
}: StatusBadgeProps) {
  const sizeConfig = {
    sm: { paddingV: 3, paddingH: 10, fontSize: FontSize.xs, radius: Radius.full },
    md: { paddingV: 5, paddingH: 14, fontSize: FontSize.sm, radius: Radius.full },
  };

  const config = sizeConfig[size];

  return (
    <View style={[styles.container, { borderRadius: config.radius }]}>
      {variant === 'glass' ? (
        <BlurView intensity={60} tint="light" style={styles.blur}>
          <View
            style={[
              styles.inner,
              {
                backgroundColor: `${color}18`,
                borderColor: `${color}40`,
                paddingVertical: config.paddingV,
                paddingHorizontal: config.paddingH,
              },
            ]}
          >
            <View style={[styles.dot, { backgroundColor: color }]} />
            <Text style={[styles.text, { color, fontSize: config.fontSize }]}>{label}</Text>
          </View>
        </BlurView>
      ) : variant === 'filled' ? (
        <View
          style={[
            styles.inner,
            {
              backgroundColor: color,
              paddingVertical: config.paddingV,
              paddingHorizontal: config.paddingH,
            },
          ]}
        >
          <Text style={[styles.text, { color: Colors.textWhite, fontSize: config.fontSize }]}>
            {label}
          </Text>
        </View>
      ) : (
        <View
          style={[
            styles.inner,
            {
              backgroundColor: 'transparent',
              borderColor: color,
              borderWidth: 1,
              paddingVertical: config.paddingV,
              paddingHorizontal: config.paddingH,
            },
          ]}
        >
          <Text style={[styles.text, { color, fontSize: config.fontSize }]}>{label}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  blur: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.full,
    borderWidth: 0.5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
