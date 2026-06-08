package com.kerneluser.ace

import android.util.Log
import com.facebook.react.bridge.*
import java.io.BufferedReader
import java.io.File
import java.io.InputStreamReader

/**
 * 超级用户授权管理原生模块
 * 管理应用的 Root 授权列表
 */
class AceSuperuserModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val TAG = "AceSuperuser"

    override fun getName(): String = "AceSuperuser"

    /**
     * 获取超级用户授权列表
     * 兼容 Magisk / KernelSU / APatch 授权数据库
     */
    @ReactMethod
    fun getSuperuserList(promise: Promise) {
        try {
            val result = Arguments.createArray()
            val rootType = detectRootType()

            when (rootType) {
                "Magisk" -> {
                    // Magisk 授权数据库路径
                    val dbFiles = arrayOf(
                        "/data/adb/magisk.db",
                        "/data/data/com.topjohnwu.magisk/databases/magisk.db"
                    )
                    for (dbPath in dbFiles) {
                        val dbFile = File(dbPath)
                        if (dbFile.exists()) {
                            val entries = queryMagiskDB(dbPath)
                            entries?.let { entries ->
                                for (i in 0 until entries.size()) {
                                    result.pushMap(entries.getMap(i))
                                }
                            }
                            break
                        }
                    }
                }
                "KernelSU" -> {
                    // KernelSU 授权列表
                    val ksuEntries = queryKSUList()
                    for (entry in ksuEntries) {
                        result.pushMap(entry)
                    }
                }
                "APatch" -> {
                    // APatch 授权列表
                    val apEntries = queryAPatchList()
                    for (entry in apEntries) {
                        result.pushMap(entry)
                    }
                }
                else -> {
                    // 尝试通用方法：读取 /data/adb/ 下的授权信息
                    val genericEntries = queryGenericList()
                    for (entry in genericEntries) {
                        result.pushMap(entry)
                    }
                }
            }

            promise.resolve(result)
        } catch (e: Exception) {
            Log.e(TAG, "getSuperuserList error", e)
            promise.reject("SUPERUSER_LIST_ERROR", e.message)
        }
    }

    /**
     * 撤销应用 Root 授权
     */
    @ReactMethod
    fun revokeAppPermission(packageName: String, promise: Promise) {
        try {
            val rootType = detectRootType()
            var success = false

            when (rootType) {
                "Magisk" -> {
                    val process = Runtime.getRuntime().exec(arrayOf(
                        "su", "-c",
                        "sqlite3 /data/adb/magisk.db \"DELETE FROM policies WHERE package_name='$packageName';\""
                    ))
                    process.waitFor()
                    success = process.exitValue() == 0
                }
                "KernelSU" -> {
                    // KernelSU 通过 ksud 管理授权
                    val process = Runtime.getRuntime().exec(arrayOf(
                        "su", "-c",
                        "ksud profile get-uid $packageName"
                    ))
                    val reader = BufferedReader(InputStreamReader(process.inputStream))
                    val uid = reader.readLine()?.trim()
                    reader.close()
                    if (uid != null) {
                        val delProcess = Runtime.getRuntime().exec(arrayOf(
                            "su", "-c", "ksud profile deny $uid"
                        ))
                        delProcess.waitFor()
                        success = delProcess.exitValue() == 0
                    }
                }
                else -> {
                    promise.reject("REVOKE_ERROR", "不支持的 Root 管理器类型")
                    return
                }
            }

            if (success) {
                promise.resolve("已撤销 $packageName 的 Root 授权")
            } else {
                promise.reject("REVOKE_ERROR", "撤销授权失败")
            }
        } catch (e: Exception) {
            promise.reject("REVOKE_ERROR", e.message)
        }
    }

    /**
     * 授予应用 Root 权限
     */
    @ReactMethod
    fun grantAppPermission(packageName: String, promise: Promise) {
        try {
            val rootType = detectRootType()
            var success = false

            when (rootType) {
                "Magisk" -> {
                    val process = Runtime.getRuntime().exec(arrayOf(
                        "su", "-c",
                        "sqlite3 /data/adb/magisk.db \"INSERT OR REPLACE INTO policies (uid, package_name, policy, until, logging) VALUES ((SELECT uid FROM policies WHERE package_name='$packageName'), '$packageName', 2, 0, 1);\""
                    ))
                    process.waitFor()
                    success = process.exitValue() == 0
                }
                "KernelSU" -> {
                    val process = Runtime.getRuntime().exec(arrayOf(
                        "su", "-c",
                        "ksud profile allow $(ksud profile get-uid $packageName)"
                    ))
                    process.waitFor()
                    success = process.exitValue() == 0
                }
                else -> {
                    promise.reject("GRANT_ERROR", "不支持的 Root 管理器类型")
                    return
                }
            }

            if (success) {
                promise.resolve("已授予 $packageName Root 权限")
            } else {
                promise.reject("GRANT_ERROR", "授予权限失败")
            }
        } catch (e: Exception) {
            promise.reject("GRANT_ERROR", e.message)
        }
    }

    private fun detectRootType(): String {
        return when {
            File("/data/adb/magisk").exists() -> "Magisk"
            File("/data/adb/ksu").exists() -> "KernelSU"
            File("/data/adb/ap").exists() -> "APatch"
            else -> "Unknown"
        }
    }

    private fun queryMagiskDB(dbPath: String): WritableArray? {
        return try {
            val process = Runtime.getRuntime().exec(arrayOf(
                "su", "-c",
                "sqlite3 $dbPath \"SELECT package_name, policy, logging, uid FROM policies;\""
            ))
            val reader = BufferedReader(InputStreamReader(process.inputStream))
            val result = Arguments.createArray()
            var line: String?
            while (reader.readLine().also { line = it } != null) {
                val parts = line.split("|")
                if (parts.size >= 2) {
                    val entry = Arguments.createMap()
                    entry.putString("packageName", parts[0].trim())
                    entry.putInt("policy", parts.getOrNull(1)?.trim()?.toIntOrNull() ?: 0)
                    entry.putBoolean("logging", parts.getOrNull(2)?.trim() == "1")
                    entry.putString("uid", parts.getOrNull(3)?.trim() ?: "")
                    entry.putString("manager", "Magisk")
                    result.pushMap(entry)
                }
            }
            reader.close()
            result
        } catch (e: Exception) {
            Log.e(TAG, "queryMagiskDB error", e)
            null
        }
    }

    private fun queryKSUList(): List<WritableMap> {
        val result = mutableListOf<WritableMap>()
        try {
            // KernelSU 授权信息存储在 /data/adb/ksu/
            val profilesDir = File("/data/adb/ksu/profiles")
            if (profilesDir.exists()) {
                profilesDir.listFiles()?.forEach { file ->
                    val entry = Arguments.createMap()
                    entry.putString("packageName", file.nameWithoutExtension)
                    entry.putString("manager", "KernelSU")
                    // 读取配置文件内容
                    val content = file.readText()
                    entry.putString("rawConfig", content)
                    result.add(entry)
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "queryKSUList error", e)
        }
        return result
    }

    private fun queryAPatchList(): List<WritableMap> {
        val result = mutableListOf<WritableMap>()
        try {
            val profilesDir = File("/data/adb/ap/profiles")
            if (profilesDir.exists()) {
                profilesDir.listFiles()?.forEach { file ->
                    val entry = Arguments.createMap()
                    entry.putString("packageName", file.nameWithoutExtension)
                    entry.putString("manager", "APatch")
                    entry.putString("rawConfig", file.readText())
                    result.add(entry)
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "queryAPatchList error", e)
        }
        return result
    }

    private fun queryGenericList(): List<WritableMap> {
        val result = mutableListOf<WritableMap>()
        try {
            // 读取已安装应用列表，检查哪些有 su 权限
            val process = Runtime.getRuntime().exec(arrayOf(
                "su", "-c", "pm list packages"
            ))
            val reader = BufferedReader(InputStreamReader(process.inputStream))
            var line: String?
            while (reader.readLine().also { line = it } != null) {
                if (line.startsWith("package:")) {
                    val pkg = line.substringAfter("package:").trim()
                    val entry = Arguments.createMap()
                    entry.putString("packageName", pkg)
                    entry.putString("manager", "Unknown")
                    result.add(entry)
                }
            }
            reader.close()
        } catch (e: Exception) {
            Log.e(TAG, "queryGenericList error", e)
        }
        return result
    }
}
