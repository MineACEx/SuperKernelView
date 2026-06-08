/**
 * Ace Kernel Manager - 全局常量
 */

export const APP_NAME = 'Ace Kernel Manager';
export const APP_VERSION = '1.0.00';
export const APP_VERSION_CODE = 10000;
export const PACKAGE_NAME = 'com.kerneluser.ace';

/**
 * 颜色主题 - MIUIx/HyperOS 3.0 白色高对比度
 */
export const Colors = {
  // 主色
  primary: '#007AFF',
  primaryLight: '#4DA6FF',
  primaryDark: '#0055CC',

  // 背景
  background: '#F2F2F7',
  surface: '#FFFFFF',
  surfaceSecondary: '#F9F9FB',
  surfaceElevated: '#FFFFFF',

  // 文字
  textPrimary: '#1C1C1E',
  textSecondary: '#8E8E93',
  textTertiary: '#AEAEB2',
  textWhite: '#FFFFFF',

  // 状态
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  info: '#007AFF',

  // 分隔线
  separator: 'rgba(60, 60, 67, 0.08)',
  separatorOpaque: '#C6C6C8',

  // 液态玻璃效果
  glass: {
    background: 'rgba(255, 255, 255, 0.72)',
    border: 'rgba(255, 255, 255, 0.5)',
    shadow: 'rgba(0, 0, 0, 0.08)',
    blur: 40,
    tint: 'rgba(255, 255, 255, 0.18)',
    chromatic: 'rgba(120, 120, 255, 0.08)',
  },

  // Tab 栏
  tabBar: {
    background: 'rgba(255, 255, 255, 0.78)',
    active: '#007AFF',
    inactive: '#8E8E93',
    border: 'rgba(255, 255, 255, 0.4)',
  },
};

/**
 * 圆角 - 统一大圆角 iOS 26 风格
 */
export const Radius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 28,
  full: 999,
  card: 20,
  button: 14,
  input: 12,
  modal: 24,
  tabBar: 24,
};

/**
 * 间距
 */
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

/**
 * 动效时长
 */
export const Animation = {
  fast: 150,
  normal: 250,
  slow: 400,
  spring: { damping: 20, stiffness: 180, mass: 0.8 },
  springBouncy: { damping: 12, stiffness: 200, mass: 0.6 },
};

/**
 * 字体大小
 */
export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  title: 34,
};

/**
 * Root 管理器类型
 */
export const RootManagers = {
  MAGISK: 'Magisk',
  KERNELSU: 'KernelSU',
  APATCH: 'APatch',
  SUPERUSER: 'Superuser',
  UNKNOWN: 'Unknown',
} as const;

/**
 * SELinux 状态映射
 */
export const SELinuxLabels: Record<string, { label: string; color: string }> = {
  Enforcing: { label: 'Enforcing', color: Colors.success },
  Permissive: { label: 'Permissive', color: Colors.warning },
  Disabled: { label: 'Disabled', color: Colors.error },
  Unknown: { label: 'Unknown', color: Colors.textSecondary },
};
