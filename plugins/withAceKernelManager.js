const { withAppBuildGradle, withMainApplication, withAndroidManifest } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Ace Kernel Manager Expo Config Plugin
 * 自动注入原生模块注册代码到 MainApplication
 */
function withAceKernelManager(config) {
  // 修改 app/build.gradle 添加 Kotlin 支持
  config = withAppBuildGradle(config, (config) => {
    const buildGradle = config.modResults.contents;

    // 确保 Kotlin 插件存在
    if (!buildGradle.includes("org.jetbrains.kotlin.android")) {
      config.modResults.contents = buildGradle.replace(
        /dependencies\s*\{/,
        `dependencies {
        implementation "org.jetbrains.kotlin:kotlin-stdlib:1.9.25"`
      );
    }

    return config;
  });

  // 修改 MainApplication 注册原生模块
  config = withMainApplication(config, (config) => {
    let contents = config.modResults.contents;

    // 添加 import
    if (!contents.includes('import com.kerneluser.ace.AceKernelManagerPackage')) {
      contents = contents.replace(
        'import com.facebook.react.ReactPackage;',
        `import com.facebook.react.ReactPackage;
import com.kerneluser.ace.AceKernelManagerPackage;`
      );
    }

    // 添加包到 getPackages 列表
    if (!contents.includes('AceKernelManagerPackage')) {
      contents = contents.replace(
        /packages\.add\(new MainApplicationReactPackage\(\)\);/,
        `packages.add(new MainApplicationReactPackage());
            packages.add(new AceKernelManagerPackage());`
      );
    }

    config.modResults.contents = contents;
    return config;
  });

  // 添加 AndroidManifest 权限
  config = withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    // 确保有 INTERNET 权限
    const permissions = manifest.manifest.$['android:sharedUserId']
      ? manifest.manifest
      : manifest.manifest;

    return config;
  });

  return config;
}

module.exports = withAceKernelManager;
