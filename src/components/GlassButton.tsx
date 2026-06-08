/**
 * Ace Kernel Manager - 玻璃按钮组件
 * 液态玻璃风格，带点击动效
 */
import React, { useCallback } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors, Radius, Spacing, FontSize, Animation } from '../constants';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';

interface GlassButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export function GlassButton({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
  fullWidth = false,
}: GlassButtonProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const handlePress = useCallback(() => {
    if (disabled || loading) return;

    // 点击缩放动效
    scale.value = withSequence(
      withSpring(0.95, Animation.spring),
      withSpring(1, Animation.springBouncy)
    );

    onPress();
  }, [disabled, loading, onPress, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const variantColors = {
    primary: { bg: Colors.primary, text: Colors.textWhite, border: Colors.primary },
    secondary: {
      bg: Colors.glass.background,
      text: Colors.primary,
      border: Colors.glass.border,
    },
    danger: { bg: Colors.error, text: Colors.textWhite, border: Colors.error },
    success: { bg: Colors.success, text: Colors.textWhite, border: Colors.success },
    ghost: {
      bg: 'transparent',
      text: Colors.primary,
      border: 'transparent',
    },
  };

  const sizeStyles = {
    sm: { paddingV: Spacing.sm, paddingH: Spacing.lg, fontSize: FontSize.sm, radius: Radius.button },
    md: { paddingV: Spacing.md, paddingH: Spacing.xl, fontSize: FontSize.md, radius: Radius.button },
    lg: { paddingV: Spacing.lg, paddingH: Spacing.xxl, fontSize: FontSize.lg, radius: Radius.md },
  };

  const colors = variantColors[variant];
  const sizeConfig = sizeStyles[size];

  return (
    <Animated.View style={[animatedStyle, fullWidth && styles.fullWidth, style]}>
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled || loading}
        activeOpacity={0.7}
        style={[
          styles.container,
          {
            paddingVertical: sizeConfig.paddingV,
            paddingHorizontal: sizeConfig.paddingH,
            borderRadius: sizeConfig.radius,
          },
        ]}
      >
        {variant === 'secondary' || variant === 'ghost' ? (
          <BlurView intensity={60} tint="light" style={styles.blurContainer}>
            <View style={[styles.innerContainer, { borderRadius: sizeConfig.radius }]}>
              {loading ? (
                <ActivityIndicator color={colors.text} size="small" />
              ) : (
                <>
                  {icon && <View style={styles.iconContainer}>{icon}</View>}
                  <Text
                    style={[
                      styles.text,
                      { color: colors.text, fontSize: sizeConfig.fontSize },
                      textStyle,
                    ]}
                  >
                    {title}
                  </Text>
                </>
              )}
            </View>
          </BlurView>
        ) : (
          <View
            style={[
              styles.innerContainer,
              styles.solidContainer,
              { backgroundColor: colors.bg, borderRadius: sizeConfig.radius },
            ]}
          >
            {loading ? (
              <ActivityIndicator color={colors.text} size="small" />
            ) : (
              <>
                {icon && <View style={styles.iconContainer}>{icon}</View>}
                <Text
                  style={[
                    styles.text,
                    { color: colors.text, fontSize: sizeConfig.fontSize },
                    textStyle,
                  ]}
                >
                  {title}
                </Text>
              </>
            )}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: Colors.glass.border,
  },
  blurContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  innerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  solidContainer: {
    shadowColor: 'rgba(0, 122, 255, 0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 6,
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  iconContainer: {
    marginRight: Spacing.sm,
  },
  fullWidth: {
    width: '100%',
  },
});
