/**
 * Ace Kernel Manager - 超级用户授权管理页面
 */
import React, { useCallback, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  RefreshControl,
  TextInput,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import {
  GlassCard,
  GlassButton,
  StatusBadge,
  EmptyState,
  LoadingScreen,
} from '../components';
import { BottomTabBar } from '../navigation';
import { useRootStatus, useSuperuserList } from '../hooks';
import { revokeAppPermission, grantAppPermission } from '../utils/NativeBridge';
import { Colors, Spacing, FontSize, Radius } from '../constants';
import Animated, {
  FadeIn,
  FadeInDown,
  Layout,
} from 'react-native-reanimated';
import type { SuperuserEntry } from '../types';

export function SuperuserScreen() {
  const { rootStatus } = useRootStatus();
  const isRooted = rootStatus?.isRooted ?? false;
  const { superusers, loading, refresh } = useSuperuserList(isRooted);
  const [refreshing, setRefreshing] = useState(false);
  const [grantInput, setGrantInput] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleRevoke = useCallback((entry: SuperuserEntry) => {
    Alert.alert(
      '撤销授权',
      `确定要撤销 "${entry.packageName}" 的 Root 权限吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '撤销',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(entry.packageName);
            try {
              await revokeAppPermission(entry.packageName);
              Alert.alert('成功', `已撤销 ${entry.packageName} 的 Root 权限`);
              await refresh();
            } catch (e: any) {
              Alert.alert('失败', e.message);
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  }, [refresh]);

  const handleGrant = useCallback(async () => {
    if (!grantInput.trim()) {
      Alert.alert('提示', '请输入包名');
      return;
    }
    setActionLoading('grant');
    try {
      await grantAppPermission(grantInput.trim());
      Alert.alert('成功', `已授予 ${grantInput.trim()} Root 权限`);
      setGrantInput('');
      await refresh();
    } catch (e: any) {
      Alert.alert('失败', e.message);
    } finally {
      setActionLoading(null);
    }
  }, [grantInput, refresh]);

  if (loading) return <LoadingScreen />;

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
        {/* 页面标题 */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <Animated.Text style={styles.pageTitle}>超级用户</Animated.Text>
          <Animated.Text style={styles.pageDesc}>
            {isRooted ? `已授权 ${superusers.length} 个应用` : '需要 Root 权限'}
          </Animated.Text>
        </Animated.View>

        {/* 授权新应用 */}
        {isRooted && (
          <Animated.View entering={FadeInDown.delay(100).duration(350)} style={styles.section}>
            <GlassCard variant="elevated">
              <Animated.Text style={styles.cardTitle}>授权新应用</Animated.Text>
              <View style={styles.grantRow}>
                <BlurView intensity={40} tint="light" style={styles.inputBlur}>
                  <TextInput
                    style={styles.input}
                    placeholder="输入包名 (如 com.example.app)"
                    placeholderTextColor={Colors.textTertiary}
                    value={grantInput}
                    onChangeText={setGrantInput}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </BlurView>
                <GlassButton
                  title="授权"
                  variant="primary"
                  size="md"
                  onPress={handleGrant}
                  loading={actionLoading === 'grant'}
                />
              </View>
            </GlassCard>
          </Animated.View>
        )}

        {/* 授权列表 */}
        {!isRooted ? (
          <EmptyState
            icon="lock-closed-outline"
            title="需要 Root 权限"
            description="请先获取 Root 权限后再使用超级用户管理功能"
          />
        ) : superusers.length === 0 ? (
          <EmptyState
            icon="shield-outline"
            title="暂无授权"
            description="没有检测到已授权 Root 权限的应用"
          />
        ) : (
          <Animated.View style={styles.list} layout={Layout}>
            {superusers.map((entry, index) => (
              <Animated.View
                key={entry.packageName}
                entering={FadeInDown.delay(index * 50).duration(300)}
                layout={Layout}
                style={styles.entryCard}
              >
                <GlassCard variant="elevated">
                  <View style={styles.entryHeader}>
                    <View style={styles.entryIcon}>
                      <Ionicons name="apps" size={22} color={Colors.primary} />
                    </View>
                    <View style={styles.entryInfo}>
                      <Animated.Text style={styles.entryPackage}>
                        {entry.packageName}
                      </Animated.Text>
                      <View style={styles.entryMeta}>
                        <StatusBadge
                          label={entry.manager}
                          color={Colors.info}
                          variant="glass"
                          size="sm"
                        />
                        {entry.uid ? (
                          <Animated.Text style={styles.entryUid}>UID: {entry.uid}</Animated.Text>
                        ) : null}
                      </View>
                    </View>
                  </View>
                  <View style={styles.entryActions}>
                    <GlassButton
                      title="撤销授权"
                      variant="danger"
                      size="sm"
                      onPress={() => handleRevoke(entry)}
                      loading={actionLoading === entry.packageName}
                    />
                  </View>
                </GlassCard>
              </Animated.View>
            ))}
          </Animated.View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <BottomTabBar activeTab="superuser" onTabChange={() => {}} />
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
  cardTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  grantRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  inputBlur: {
    flex: 1,
    borderRadius: Radius.input,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: Colors.separator,
  },
  input: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    backgroundColor: Colors.glass.background,
  },
  list: {
    marginHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  entryCard: {
    width: '100%',
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  entryIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: `${Colors.primary}12`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryInfo: {
    flex: 1,
    gap: 4,
  },
  entryPackage: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  entryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  entryUid: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  entryActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 0.5,
    borderTopColor: Colors.separator,
  },
  bottomSpacer: {
    height: 120,
  },
});
