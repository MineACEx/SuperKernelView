const { withMainApplication } = require('@expo/config-plugins');

/**
 * Ace Kernel Manager Expo Config Plugin
 * 仅注入 MainApplication 注册代码，原生文件复制在 CI 中手动完成
 */
function withAceKernelManager(config) {
  config = withMainApplication(config, (config) => {
    let contents = config.modResults.contents;

    // 添加 import
    if (!contents.includes('import com.kerneluser.ace.AceKernelManagerPackage')) {
      const lastImportMatch = contents.match(/import .+\n(?!import)/);
      if (lastImportMatch) {
        const insertPos = lastImportMatch.index + lastImportMatch[0].length;
        contents = contents.slice(0, insertPos) +
          'import com.kerneluser.ace.AceKernelManagerPackage\n' +
          contents.slice(insertPos);
      }
    }

    // 添加 packages.add(new AceKernelManagerPackage())
    if (!contents.includes('AceKernelManagerPackage')) {
      const addMatch = contents.match(/packages\.add\(new\s+\w+ReactPackage\(\)\)/);
      if (addMatch) {
        const insertPos = addMatch.index + addMatch[0].length;
        contents = contents.slice(0, insertPos) +
          '\n            packages.add(new AceKernelManagerPackage())' +
          contents.slice(insertPos);
      } else {
        const returnMatch = contents.match(/return\s+packages/);
        if (returnMatch) {
          const insertPos = returnMatch.index;
          contents = contents.slice(0, insertPos) +
            '            packages.add(new AceKernelManagerPackage())\n' +
            '            ' +
            contents.slice(insertPos);
        }
      }
    }

    config.modResults.contents = contents;
    return config;
  });

  return config;
}

module.exports = withAceKernelManager;
