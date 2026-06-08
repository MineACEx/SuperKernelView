/**
 * Ace Kernel Manager - 空状态组件
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, Radius } from '../constants';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon = 'folder-open-outline', title, description, action }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <BlurView intensity={50} tint="light" style={styles.iconBlur}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={48} color={Colors.textTertiary} />
        </View>
      </BlurView>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {action && <View style={styles.actionContainer}>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
    gap: Spacing.md,
  },
  iconBlur: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: Radius.xl,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: Colors.separator,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  description: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  actionContainer: {
    marginTop: Spacing.md,
  },
});
