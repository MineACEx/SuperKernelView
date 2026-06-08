/**
 * Ace Kernel Manager - 设置页面
 */
import React, { useCallback, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import {
  GlassCard,
  GlassButton,
  InfoRow,
  LoadingScreen,
} from '../components';
import { BottomTabBar } from '../navigation';
import { useRootStatus, useDeviceInfo, useSystemDetails } from '../hooks';
import { executeCommand } from '../utils/NativeBridge';
import { Colors, Spacing, FontSize, Radius, APP_NAME, APP_VERSION, PACKAGE_NAME } from '../constants';
import Animated, {
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';

export function SettingsScreen() {
  const { rootStatus, managerInfo, refresh: refreshRoot } = useRootStatus();
  const { deviceInfo, refresh: refreshDevice } = useDeviceInfo();
  const { mountPoints, services, networkStats, loading, refresh: refreshSystem } = useSystemDetails(true);
  const [showMounts, setShowMounts] = useState(false);
  const [showServices, setShowServices] = useState(false);
  const [showNetwork, setShowNetwork] = useState(false);

  const isRooted = rootStatus?.isRooted ?? false;

  const handleRefreshAll = useCallback(async () => {
    await Promise.all([refreshRoot(), refreshDevice(), refreshSystem()]);
    Alert.alert('完成', '所有信息已刷新');
  }, [refreshRoot, refreshDevice, refreshSystem]);

  const handleReboot = useCallback(() => {
    Alert.alert('重启设备', '确定要重启设备吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '重启',
        style: 'destructive',
        onPress: async () => {
          try {
            await executeCommand('reboot');
          } catch (e: any) {
            Alert.alert('失败', e.message);
          }
        },
      },
    ]);
  }, []);

  const handleRebootRecovery = useCallback(() => {
    Alert.alert('重启到 Recovery', '确定要重启到 Recovery 模式吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '重启',
        style: 'destructive',
        onPress: async () => {
          try {
            await executeCommand('reboot recovery');
          } catch (e: any) {
            Alert.alert('失败', e.message);
          }
        },
      },
    ]);
  }, []);

  const handleRebootBootloader = useCallback(() => {
    Alert.alert('重启到 Bootloader', '确定要重启到 Bootloader 吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '重启',
        style: 'destructive',
        onPress: async () => {
          try {
            await executeCommand('reboot bootloader');
          } catch (e: any) {
            Alert.alert('失败', e.message);
          }
        },
      },
    ]);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 页面标题 */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <Animated.Text style={styles.pageTitle}>设置</Animated.Text>
          <Animated.Text style={styles.pageDesc}>应用信息与系统操作</Animated.Text>
        </Animated.View>

        {/* 应用信息 */}
        <Animated.View entering={FadeInDown.delay(100).duration(350)} style={styles.section}>
          <Animated.Text style={styles.sectionTitle}>应用信息</Animated.Text>
          <GlassCard padding={0}>
            <InfoRow
              label="应用名称"
              value={APP_NAME}
              icon="information-circle-outline"
              isLast={false}
            />
            <InfoRow
              label="版本"
              value={`v${APP_VERSION} (${PACKAGE_NAME})`}
              icon="git-branch-outline"
              isLast={false}
            />
            <InfoRow
              label="Root 状态"
              value={isRooted ? `${managerInfo?.managerType || 'Unknown'}` : '未获取'}
              iconColor={isRooted ? Colors.success : Colors.error}
              icon="shield-checkmark-outline"
              isLast
            />
          </GlassCard>
        </Animated.View>

        {/* 系统操作 */}
        {isRooted && (
          <Animated.View entering={FadeInDown.delay(200).duration(350)} style={styles.section}>
            <Animated.Text style={styles.sectionTitle}>系统操作</Animated.Text>
            <GlassCard>
              <View style={styles.actionGrid}>
                <GlassButton
                  title="🔄 重启"
                  variant="secondary"
                  size="md"
                  fullWidth
                  onPress={handleReboot}
                />
                <GlassButton
                  title="🔧 Recovery"
                  variant="secondary"
                  size="md"
                  fullWidth
                  onPress={handleRebootRecovery}
                />
                <GlassButton
                  title="⚡ Bootloader"
                  variant="secondary"
                  size="md"
                  fullWidth
                  onPress={handleRebootBootloader}
                />
              </View>
            </GlassCard>
          </Animated.View>
        )}

        {/* 系统详情 */}
        <Animated.View entering={FadeInDown.delay(300).duration(350)} style={styles.section}>
          <Animated.Text style={styles.sectionTitle}>系统详情</Animated.Text>
          <GlassCard>
            <GlassButton
              title={showMounts ? '收起挂载点' : '查看挂载点'}
              variant="secondary"
              size="sm"
              fullWidth
              onPress={() => setShowMounts(!showMounts)}
            />
            {showMounts && (
              <Animated.View entering={FadeIn}>
                <Animated.Text style={styles.monospaceText} numberOfLines={20}>
                  {mountPoints || '无法获取'}
                </Animated.Text>
              </Animated.View>
            )}
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(350).duration(350)} style={styles.section}>
          <GlassCard>
            <GlassButton
              title={showServices ? '收起服务列表' : '查看运行服务'}
              variant="secondary"
              size="sm"
              fullWidth
              onPress={() => setShowServices(!showServices)}
            />
            {showServices && (
              <Animated.View entering={FadeIn}>
                <Animated.Text style={styles.monospaceText} numberOfLines={20}>
                  {services || '无法获取'}
                </Animated.Text>
              </Animated.View>
            )}
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(350)} style={styles.section}>
          <GlassCard>
            <GlassButton
              title={showNetwork ? '收起网络统计' : '查看网络统计'}
              variant="secondary"
              size="sm"
              fullWidth
              onPress={() => setShowNetwork(!showNetwork)}
            />
            {showNetwork && (
              <Animated.View entering={FadeIn}>
                <Animated.Text style={styles.monospaceText} numberOfLines={20}>
                  {networkStats || '无法获取'}
                </Animated.Text>
              </Animated.View>
            )}
          </GlassCard>
        </Animated.View>

        {/* 刷新 */}
        <Animated.View entering={FadeInDown.delay(450).duration(350)} style={styles.section}>
          <GlassButton
            title="刷新所有信息"
            variant="primary"
            size="lg"
            fullWidth
            onPress={handleRefreshAll}
          />
        </Animated.View>

        {/* 关于 */}
        <Animated.View entering={FadeInDown.delay(500).duration(350)} style={styles.section}>
          <GlassCard>
            <Animated.Text style={styles.aboutText}>
              {APP_NAME} v{APP_VERSION}
            </Animated.Text>
            <Animated.Text style={styles.aboutDesc}>
              一款自用的 Root 权限管理工具，采用 MIUIx/HyperOS 3.0 设计语言。
              兼容 Magisk、KernelSU、APatch 等主流 Root 方案。
            </Animated.Text>
          </GlassCard>
        </Animated.View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <BottomTabBar activeTab="settings" onTabChange={() => {}} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  pageTitle: {
    fontSize: FontSize.title,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  pageDesc: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  section: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    letterSpacing: -0.2,
  },
  actionGrid: {
    gap: Spacing.sm,
  },
  monospaceText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
    lineHeight: 18,
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: Radius.sm,
    padding: Spacing.md,
  },
  aboutText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  aboutDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: Spacing.sm,
  },
  bottomSpacer: {
    height: 120,
  },
});
