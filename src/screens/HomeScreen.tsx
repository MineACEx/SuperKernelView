/**
 * Ace Kernel Manager - 主页面
 * 设备信息面板，Root 状态总览
 */
import React, { useCallback, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard, InfoRow, StatusBadge, LoadingScreen } from '../components';
import { BottomTabBar } from '../navigation';
import { useRootStatus, useDeviceInfo } from '../hooks';
import { Colors, Spacing, FontSize, Radius, SELinuxLabels, APP_NAME, APP_VERSION } from '../constants';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
  FadeInDown,
  Layout,
} from 'react-native-reanimated';

export function HomeScreen() {
  const { rootStatus, managerInfo, loading: rootLoading, refresh: refreshRoot } = useRootStatus();
  const { deviceInfo, loading: deviceLoading, refresh: refreshDevice } = useDeviceInfo();
  const [refreshing, setRefreshing] = useState(false);

  const isRooted = rootStatus?.isRooted ?? false;
  const loading = rootLoading || deviceLoading;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshRoot(), refreshDevice()]);
    setRefreshing(false);
  }, [refreshRoot, refreshDevice]);

  const handleCopy = useCallback((value: string) => {
    Alert.alert('已复制', value);
  }, []);

  if (loading) return <LoadingScreen />;

  const selinuxInfo = SELinuxLabels[deviceInfo?.selinuxStatus || 'Unknown'] || SELinuxLabels.Unknown;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* 顶部 Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <BlurView intensity={70} tint="extraLight" style={styles.headerBlur}>
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <Ionicons name="shield-checkmark" size={28} color={Colors.primary} />
                <View style={styles.headerText}>
                  <Animated.Text entering={FadeIn} style={styles.appName}>{APP_NAME}</Animated.Text>
                  <Animated.Text entering={FadeIn.delay(100)} style={styles.appVersion}>
                    v{APP_VERSION}
                  </Animated.Text>
                </View>
              </View>
              <StatusBadge
                label={isRooted ? '已 Root' : '未 Root'}
                color={isRooted ? Colors.success : Colors.textTertiary}
                variant="glass"
              />
            </View>
          </BlurView>
        </Animated.View>

        {/* Root 状态卡片 */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.section}>
          <GlassCard variant="elevated">
            <View style={styles.rootStatusHeader}>
              <Ionicons
                name={isRooted ? 'checkmark-circle' : 'close-circle'}
                size={32}
                color={isRooted ? Colors.success : Colors.error}
              />
              <View style={styles.rootStatusText}>
                <Animated.Text style={styles.rootStatusTitle}>
                  {isRooted ? 'Root 权限已获取' : 'Root 权限未获取'}
                </Animated.Text>
                <Animated.Text style={styles.rootStatusDesc}>
                  {isRooted
                    ? `${managerInfo?.managerType || 'Unknown'} ${managerInfo?.version || ''}`
                    : '需要 Root 权限才能使用全部功能'}
                </Animated.Text>
              </View>
            </View>

            {isRooted && (
              <View style={styles.rootDetails}>
                <View style={styles.rootDetailItem}>
                  <Ionicons name="hardware-chip-outline" size={16} color={Colors.textSecondary} />
                  <Animated.Text style={styles.rootDetailText}>
                    管理器：{managerInfo?.managerType || 'Unknown'}
                  </Animated.Text>
                </View>
                <View style={styles.rootDetailItem}>
                  <Ionicons name="information-circle-outline" size={16} color={Colors.textSecondary} />
                  <Animated.Text style={styles.rootDetailText}>
                    版本：{managerInfo?.version || 'Unknown'}
                  </Animated.Text>
                </View>
              </View>
            )}
          </GlassCard>
        </Animated.View>

        {/* 设备基本信息 */}
        <Animated.View entering={FadeInDown.delay(250).duration(400)} style={styles.section}>
          <Animated.Text style={styles.sectionTitle}>设备信息</Animated.Text>
          <GlassCard padding={0}>
            <InfoRow
              label="机型"
              value={`${deviceInfo?.brand || '-'} ${deviceInfo?.model || '-'}`}
              icon="phone-portrait-outline"
              isLast={false}
              showCopy
              onCopy={handleCopy}
            />
            <InfoRow
              label="Android 版本"
              value={`${deviceInfo?.androidVersion || '-'} (SDK ${deviceInfo?.sdkVersion || '-'})`}
              icon="logo-android"
              isLast={false}
              showCopy
              onCopy={handleCopy}
            />
            <InfoRow
              label="内核版本"
              value={deviceInfo?.kernelVersion || '-'}
              icon="terminal-outline"
              isLast={false}
              showCopy
              onCopy={handleCopy}
            />
            <InfoRow
              label="SELinux"
              value={deviceInfo?.selinuxStatus || '-'}
              iconColor={selinuxInfo.color}
              icon="shield-outline"
              isLast={false}
            />
            <InfoRow
              label="安全补丁"
              value={deviceInfo?.securityPatch || '-'}
              icon="calendar-outline"
              isLast={false}
              showCopy
              onCopy={handleCopy}
            />
            <InfoRow
              label="构建号"
              value={deviceInfo?.display || '-'}
              icon="construct-outline"
              isLast
              showCopy
              onCopy={handleCopy}
            />
          </GlassCard>
        </Animated.View>

        {/* 系统详情 */}
        <Animated.View entering={FadeInDown.delay(350).duration(400)} style={styles.section}>
          <Animated.Text style={styles.sectionTitle}>系统详情</Animated.Text>
          <GlassCard padding={0}>
            <InfoRow
              label="制造商"
              value={deviceInfo?.manufacturer || '-'}
              icon="business-outline"
              isLast={false}
              showCopy
              onCopy={handleCopy}
            />
            <InfoRow
              label="设备代号"
              value={deviceInfo?.device || '-'}
              icon="code-outline"
              isLast={false}
              showCopy
              onCopy={handleCopy}
            />
            <InfoRow
              label="硬件"
              value={deviceInfo?.hardware || '-'}
              icon="hardware-chip-outline"
              isLast={false}
              showCopy
              onCopy={handleCopy}
            />
            <InfoRow
              label="主板"
              value={deviceInfo?.board || '-'}
              icon="grid-outline"
              isLast={false}
              showCopy
              onCopy={handleCopy}
            />
            <InfoRow
              label="基带"
              value={deviceInfo?.baseband || '-'}
              icon="signal-outline"
              isLast={false}
              showCopy
              onCopy={handleCopy}
            />
            <InfoRow
              label="Bootloader"
              value={deviceInfo?.bootloader || '-'}
              icon="lock-closed-outline"
              isLast={false}
              showCopy
              onCopy={handleCopy}
            />
            <InfoRow
              label="构建类型"
              value={deviceInfo?.buildType || '-'}
              icon="hammer-outline"
              isLast={false}
              showCopy
              onCopy={handleCopy}
            />
            <InfoRow
              label="构建标签"
              value={deviceInfo?.buildTags || '-'}
              icon="pricetag-outline"
              isLast={false}
              showCopy
              onCopy={handleCopy}
            />
            <InfoRow
              label="构建时间"
              value={deviceInfo?.buildTime || '-'}
              icon="time-outline"
              isLast
              showCopy
              onCopy={handleCopy}
            />
          </GlassCard>
        </Animated.View>

        {/* 指纹信息 */}
        <Animated.View entering={FadeInDown.delay(450).duration(400)} style={styles.section}>
          <Animated.Text style={styles.sectionTitle}>指纹信息</Animated.Text>
          <GlassCard>
            <Animated.Text style={styles.fingerprintText} numberOfLines={4}>
              {deviceInfo?.fingerprint || '-'}
            </Animated.Text>
          </GlassCard>
        </Animated.View>

        {/* CPU 信息 */}
        <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.section}>
          <Animated.Text style={styles.sectionTitle}>CPU 信息</Animated.Text>
          <GlassCard>
            <Animated.Text style={styles.monospaceText}>
              {deviceInfo?.cpuInfo || '-'}
            </Animated.Text>
          </GlassCard>
        </Animated.View>

        {/* 内存信息 */}
        <Animated.View entering={FadeInDown.delay(550).duration(400)} style={styles.section}>
          <Animated.Text style={styles.sectionTitle}>内存信息</Animated.Text>
          <GlassCard>
            <Animated.Text style={styles.monospaceText}>
              {deviceInfo?.memInfo || '-'}
            </Animated.Text>
          </GlassCard>
        </Animated.View>

        {/* 底部留白 */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* 底部 Tab 栏 */}
      <BottomTabBar activeTab="home" onTabChange={() => {}} />
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
  headerBlur: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: Colors.glass.border,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    backgroundColor: Colors.glass.background,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerText: {
    gap: 2,
  },
  appName: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  appVersion: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
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
  rootStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  rootStatusText: {
    flex: 1,
    gap: 2,
  },
  rootStatusTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  rootStatusDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  rootDetails: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 0.5,
    borderTopColor: Colors.separator,
    gap: Spacing.sm,
  },
  rootDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  rootDetailText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  fingerprintText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
    lineHeight: 20,
  },
  monospaceText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  bottomSpacer: {
    height: 120,
  },
});
