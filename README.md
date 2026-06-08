# Ace Kernel Manager

一款类似 KernelSU 的 Root 权限管理工具，采用 MIUIx/HyperOS 3.0 设计语言。

## 功能特性

- 📱 设备信息面板：机型、内核版本、SELinux、指纹等
- 🔐 Root 权限检测与适配：兼容 Magisk/KernelSU/APatch
- 👤 超级用户授权管理
- 📦 Magisk 模块管理
- 💾 分区刷写工具（支持 A/B 分区）
- 🎨 MIUIx 液态玻璃设计风格

## 技术栈

- Expo + React Native
- Kotlin 原生模块
- GitHub Actions CI/CD

## 开发

```bash
npm install
npx expo prebuild --clean
npx expo run:android
```

## 构建 APK

```bash
cd android && ./gradlew assembleRelease
```

## 包信息

- 包名：`com.kerneluser.ace`
- 版本：`1.0.00`
- 版本号：`10000`
- 适配：Android 7.0 - Android 16
