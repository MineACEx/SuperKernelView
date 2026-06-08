package com.kerneluser.ace

import android.util.Log
import com.facebook.react.bridge.*
import java.io.BufferedReader
import java.io.File
import java.io.InputStreamReader

/**
 * Magisk 模块管理原生模块
 * 支持模块列表、安装、卸载、启用/禁用
 */
class AceModuleManagerModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val TAG = "AceModuleManager"

    override fun getName(): String = "AceModuleManager"

    /**
     * 获取已安装模块列表
     */
    @ReactMethod
    fun getModuleList(promise: Promise) {
        try {
            val modulesDir = File("/data/adb/modules")
            if (!modulesDir.exists()) {
                promise.resolve(Arguments.createArray())
                return
            }

            val modules = Arguments.createArray()
            val moduleDirs = modulesDir.listFiles { dir -> dir.isDirectory }

            moduleDirs?.forEach { moduleDir ->
                val moduleInfo = Arguments.createMap()
                moduleInfo.putString("id", moduleDir.name)

                // 读取 module.prop
                val propFile = File(moduleDir, "module.prop")
                if (propFile.exists()) {
                    val props = readProps(propFile)
                    moduleInfo.putString("name", props.getProperty("name", moduleDir.name))
                    moduleInfo.putString("version", props.getProperty("version", "Unknown"))
                    moduleInfo.putString("versionCode", props.getProperty("versionCode", "0"))
                    moduleInfo.putString("author", props.getProperty("author", "Unknown"))
                    moduleInfo.putString("description", props.getProperty("description", ""))
                } else {
                    moduleInfo.putString("name", moduleDir.name)
                    moduleInfo.putString("version", "Unknown")
                    moduleInfo.putString("versionCode", "0")
                    moduleInfo.putString("author", "Unknown")
                    moduleInfo.putString("description", "")
                }

                // 检查模块状态
                val disableFile = File(moduleDir, "disable")
                val removeFile = File(moduleDir, "remove")
                moduleInfo.putBoolean("enabled", !disableFile.exists())
                moduleInfo.putBoolean("remove", removeFile.exists())

                modules.pushMap(moduleInfo)
            }

            promise.resolve(modules)
        } catch (e: Exception) {
            Log.e(TAG, "getModuleList error", e)
            promise.reject("MODULE_LIST_ERROR", e.message)
        }
    }

    /**
     * 启用模块
     */
    @ReactMethod
    fun enableModule(moduleId: String, promise: Promise) {
        try {
            val disableFile = File("/data/adb/modules/$moduleId/disable")
            if (disableFile.exists()) {
                disableFile.delete()
            }
            promise.resolve("模块 $moduleId 已启用")
        } catch (e: Exception) {
            promise.reject("MODULE_ENABLE_ERROR", e.message)
        }
    }

    /**
     * 禁用模块
     */
    @ReactMethod
    fun disableModule(moduleId: String, promise: Promise) {
        try {
            val disableFile = File("/data/adb/modules/$moduleId/disable")
            disableFile.createNewFile()
            promise.resolve("模块 $moduleId 已禁用")
        } catch (e: Exception) {
            promise.reject("MODULE_DISABLE_ERROR", e.message)
        }
    }

    /**
     * 卸载模块（标记为删除，下次重启生效）
     */
    @ReactMethod
    fun removeModule(moduleId: String, promise: Promise) {
        try {
            val removeFile = File("/data/adb/modules/$moduleId/remove")
            removeFile.createNewFile()
            promise.resolve("模块 $moduleId 已标记删除，重启后生效")
        } catch (e: Exception) {
            promise.reject("MODULE_REMOVE_ERROR", e.message)
        }
    }

    /**
     * 强制删除模块目录
     */
    @ReactMethod
    fun forceDeleteModule(moduleId: String, promise: Promise) {
        try {
            val moduleDir = File("/data/adb/modules/$moduleId")
            if (moduleDir.exists()) {
                moduleDir.deleteRecursively()
            }
            promise.resolve("模块 $moduleId 已强制删除")
        } catch (e: Exception) {
            promise.reject("MODULE_DELETE_ERROR", e.message)
        }
    }

    /**
     * 读取 module.prop 文件
     */
    private fun readProps(file: File): java.util.Properties {
        val props = java.util.Properties()
        try {
            val reader = file.bufferedReader()
            reader.forEachLine { line ->
                val trimmed = line.trim()
                if (trimmed.isNotEmpty() && !trimmed.startsWith("#")) {
                    val idx = trimmed.indexOf('=')
                    if (idx > 0) {
                        props.setProperty(trimmed.substring(0, idx).trim(), trimmed.substring(idx + 1).trim())
                    }
                }
            }
            reader.close()
        } catch (e: Exception) {
            Log.e(TAG, "readProps error", e)
        }
        return props
    }
}
