/**
 * Ace Kernel Manager - 应用入口
 * 全局 Tab 导航管理
 */
import React, { useState, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomTabBar } from './src/navigation';
import {
  HomeScreen,
  ModulesScreen,
  SuperuserScreen,
  PartitionScreen,
  SettingsScreen,
} from './src/screens';
import type { TabName } from './src/types';
import Animated, { FadeIn } from 'react-native-reanimated';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabName>('home');

  const handleTabChange = useCallback((tab: TabName) => {
    setActiveTab(tab);
  }, []);

  const renderScreen = () => {
    switch (activeTab) {
      case 'home':
        return <HomeScreen />;
      case 'modules':
        return <ModulesScreen />;
      case 'superuser':
        return <SuperuserScreen />;
      case 'partition':
        return <PartitionScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Animated.View
          key={activeTab}
          style={{ flex: 1 }}
          entering={FadeIn.duration(200)}
        >
          {renderScreen()}
        </Animated.View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
