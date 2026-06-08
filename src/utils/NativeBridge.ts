/**
 * Ace Kernel Manager - 原生模块桥接
 * 统一封装所有 Kotlin 原生模块调用
 */
import { NativeModules, Platform } from 'react-native';
import type {
  DeviceInfo,
  RootStatus,
  RootManagerInfo,
  ModuleInfo,
  SuperuserEntry,
  ABPartitionStatus,
  PartitionDetail,
} from '../types';

const LINKING_ERROR =
  `The package 'ace-kernel-manager' didn't seem to be linked properly. ` +
  `Please check the native module configuration.`;

/**
 * Root 权限模块
 */
const AceRoot = NativeModules.AceRoot
  ? NativeModules.AceRoot
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

/**
 * 设备信息模块
 */
const AceDeviceInfo = NativeModules.AceDeviceInfo
  ? NativeModules.AceDeviceInfo
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

/**
 * 分区管理模块
 */
const AcePartition = NativeModules.AcePartition
  ? NativeModules.AcePartition
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

/**
 * 模块管理模块
 */
const AceModuleManager = NativeModules.AceModuleManager
  ? NativeModules.AceModuleManager
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

/**
 * 超级用户模块
 */
const AceSuperuser = NativeModules.AceSuperuser
  ? NativeModules.AceSuperuser
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

// ============ Root 权限 ============

export async function checkRoot(): Promise<RootStatus> {
  return AceRoot.checkRoot();
}

export async function getRootManagerInfo(): Promise<RootManagerInfo> {
  return AceRoot.getRootManagerInfo();
}

export async function executeCommand(command: string): Promise<string> {
  return AceRoot.executeCommand(command);
}

// ============ 设备信息 ============

export async function getDeviceInfo(): Promise<DeviceInfo> {
  return AceDeviceInfo.getDeviceInfo();
}

export async function getMountPoints(): Promise<string> {
  return AceDeviceInfo.getMountPoints();
}

export async function getRunningServices(): Promise<string> {
  return AceDeviceInfo.getRunningServices();
}

export async function getNetworkStats(): Promise<string> {
  return AceDeviceInfo.getNetworkStats();
}

// ============ 分区管理 ============

export async function getPartitionList(): Promise<string> {
  return AcePartition.getPartitionList();
}

export async function getABPartitionStatus(): Promise<ABPartitionStatus> {
  return AcePartition.getABPartitionStatus();
}

export async function getPartitionDetails(partitionName: string): Promise<PartitionDetail> {
  return AcePartition.getPartitionDetails(partitionName);
}

export async function flashPartition(partitionName: string, imagePath: string): Promise<string> {
  return AcePartition.flashPartition(partitionName, imagePath);
}

export async function backupPartition(partitionName: string, outputPath: string): Promise<string> {
  return AcePartition.backupPartition(partitionName, outputPath);
}

// ============ 模块管理 ============

export async function getModuleList(): Promise<ModuleInfo[]> {
  return AceModuleManager.getModuleList();
}

export async function enableModule(moduleId: string): Promise<string> {
  return AceModuleManager.enableModule(moduleId);
}

export async function disableModule(moduleId: string): Promise<string> {
  return AceModuleManager.disableModule(moduleId);
}

export async function removeModule(moduleId: string): Promise<string> {
  return AceModuleManager.removeModule(moduleId);
}

export async function forceDeleteModule(moduleId: string): Promise<string> {
  return AceModuleManager.forceDeleteModule(moduleId);
}

// ============ 超级用户 ============

export async function getSuperuserList(): Promise<SuperuserEntry[]> {
  return AceSuperuser.getSuperuserList();
}

export async function revokeAppPermission(packageName: string): Promise<string> {
  return AceSuperuser.revokeAppPermission(packageName);
}

export async function grantAppPermission(packageName: string): Promise<string> {
  return AceSuperuser.grantAppPermission(packageName);
}
