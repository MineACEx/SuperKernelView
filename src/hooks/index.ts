/**
 * Ace Kernel Manager - 自定义 Hooks
 */
import { useState, useEffect, useCallback } from 'react';
import {
  checkRoot,
  getRootManagerInfo,
  getDeviceInfo,
  getModuleList,
  getSuperuserList,
  getABPartitionStatus,
  getPartitionList,
  getMountPoints,
  getRunningServices,
  getNetworkStats,
} from '../utils/NativeBridge';
import type {
  RootStatus,
  RootManagerInfo,
  DeviceInfo,
  ModuleInfo,
  SuperuserEntry,
  ABPartitionStatus,
} from '../types';

/**
 * Root 状态 Hook
 */
export function useRootStatus() {
  const [rootStatus, setRootStatus] = useState<RootStatus | null>(null);
  const [managerInfo, setManagerInfo] = useState<RootManagerInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const [root, manager] = await Promise.all([
        checkRoot(),
        getRootManagerInfo(),
      ]);
      setRootStatus(root);
      setManagerInfo(manager);
    } catch (error) {
      console.error('Root check failed:', error);
      setRootStatus({ isRooted: false, rootType: 'Unknown' });
      setManagerInfo({ managerType: 'Unknown', version: 'Unknown' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { rootStatus, managerInfo, loading, refresh };
}

/**
 * 设备信息 Hook
 */
export function useDeviceInfo() {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const info = await getDeviceInfo();
      setDeviceInfo(info);
    } catch (error) {
      console.error('Device info fetch failed:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { deviceInfo, loading, refresh };
}

/**
 * 模块列表 Hook
 */
export function useModuleList(isRooted: boolean) {
  const [modules, setModules] = useState<ModuleInfo[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isRooted) {
      setModules([]);
      return;
    }
    try {
      setLoading(true);
      const list = await getModuleList();
      setModules(list || []);
    } catch (error) {
      console.error('Module list fetch failed:', error);
      setModules([]);
    } finally {
      setLoading(false);
    }
  }, [isRooted]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { modules, loading, refresh };
}

/**
 * 超级用户列表 Hook
 */
export function useSuperuserList(isRooted: boolean) {
  const [superusers, setSuperusers] = useState<SuperuserEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isRooted) {
      setSuperusers([]);
      return;
    }
    try {
      setLoading(true);
      const list = await getSuperuserList();
      setSuperusers(list || []);
    } catch (error) {
      console.error('Superuser list fetch failed:', error);
      setSuperusers([]);
    } finally {
      setLoading(false);
    }
  }, [isRooted]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { superusers, loading, refresh };
}

/**
 * 分区信息 Hook
 */
export function usePartitionInfo(isRooted: boolean) {
  const [abStatus, setAbStatus] = useState<ABPartitionStatus | null>(null);
  const [partitionList, setPartitionList] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isRooted) {
      setAbStatus(null);
      setPartitionList('');
      return;
    }
    try {
      setLoading(true);
      const [ab, list] = await Promise.all([
        getABPartitionStatus(),
        getPartitionList(),
      ]);
      setAbStatus(ab);
      setPartitionList(list);
    } catch (error) {
      console.error('Partition info fetch failed:', error);
    } finally {
      setLoading(false);
    }
  }, [isRooted]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { abStatus, partitionList, loading, refresh };
}

/**
 * 系统详情 Hook
 */
export function useSystemDetails(isRooted: boolean) {
  const [mountPoints, setMountPoints] = useState<string>('');
  const [services, setServices] = useState<string>('');
  const [networkStats, setNetworkStats] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const [mounts, svcs, net] = await Promise.all([
        getMountPoints(),
        getRunningServices(),
        getNetworkStats(),
      ]);
      setMountPoints(mounts);
      setServices(svcs);
      setNetworkStats(net);
    } catch (error) {
      console.error('System details fetch failed:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { mountPoints, services, networkStats, loading, refresh };
}
