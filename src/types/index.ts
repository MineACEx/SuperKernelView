/**
 * Ace Kernel Manager - 类型定义
 */

export interface DeviceInfo {
  brand: string;
  manufacturer: string;
  model: string;
  device: string;
  hardware: string;
  product: string;
  board: string;
  fingerprint: string;
  display: string;
  androidVersion: string;
  sdkVersion: number;
  securityPatch: string;
  kernelVersion: string;
  selinuxStatus: string;
  cpuInfo: string;
  memInfo: string;
  buildType: string;
  buildUser: string;
  buildHost: string;
  serial: string;
  bootloader: string;
  baseband: string;
  buildTags: string;
  buildTime: string;
}

export interface RootStatus {
  isRooted: boolean;
  rootType: string;
}

export interface RootManagerInfo {
  managerType: string;
  version: string;
}

export interface ModuleInfo {
  id: string;
  name: string;
  version: string;
  versionCode: string;
  author: string;
  description: string;
  enabled: boolean;
  remove: boolean;
}

export interface SuperuserEntry {
  packageName: string;
  policy: number;
  logging: boolean;
  uid: string;
  manager: string;
  rawConfig?: string;
}

export interface ABPartitionStatus {
  isABDevice: boolean;
  currentSlot: string;
  slotA: SlotInfo;
  slotB: SlotInfo;
  bootPartition: PartitionDetail;
}

export interface SlotInfo {
  suffix: string;
  bootSuccessful: boolean;
  unbootable: boolean;
}

export interface PartitionDetail {
  name: string;
  info: string;
  sizeBytes: string;
  sizeHuman: string;
}

export type TabName = 'home' | 'modules' | 'superuser' | 'partition' | 'settings';

export interface InfoRow {
  label: string;
  value: string;
  icon?: string;
}
