package com.kerneluser.ace

import android.util.Log
import com.facebook.react.bridge.*
import java.io.BufferedReader
import java.io.InputStreamReader

/**
 * 分区管理原生模块
 * 获取分区列表、A/B 分区状态、刷写分区
 */
class AcePartitionModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val TAG = "AcePartition"

    override fun getName(): String = "AcePartition"

    /**
     * 获取所有分区列表
     */
    @ReactMethod
    fun getPartitionList(promise: Promise) {
        try {
            val process = Runtime.getRuntime().exec(arrayOf("su", "-c", "ls -la /dev/block/by-name/"))
            val reader = BufferedReader(InputStreamReader(process.inputStream))
            val output = StringBuilder()
            var line: String?
            while (reader.readLine().also { line = it } != null) {
                output.append(line).append("\n")
            }
            reader.close()
            promise.resolve(output.toString().trim())
        } catch (e: Exception) {
            // 尝试备用路径
            try {
                val process = Runtime.getRuntime().exec(arrayOf("su", "-c", "ls -la /dev/block/platform/*/by-name/"))
                val reader = BufferedReader(InputStreamReader(process.inputStream))
                val output = StringBuilder()
                var line: String?
                while (reader.readLine().also { line = it } != null) {
                    output.append(line).append("\n")
                }
                reader.close()
                promise.resolve(output.toString().trim())
            } catch (e2: Exception) {
                promise.reject("PARTITION_LIST_ERROR", "无法获取分区列表: ${e2.message}")
            }
        }
    }

    /**
     * 获取 A/B 分区状态
     */
    @ReactMethod
    fun getABPartitionStatus(promise: Promise) {
        try {
            val result = Arguments.createMap()

            // 检测是否为 A/B 设备
            val slotProcess = Runtime.getRuntime().exec(arrayOf("su", "-c", "getprop ro.boot.slot_suffix"))
            val slotReader = BufferedReader(InputStreamReader(slotProcess.inputStream))
            val currentSlot = slotReader.readLine()?.trim() ?: ""
            slotReader.close()

            result.putBoolean("isABDevice", currentSlot.isNotEmpty() || isABDevice())
            result.putString("currentSlot", if (currentSlot.isNotEmpty()) currentSlot else "N/A")

            // 获取 slot a 和 slot b 信息
            val slotAInfo = getSlotInfo("a")
            val slotBInfo = getSlotInfo("b")

            result.putMap("slotA", slotAInfo)
            result.putMap("slotB", slotBInfo)

            // 获取 boot 分区信息
            val bootInfo = getPartitionDetails("boot")
            result.putMap("bootPartition", bootInfo)

            promise.resolve(result)
        } catch (e: Exception) {
            Log.e(TAG, "getABPartitionStatus error", e)
            promise.reject("AB_STATUS_ERROR", e.message)
        }
    }

    /**
     * 获取分区详情
     */
    @ReactMethod
    fun getPartitionDetails(partitionName: String, promise: Promise) {
        try {
            val result = getPartitionDetails(partitionName)
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("PARTITION_DETAIL_ERROR", e.message)
        }
    }

    /**
     * 刷写分区
     * @param partitionName 分区名称
     * @param imagePath 镜像文件路径
     */
    @ReactMethod
    fun flashPartition(partitionName: String, imagePath: String, promise: Promise) {
        try {
            // 验证镜像文件存在
            val imgFile = java.io.File(imagePath)
            if (!imgFile.exists()) {
                promise.reject("FLASH_ERROR", "镜像文件不存在: $imagePath")
                return
            }

            // 执行 dd 命令刷写分区
            val command = "dd if=$imagePath of=/dev/block/by-name/$partitionName bs=4096"
            val process = Runtime.getRuntime().exec(arrayOf("su", "-c", command))

            // 读取错误流
            val errorReader = BufferedReader(InputStreamReader(process.errorStream))
            val errorOutput = StringBuilder()
            var line: String?
            while (errorReader.readLine().also { line = it } != null) {
                errorOutput.append(line).append("\n")
            }
            errorReader.close()

            process.waitFor()
            val exitCode = process.exitValue()

            if (exitCode == 0) {
                // 同步
                Runtime.getRuntime().exec(arrayOf("su", "-c", "sync"))
                promise.resolve("分区 $partitionName 刷写成功")
            } else {
                promise.reject("FLASH_ERROR", "刷写失败 (退出码: $exitCode): ${errorOutput.toString().trim()}")
            }
        } catch (e: Exception) {
            Log.e(TAG, "flashPartition error", e)
            promise.reject("FLASH_ERROR", e.message)
        }
    }

    /**
     * 备份分区
     */
    @ReactMethod
    fun backupPartition(partitionName: String, outputPath: String, promise: Promise) {
        try {
            val command = "dd if=/dev/block/by-name/$partitionName of=$outputPath bs=4096"
            val process = Runtime.getRuntime().exec(arrayOf("su", "-c", command))
            process.waitFor()
            Runtime.getRuntime().exec(arrayOf("su", "-c", "sync"))
            val exitCode = process.exitValue()
            if (exitCode == 0) {
                promise.resolve("分区 $partitionName 备份成功: $outputPath")
            } else {
                promise.reject("BACKUP_ERROR", "备份失败，退出码: $exitCode")
            }
        } catch (e: Exception) {
            promise.reject("BACKUP_ERROR", e.message)
        }
    }

    private fun isABDevice(): Boolean {
        return try {
            val process = Runtime.getRuntime().exec("getprop ro.build.ab_update")
            val reader = BufferedReader(InputStreamReader(process.inputStream))
            val value = reader.readLine()?.trim()
            reader.close()
            value == "true"
        } catch (e: Exception) {
            false
        }
    }

    private fun getSlotInfo(slot: String): WritableMap {
        val result = Arguments.createMap()
        try {
            // 获取 slot 是否可启动
            val process = Runtime.getRuntime().exec(arrayOf("su", "-c", "bootctl get-suffix $slot"))
            val reader = BufferedReader(InputStreamReader(process.inputStream))
            val suffix = reader.readLine()?.trim() ?: ""
            reader.close()
            result.putString("suffix", suffix)

            // 获取 slot 是否成功启动
            val bootProcess = Runtime.getRuntime().exec(arrayOf("su", "-c", "bootctl is-boot-successful $slot"))
            val bootReader = BufferedReader(InputStreamReader(bootProcess.inputStream))
            val successful = bootReader.readLine()?.trim() ?: "0"
            bootReader.close()
            result.putBoolean("bootSuccessful", successful == "1")

            // 获取 slot 是否未标记为可启动
            val unbootProcess = Runtime.getRuntime().exec(arrayOf("su", "-c", "bootctl is-slot-unbootable $slot"))
            val unbootReader = BufferedReader(InputStreamReader(unbootProcess.inputStream))
            val unbootable = unbootReader.readLine()?.trim() ?: "0"
            unbootReader.close()
            result.putBoolean("unbootable", unbootable == "1")

        } catch (e: Exception) {
            result.putString("suffix", "_$slot")
            result.putBoolean("bootSuccessful", false)
            result.putBoolean("unbootable", false)
        }
        return result
    }

    private fun getPartitionDetails(partitionName: String): WritableMap {
        val result = Arguments.createMap()
        try {
            val process = Runtime.getRuntime().exec(arrayOf("su", "-c", "ls -la /dev/block/by-name/$partitionName"))
            val reader = BufferedReader(InputStreamReader(process.inputStream))
            val info = reader.readLine()?.trim() ?: ""
            reader.close()
            result.putString("name", partitionName)
            result.putString("info", info)

            // 获取分区大小
            val sizeProcess = Runtime.getRuntime().exec(arrayOf("su", "-c", "blockdev --getsize64 /dev/block/by-name/$partitionName"))
            val sizeReader = BufferedReader(InputStreamReader(sizeProcess.inputStream))
            val size = sizeReader.readLine()?.trim() ?: "0"
            sizeReader.close()
            result.putString("sizeBytes", size)
            result.putString("sizeHuman", formatSize(size.toLongOrNull() ?: 0))
        } catch (e: Exception) {
            result.putString("name", partitionName)
            result.putString("info", "无法获取")
            result.putString("sizeBytes", "0")
            result.putString("sizeHuman", "Unknown")
        }
        return result
    }

    private fun formatSize(bytes: Long): String {
        return when {
            bytes < 1024 -> "$bytes B"
            bytes < 1024 * 1024 -> "${bytes / 1024} KB"
            bytes < 1024 * 1024 * 1024 -> "${bytes / (1024 * 1024)} MB"
            else -> "${"%.2f".format(bytes / (1024.0 * 1024.0 * 1024.0))} GB"
        }
    }
}
