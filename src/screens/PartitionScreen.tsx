/**
 * Ace Kernel Manager - 分区刷写页面
 * 分区列表、A/B 状态、刷写/备份
 */
import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  RefreshControl,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import {
  GlassCard,
  GlassButton,
  StatusBadge,
  EmptyState,
  LoadingScreen,
} from '../components';
import { BottomTabBar } from '../navigation';
import { useRootStatus, usePartitionInfo } from '../hooks';
import { flashPartition, backupPartition } from '../utils/NativeBridge';
import { Colors, Spacing, FontSize, Radius } from '../constants';
import Animated, {
  FadeIn,
  FadeInDown,
  Layout,
} from 'react-native-reanimated';

export function PartitionScreen() {
  const { rootStatus } = useRootStatus();
  const isRooted = rootStatus?.isRooted ?? false;
  const { abStatus, partitionList, loading, refresh } = usePartitionInfo(isRooted);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPartition, setSelectedPartition] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [flashLoading, setFlashLoading] = useState(false);
  const [backupLoading, setBackupLoading] = useState<string | null>(null);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  // 解析分区列表
  const partitions = React.useMemo(() => {
    if (!partitionList) return [];
    return partitionList
      .split('\n')
      .filter((line) => line.trim().length > 0)
      .map((line) => {
        const parts = line.trim().split(/\s+/);
        const name = parts[parts.length - 1]?.replace('/dev/block/by-name/', '') || '';
        const target = parts[parts.length - 3] || '';
        return { name, target, raw: line.trim() };
      })
      .filter((p) => p.name.length > 0);
  }, [partitionList]);

  const handlePickImage = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      setSelectedImage(result.assets[0].uri);
    } catch (e: any) {
      Alert.alert('选择失败', e.message);
    }
  }, []);

  const handleFlash = useCallback(async () => {
    if (!selectedPartition) {
      Alert.alert('提示', '请选择要刷写的分区');
      return;
    }
    if (!selectedImage) {
      Alert.alert('提示', '请选择镜像文件');
      return;
    }

    Alert.alert(
      '⚠️ 危险操作',
      `即将刷写分区: ${selectedPartition}\n镜像: ${selectedImage}\n\n此操作可能导致设备变砖！`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确认刷写',
          style: 'destructive',
          onPress: async () => {
            setFlashLoading(true);
            try {
              // DocumentPicker 返回的 URI 需要转换为文件路径
              const filePath = selectedImage.replace('file://', '');
              const result = await flashPartition(selectedPartition, filePath);
              Alert.alert('成功', result);
            } catch (e: any) {
              Alert.alert('刷写失败', e.message);
            } finally {
              setFlashLoading(false);
            }
          },
        },
      ]
    );
  }, [selectedPartition, selectedImage]);

  const handleBackup = useCallback((partitionName: string) => {
    Alert.alert(
      '备份分区',
      `备份分区 ${partitionName}？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '备份',
          onPress: async () => {
            setBackupLoading(partitionName);
            try {
              const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
              const outputPath = `/sdcard/Download/${partitionName}_backup_${timestamp}.img`;
              const result = await backupPartition(partitionName, outputPath);
              Alert.alert('成功', result);
            } catch (e: any) {
              Alert.alert('备份失败', e.message);
            } finally {
              setBackupLoading(null);
            }
          },
        },
      ]
    );
  }, []);

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
          <Animated.Text style={styles.pageTitle}>分区管理</Animated.Text>
          <Animated.Text style={styles.pageDesc}>
            {isRooted ? '刷写和备份设备分区' : '需要 Root 权限'}
          </Animated.Text>
        </Animated.View>

        {!isRooted ? (
          <EmptyState
            icon="lock-closed-outline"
            title="需要 Root 权限"
            description="请先获取 Root 权限后再使用分区管理功能"
          />
        ) : (
          <>
            {/* A/B 分区状态 */}
            {abStatus && (
              <Animated.View entering={FadeInDown.delay(100).duration(350)} style={styles.section}>
                <Animated.Text style={styles.sectionTitle}>A/B 分区状态</Animated.Text>
                <GlassCard variant="elevated">
                  <View style={styles.abHeader}>
                    <StatusBadge
                      label={abStatus.isABDevice ? 'A/B 设备' : '非 A/B 设备'}
                      color={abStatus.isABDevice ? Colors.info : Colors.textTertiary}
                      variant="glass"
                    />
                    {abStatus.isABDevice && (
                      <StatusBadge
                        label={`当前: Slot ${abStatus.currentSlot?.replace('_', '') || 'N/A'}`}
                        color={Colors.success}
                        variant="glass"
                      />
                    )}
                  </View>

                  {abStatus.isABDevice && (
                    <View style={styles.slotsContainer}>
                      <SlotCard
                        label="Slot A"
                        slot={abStatus.slotA}
                        isCurrent={abStatus.currentSlot === '_a'}
                      />
                      <SlotCard
                        label="Slot B"
                        slot={abStatus.slotB}
                        isCurrent={abStatus.currentSlot === '_b'}
                      />
                    </View>
                  )}

                  {/* Boot 分区信息 */}
                  {abStatus.bootPartition && (
                    <View style={styles.bootInfo}>
                      <Ionicons name="hardware-chip-outline" size={14} color={Colors.textSecondary} />
                      <Animated.Text style={styles.bootInfoText}>
                        Boot 分区: {abStatus.bootPartition.sizeHuman}
                      </Animated.Text>
                    </View>
                  )}
                </GlassCard>
              </Animated.View>
            )}

            {/* 刷写工具 */}
            <Animated.View entering={FadeInDown.delay(200).duration(350)} style={styles.section}>
              <Animated.Text style={styles.sectionTitle}>刷写分区</Animated.Text>
              <GlassCard variant="elevated">
                {/* 选择分区 */}
                <Animated.Text style={styles.label}>目标分区</Animated.Text>
                <BlurView intensity={40} tint="light" style={styles.inputBlur}>
                  <TextInput
                    style={styles.input}
                    placeholder="输入分区名 (如 boot)"
                    placeholderTextColor={Colors.textTertiary}
                    value={selectedPartition}
                    onChangeText={setSelectedPartition}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </BlurView>

                {/* 选择镜像 */}
                <Animated.Text style={[styles.label, { marginTop: Spacing.md }]}>镜像文件</Animated.Text>
                <GlassButton
                  title={selectedImage ? '已选择镜像' : '选择镜像文件'}
                  variant="secondary"
                  size="md"
                  fullWidth
                  onPress={handlePickImage}
                  icon={<Ionicons name="document-outline" size={18} color={Colors.primary} />}
                />
                {selectedImage ? (
                  <Animated.Text style={styles.imagePath} numberOfLines={2}>
                    {selectedImage}
                  </Animated.Text>
                ) : null}

                {/* 刷写按钮 */}
                <View style={styles.flashButtonContainer}>
                  <GlassButton
                    title="⚠️ 刷写分区"
                    variant="danger"
                    size="lg"
                    fullWidth
                    onPress={handleFlash}
                    loading={flashLoading}
                  />
                </View>

                <View style={styles.warningBox}>
                  <Ionicons name="warning" size={16} color={Colors.warning} />
                  <Animated.Text style={styles.warningText}>
                    刷写错误分区可能导致设备无法启动！请确保你了解操作后果。
                  </Animated.Text>
                </View>
              </GlassCard>
            </Animated.View>

            {/* 分区列表 */}
            {partitions.length > 0 && (
              <Animated.View entering={FadeInDown.delay(300).duration(350)} style={styles.section}>
                <Animated.Text style={styles.sectionTitle}>
                  分区列表 ({partitions.length})
                </Animated.Text>
                <Animated.View style={styles.partitionList} layout={Layout}>
                  {partitions.map((partition, index) => (
                    <Animated.View
                      key={partition.name}
                      entering={FadeInDown.delay(index * 30).duration(250)}
                      layout={Layout}
                      style={styles.partitionCard}
                    >
                      <GlassCard padding={Spacing.md}>
                        <View style={styles.partitionRow}>
                          <View style={styles.partitionInfo}>
                            <Ionicons name="save-outline" size={18} color={Colors.primary} />
                            <Animated.Text style={styles.partitionName}>
                              {partition.name}
                            </Animated.Text>
                          </View>
                          <GlassButton
                            title="备份"
                            variant="secondary"
                            size="sm"
                            onPress={() => handleBackup(partition.name)}
                            loading={backupLoading === partition.name}
                          />
                        </View>
                      </GlassCard>
                    </Animated.View>
                  ))}
                </Animated.View>
              </Animated.View>
            )}
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <BottomTabBar activeTab="partition" onTabChange={() => {}} />
    </SafeAreaView>
  );
}

interface SlotCardProps {
  label: string;
  slot: { suffix: string; bootSuccessful: boolean; unbootable: boolean };
  isCurrent: boolean;
}

function SlotCard({ label, slot, isCurrent }: SlotCardProps) {
  return (
    <View style={[styles.slotCard, isCurrent && styles.slotCardActive]}>
      <View style={styles.slotHeader}>
        <Animated.Text style={styles.slotLabel}>{label}</Animated.Text>
        {isCurrent && (
          <StatusBadge label="当前" color={Colors.success} variant="filled" size="sm" />
        )}
      </View>
      <View style={styles.slotDetails}>
        <View style={styles.slotDetailRow}>
          <Ionicons
            name={slot.bootSuccessful ? 'checkmark-circle' : 'close-circle'}
            size={14}
            color={slot.bootSuccessful ? Colors.success : Colors.error}
          />
          <Animated.Text style={styles.slotDetailText}>
            启动成功: {slot.bootSuccessful ? '是' : '否'}
          </Animated.Text>
        </View>
        <View style={styles.slotDetailRow}>
          <Ionicons
            name={slot.unbootable ? 'alert-circle' : 'checkmark-circle-outline'}
            size={14}
            color={slot.unbootable ? Colors.error : Colors.success}
          />
          <Animated.Text style={styles.slotDetailText}>
            可启动: {slot.unbootable ? '否' : '是'}
          </Animated.Text>
        </View>
      </View>
    </View>
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
  abHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  slotsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  slotCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 0.5,
    borderColor: Colors.separator,
  },
  slotCardActive: {
    backgroundColor: `${Colors.success}08`,
    borderColor: `${Colors.success}30`,
  },
  slotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  slotLabel: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  slotDetails: {
    gap: Spacing.xs,
  },
  slotDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  slotDetailText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  bootInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 0.5,
    borderTopColor: Colors.separator,
  },
  bootInfoText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  inputBlur: {
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
  imagePath: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: Spacing.sm,
    fontFamily: 'monospace',
  },
  flashButtonContainer: {
    marginTop: Spacing.xl,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: `${Colors.warning}08`,
    borderRadius: Radius.sm,
    borderWidth: 0.5,
    borderColor: `${Colors.warning}20`,
  },
  warningText: {
    flex: 1,
    fontSize: FontSize.xs,
    color: Colors.warning,
    lineHeight: 18,
    fontWeight: '500',
  },
  partitionList: {
    gap: Spacing.sm,
  },
  partitionCard: {
    width: '100%',
  },
  partitionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  partitionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  partitionName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
    fontFamily: 'monospace',
  },
  bottomSpacer: {
    height: 120,
  },
});
