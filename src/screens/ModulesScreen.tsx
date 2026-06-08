/**
 * Ace Kernel Manager - 模块管理页面
 * Magisk 模块列表、启用/禁用/卸载
 */
import React, { useCallback, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  RefreshControl,
  Switch,
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
import { useRootStatus, useModuleList } from '../hooks';
import { enableModule, disableModule, removeModule, forceDeleteModule } from '../utils/NativeBridge';
import { Colors, Spacing, FontSize, Radius } from '../constants';
import Animated, {
  FadeIn,
  FadeInDown,
  Layout,
} from 'react-native-reanimated';
import type { ModuleInfo } from '../types';

export function ModulesScreen() {
  const { rootStatus } = useRootStatus();
  const isRooted = rootStatus?.isRooted ?? false;
  const { modules, loading, refresh } = useModuleList(isRooted);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleToggle = useCallback(async (module: ModuleInfo) => {
    setActionLoading(module.id);
    try {
      if (module.enabled) {
        await disableModule(module.id);
      } else {
        await enableModule(module.id);
      }
      await refresh();
    } catch (e: any) {
      Alert.alert('操作失败', e.message);
    } finally {
      setActionLoading(null);
    }
  }, [refresh]);

  const handleRemove = useCallback((module: ModuleInfo) => {
    Alert.alert(
      '卸载模块',
      `确定要卸载 "${module.name}" 吗？\n重启后生效。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '卸载',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(module.id);
            try {
              await removeModule(module.id);
              Alert.alert('成功', '模块已标记删除，重启后生效');
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

  const handleForceDelete = useCallback((module: ModuleInfo) => {
    Alert.alert(
      '强制删除',
      `确定要强制删除 "${module.name}" 吗？\n此操作不可恢复！`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '强制删除',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(module.id);
            try {
              await forceDeleteModule(module.id);
              Alert.alert('成功', '模块已强制删除');
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
          <Animated.Text style={styles.pageTitle}>模块管理</Animated.Text>
          <Animated.Text style={styles.pageDesc}>
            {isRooted ? `已安装 ${modules.length} 个模块` : '需要 Root 权限'}
          </Animated.Text>
        </Animated.View>

        {!isRooted ? (
          <EmptyState
            icon="lock-closed-outline"
            title="需要 Root 权限"
            description="请先获取 Root 权限后再使用模块管理功能"
          />
        ) : modules.length === 0 ? (
          <EmptyState
            icon="cube-outline"
            title="暂无模块"
            description="没有检测到已安装的 Magisk 模块"
          />
        ) : (
          <Animated.View style={styles.moduleList} layout={Layout}>
            {modules.map((module, index) => (
              <ModuleCard
                key={module.id}
                module={module}
                index={index}
                actionLoading={actionLoading === module.id}
                onToggle={() => handleToggle(module)}
                onRemove={() => handleRemove(module)}
                onForceDelete={() => handleForceDelete(module)}
              />
            ))}
          </Animated.View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <BottomTabBar activeTab="modules" onTabChange={() => {}} />
    </SafeAreaView>
  );
}

interface ModuleCardProps {
  module: ModuleInfo;
  index: number;
  actionLoading: boolean;
  onToggle: () => void;
  onRemove: () => void;
  onForceDelete: () => void;
}

function ModuleCard({ module, index, actionLoading, onToggle, onRemove, onForceDelete }: ModuleCardProps) {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 60).duration(350)}
      layout={Layout}
      style={styles.moduleCard}
    >
      <GlassCard variant="elevated">
        <View style={styles.moduleHeader}>
          <View style={styles.moduleInfo}>
            <View style={styles.moduleIconContainer}>
              <Ionicons name="cube" size={20} color={Colors.primary} />
            </View>
            <View style={styles.moduleText}>
              <Animated.Text style={styles.moduleName}>{module.name}</Animated.Text>
              <Animated.Text style={styles.moduleVersion}>
                v{module.version} ({module.versionCode})
              </Animated.Text>
            </View>
          </View>
          <View style={styles.moduleActions}>
            <StatusBadge
              label={module.enabled ? '已启用' : '已禁用'}
              color={module.enabled ? Colors.success : Colors.textTertiary}
              variant="glass"
            />
            <Switch
              value={module.enabled}
              onValueChange={onToggle}
              disabled={actionLoading}
              trackColor={{ false: Colors.separatorOpaque, true: Colors.success }}
            />
          </View>
        </View>

        {module.author ? (
          <View style={styles.moduleMeta}>
            <Ionicons name="person-outline" size={14} color={Colors.textTertiary} />
            <Animated.Text style={styles.moduleMetaText}>{module.author}</Animated.Text>
          </View>
        ) : null}

        {module.description ? (
          <Animated.Text style={styles.moduleDesc} numberOfLines={3}>
            {module.description}
          </Animated.Text>
        ) : null}

        {module.remove && (
          <View style={styles.removeNotice}>
            <Ionicons name="trash-outline" size={14} color={Colors.warning} />
            <Animated.Text style={styles.removeNoticeText}>
              已标记删除，重启后生效
            </Animated.Text>
          </View>
        )}

        <View style={styles.moduleButtons}>
          <GlassButton
            title="卸载"
            variant="danger"
            size="sm"
            onPress={onRemove}
            loading={actionLoading}
          />
          <GlassButton
            title="强制删除"
            variant="secondary"
            size="sm"
            onPress={onForceDelete}
            loading={actionLoading}
          />
        </View>
      </GlassCard>
    </Animated.View>
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
  moduleList: {
    marginHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  moduleCard: {
    width: '100%',
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  moduleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.md,
  },
  moduleIconContainer: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: `${Colors.primary}12`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleText: {
    flex: 1,
    gap: 2,
  },
  moduleName: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  moduleVersion: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  moduleActions: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  moduleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  moduleMetaText: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  moduleDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    lineHeight: 20,
  },
  removeNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: `${Colors.warning}10`,
    borderRadius: Radius.sm,
  },
  removeNoticeText: {
    fontSize: FontSize.xs,
    color: Colors.warning,
    fontWeight: '500',
  },
  moduleButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  bottomSpacer: {
    height: 120,
  },
});
