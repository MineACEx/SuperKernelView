package com.kerneluser.ace

import android.util.Log
import com.facebook.react.bridge.*
import java.io.BufferedReader
import java.io.File
import java.io.InputStreamReader

/**
 * Root 权限管理原生模块
 * 检测 Root 状态，执行 su 命令，兼容 Magisk/KernelSU/APatch
 */
class AceRootModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val TAG = "AceRootModule"

    override fun getName(): String = "AceRoot"

    /**
     * 检测设备是否已 Root
     * 依次检查 su 路径和执行权限
     */
    @ReactMethod
    fun checkRoot(promise: Promise) {
        try {
            val suPaths = arrayOf(
                "/system/bin/su",
                "/system/xbin/su",
                "/sbin/su",
                "/data/local/xbin/su",
                "/data/local/bin/su",
                "/su/bin/su",
                "/magisk/.core/bin/su",
                "/data/adb/ksu/bin/su",
                "/data/adb/ap/bin/su"
            )

            var hasRoot = false
            for (path in suPaths) {
                val file = File(path)
                if (file.exists() && file.canExecute()) {
                    hasRoot = true
                    break
                }
            }

            // 二次验证：尝试执行 su -c id
            if (!hasRoot) {
                hasRoot = executeSuCommand("id") != null
            }

            val rootType = detectRootManager()
            val result = Arguments.createMap()
            result.putBoolean("isRooted", hasRoot)
            result.putString("rootType", rootType)
            promise.resolve(result)
        } catch (e: Exception) {
            Log.e(TAG, "checkRoot error", e)
            promise.reject("ROOT_CHECK_ERROR", e.message)
        }
    }

    /**
     * 检测 Root 管理器类型
     */
    @ReactMethod
    fun getRootManagerInfo(promise: Promise) {
        try {
            val result = Arguments.createMap()
            result.putString("managerType", detectRootManager())
            result.putString("version", getManagerVersion())
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("ROOT_INFO_ERROR", e.message)
        }
    }

    /**
     * 执行 su 命令
     */
    @ReactMethod
    fun executeCommand(command: String, promise: Promise) {
        try {
            val output = executeSuCommand(command)
            if (output != null) {
                promise.resolve(output)
            } else {
                promise.reject("EXEC_ERROR", "无法获取 Root 权限执行命令")
            }
        } catch (e: Exception) {
            promise.reject("EXEC_ERROR", e.message)
        }
    }

    /**
     * 以 Root 权限执行命令并返回输出
     */
    private fun executeSuCommand(command: String): String? {
        return try {
            val process = Runtime.getRuntime().exec(arrayOf("su", "-c", command))
            val output = StringBuilder()
            val reader = BufferedReader(InputStreamReader(process.inputStream))
            var line: String?
            while (reader.readLine().also { line = it } != null) {
                output.append(line).append("\n")
            }
            reader.close()
            process.waitFor()
            val exitCode = process.exitValue()
            if (exitCode == 0) output.toString().trim() else null
        } catch (e: Exception) {
            Log.e(TAG, "executeSuCommand error: $command", e)
            null
        }
    }

    /**
     * 检测 Root 管理器类型
     */
    private fun detectRootManager(): String {
        return when {
            File("/data/adb/magisk").exists() || File("/sbin/.magisk").exists() -> "Magisk"
            File("/data/adb/ksu").exists() || File("/data/adb/ksu/bin/ksud").exists() -> "KernelSU"
            File("/data/adb/ap").exists() -> "APatch"
            File("/system/app/Superuser").exists() -> "Superuser"
            else -> "Unknown"
        }
    }

    /**
     * 获取管理器版本
     */
    private fun getManagerVersion(): String {
        return try {
            when (detectRootManager()) {
                "Magisk" -> {
                    val output = executeSuCommand("magisk -v")
                    output ?: "Unknown"
                }
                "KernelSU" -> {
                    val output = executeSuCommand("ksud -V")
                    output ?: "Unknown"
                }
                "APatch" -> {
                    val output = executeSuCommand("apd -v")
                    output ?: "Unknown"
                }
                else -> "Unknown"
            }
        } catch (e: Exception) {
            "Unknown"
        }
    }
}
