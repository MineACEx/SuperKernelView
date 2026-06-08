/**
 * Ace Kernel Manager - 底部 Tab 导航
 * MIUIx/HyperOS 3.0 风格悬浮 Tab 栏
 * 液态玻璃效果，大圆角
 */
import React, { useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, FontSize, Animation } from '../constants';
import type { TabName } from '../types';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface TabItem {
  name: TabName;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
}

const TABS: TabItem[] = [
  { name: 'home', label: '主页', icon: 'phone-portrait-outline', activeIcon: 'phone-portrait' },
  { name: 'modules', label: '模块', icon: 'cube-outline', activeIcon: 'cube' },
  { name: 'superuser', label: '授权', icon: 'shield-outline', activeIcon: 'shield-checkmark' },
  { name: 'partition', label: '分区', icon: 'hardware-chip-outline', activeIcon: 'hardware-chip' },
  { name: 'settings', label: '设置', icon: 'settings-outline', activeIcon: 'settings' },
];

interface BottomTabBarProps {
  activeTab: TabName;
  onTabChange: (tab: TabName) => void;
}

export function BottomTabBar({ activeTab, onTabChange }: BottomTabBarProps) {
  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <View style={styles.wrapper}>
        {/* 悬浮 Tab 栏 */}
        <BlurView intensity={90} tint="extraLight" style={styles.tabBarBlur}>
          <View style={styles.tabBar}>
            {/* 折射色散层 */}
            <View style={styles.chromaticLayer} />
            <View style={styles.refractionTop} />

            <View style={styles.tabContent}>
              {TABS.map((tab) => (
                <TabButton
                  key={tab.name}
                  tab={tab}
                  isActive={activeTab === tab.name}
                  onPress={() => onTabChange(tab.name)}
                />
              ))}
            </View>
          </View>
        </BlurView>
      </View>
    </SafeAreaView>
  );
}

interface TabButtonProps {
  tab: TabItem;
  isActive: boolean;
  onPress: () => void;
}

function TabButton({ tab, isActive, onPress }: TabButtonProps) {
  const scale = useSharedValue(1);
  const iconScale = useSharedValue(isActive ? 1 : 0.9);
  const dotWidth = useSharedValue(isActive ? 16 : 0);

  React.useEffect(() => {
    iconScale.value = withSpring(isActive ? 1 : 0.9, Animation.springBouncy);
    dotWidth.value = withTiming(isActive ? 16 : 0, { duration: Animation.normal });
  }, [isActive]);

  const handlePress = useCallback(() => {
    scale.value = withSequence(
      withSpring(0.85, Animation.spring),
      withSpring(1, Animation.springBouncy)
    );
    onPress();
  }, [onPress, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const dotStyle = useAnimatedStyle(() => ({
    width: dotWidth.value,
    opacity: dotWidth.value > 0 ? 1 : 0,
  }));

  return (
    <Animated.View style={[styles.tabItem, animatedStyle]}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7}
        style={styles.tabButton}
      >
        <Animated.View style={iconAnimatedStyle}>
          <Ionicons
            name={isActive ? tab.activeIcon : tab.icon}
            size={24}
            color={isActive ? Colors.tabBar.active : Colors.tabBar.inactive}
          />
        </Animated.View>
        <Animated.View style={[styles.activeDot, dotStyle]} />
        <Text
          style={[
            styles.tabLabel,
            { color: isActive ? Colors.tabBar.active : Colors.tabBar.inactive },
          ]}
        >
          {tab.label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// Text 组件需要导入
import { Text } from 'react-native';

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: 'transparent',
  },
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingBottom: Platform.OS === 'android' ? 8 : 0,
  },
  tabBarBlur: {
    borderRadius: Radius.tabBar,
    overflow: 'hidden',
    marginHorizontal: Spacing.xl,
    marginBottom: Platform.OS === 'android' ? 4 : 0,
    borderWidth: 0.5,
    borderColor: Colors.tabBar.border,
  },
  tabBar: {
    position: 'relative',
    overflow: 'hidden',
  },
  chromaticLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.glass.chromatic,
  },
  refractionTop: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    height: 20,
    backgroundColor: 'rgba(200, 200, 255, 0.04)',
    borderRadius: Radius.tabBar,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs,
    gap: 4,
  },
  activeDot: {
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.tabBar.active,
  },
  tabLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
