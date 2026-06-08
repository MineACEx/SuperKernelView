package com.kerneluser.ace

import android.os.Build
import android.util.Log
import com.facebook.react.bridge.*
import java.io.BufferedReader
import java.io.File
import java.io.InputStreamReader

/**
 * 设备信息原生模块
 * 获取系统信息、内核版本、SELinux 状态、指纹等
 */
class AceDeviceInfoModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val TAG = "AceDeviceInfo"

    override fun getName(): String = "AceDeviceInfo"

    /**
     * 获取完整设备信息
     */
    @ReactMethod
    fun getDeviceInfo(promise: Promise) {
        try {
            val result = Arguments.createMap()
            result.putString("brand", Build.BRAND)
            result.putString("manufacturer", Build.MANUFACTURER)
            result.putString("model", Build.MODEL)
            result.putString("device", Build.DEVICE)
            result.putString("hardware", Build.HARDWARE)
            result.putString("product", Build.PRODUCT)
            result.putString("board", Build.BOARD)
            result.putString("fingerprint", Build.FINGERPRINT)
            result.putString("display", Build.DISPLAY)
            result.putString("androidVersion", Build.VERSION.RELEASE)
            result.putInt("sdkVersion", Build.VERSION.SDK_INT)
            result.putString("securityPatch", Build.VERSION.SECURITY_PATCH)
            result.putString("kernelVersion", getKernelVersion())
            result.putString("selinuxStatus", getSELinuxStatus())
            result.putString("cpuInfo", getCPUInfo())
            result.putString("memInfo", getMemInfo())
            result.putString("buildType", Build.TYPE)
            result.putString("buildUser", Build.USER)
            result.putString("buildHost", Build.HOST)
            result.putString("serial", Build.SERIAL)
            result.putString("bootloader", Build.BOOTLOADER)
            result.putString("baseband", Build.getRadioVersion())
            result.putString("buildTags", Build.TAGS)
            result.putString("buildTime", java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss", java.util.Locale.US)
                .format(java.util.Date(Build.TIME)))
            promise.resolve(result)
        } catch (e: Exception) {
            Log.e(TAG, "getDeviceInfo error", e)
            promise.reject("DEVICE_INFO_ERROR", e.message)
        }
    }

    /**
     * 获取挂载点信息
     */
    @ReactMethod
    fun getMountPoints(promise: Promise) {
        try {
            val process = Runtime.getRuntime().exec("cat /proc/mounts")
            val reader = BufferedReader(InputStreamReader(process.inputStream))
            val output = StringBuilder()
            var line: String?
            while (reader.readLine().also { line = it } != null) {
                output.append(line).append("\n")
            }
            reader.close()
            promise.resolve(output.toString().trim())
        } catch (e: Exception) {
            promise.reject("MOUNT_ERROR", e.message)
        }
    }

    /**
     * 获取运行中的服务列表
     */
    @ReactMethod
    fun getRunningServices(promise: Promise) {
        try {
            val process = Runtime.getRuntime().exec("list services")
            val reader = BufferedReader(InputStreamReader(process.inputStream))
            val output = StringBuilder()
            var line: String?
            while (reader.readLine().also { line = it } != null) {
                output.append(line).append("\n")
            }
            reader.close()
            promise.resolve(output.toString().trim())
        } catch (e: Exception) {
            promise.reject("SERVICES_ERROR", e.message)
        }
    }

    /**
     * 获取网络统计信息
     */
    @ReactMethod
    fun getNetworkStats(promise: Promise) {
        try {
            val process = Runtime.getRuntime().exec("cat /proc/net/dev")
            val reader = BufferedReader(InputStreamReader(process.inputStream))
            val output = StringBuilder()
            var line: String?
            while (reader.readLine().also { line = it } != null) {
                output.append(line).append("\n")
            }
            reader.close()
            promise.resolve(output.toString().trim())
        } catch (e: Exception) {
            promise.reject("NET_STATS_ERROR", e.message)
        }
    }

    private fun getKernelVersion(): String {
        return try {
            val process = Runtime.getRuntime().exec("uname -r")
            val reader = BufferedReader(InputStreamReader(process.inputStream))
            val version = reader.readLine()
            reader.close()
            version ?: "Unknown"
        } catch (e: Exception) {
            "Unknown"
        }
    }

    private fun getSELinuxStatus(): String {
        return try {
            val process = Runtime.getRuntime().exec("getenforce")
            val reader = BufferedReader(InputStreamReader(process.inputStream))
            val status = reader.readLine()
            reader.close()
            status ?: "Unknown"
        } catch (e: Exception) {
            "Unknown"
        }
    }

    private fun getCPUInfo(): String {
        return try {
            val file = File("/proc/cpuinfo")
            if (file.exists()) {
                val reader = BufferedReader(java.io.FileReader(file))
                val sb = StringBuilder()
                var line: String?
                var count = 0
                while (reader.readLine().also { line = it } != null && count < 30) {
                    sb.append(line).append("\n")
                    count++
                }
                reader.close()
                sb.toString().trim()
            } else {
                "Unknown"
            }
        } catch (e: Exception) {
            "Unknown"
        }
    }

    private fun getMemInfo(): String {
        return try {
            val file = File("/proc/meminfo")
            if (file.exists()) {
                val reader = BufferedReader(java.io.FileReader(file))
                val sb = StringBuilder()
                var line: String?
                var count = 0
                while (reader.readLine().also { line = it } != null && count < 10) {
                    sb.append(line).append("\n")
                    count++
                }
                reader.close()
                sb.toString().trim()
            } else {
                "Unknown"
            }
        } catch (e: Exception) {
            "Unknown"
        }
    }
}
