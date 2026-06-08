/**
 * Ace Kernel Manager - 信息行组件
 * 用于设备信息、设置等列表项
 */
import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors, Radius, Spacing, FontSize, Animation } from '../constants';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

interface InfoRowProps {
  label: string;
  value: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  showCopy?: boolean;
  onCopy?: (value: string) => void;
  style?: ViewStyle;
  isLast?: boolean;
}

export function InfoRow({
  label,
  value,
  icon,
  iconColor = Colors.primary,
  showCopy = false,
  onCopy,
  style,
  isLast = false,
}: InfoRowProps) {
  const scale = useSharedValue(1);

  const handlePress = useCallback(() => {
    if (onCopy) {
      scale.value = withSpring(0.97, Animation.spring);
      setTimeout(() => {
        scale.value = withSpring(1, Animation.springBouncy);
      }, 100);
      onCopy(value);
    }
  }, [onCopy, value, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const Container = showCopy && onCopy ? Animated.createAnimatedComponent(TouchableOpacity) : View;
  const containerProps =
    showCopy && onCopy ? { onPress: () => handlePress(), activeOpacity: 0.7 } : {};

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Container
        {...containerProps}
        style={[styles.container, !isLast && styles.borderBottom]}
      >
        <View style={styles.leftSection}>
          {icon && (
            <BlurView intensity={40} tint="light" style={styles.iconBlur}>
              <View style={[styles.iconContainer, { backgroundColor: `${iconColor}15` }]}>
                <Ionicons name={icon} size={18} color={iconColor} />
              </View>
            </BlurView>
          )}
          <Text style={styles.label}>{label}</Text>
        </View>
        <View style={styles.rightSection}>
          <Text style={styles.value} numberOfLines={3}>
            {value}
          </Text>
          {showCopy && onCopy && (
            <Ionicons name="copy-outline" size={16} color={Colors.textTertiary} />
          )}
        </View>
      </Container>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    minHeight: 52,
  },
  borderBottom: {
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.separator,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1.5,
    justifyContent: 'flex-end',
    gap: Spacing.sm,
  },
  iconBlur: {
    borderRadius: Radius.sm,
    overflow: 'hidden',
    marginRight: Spacing.md,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  value: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: '500',
    textAlign: 'right',
    flexShrink: 1,
  },
});
