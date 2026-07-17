package com.autoreelscroll

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.text.TextUtils
import android.util.Base64
import com.facebook.react.bridge.*
import java.io.ByteArrayOutputStream
import java.text.SimpleDateFormat
import java.util.*

class AccessibilityManagerModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val sharedPrefs: SharedPreferences = reactContext.getSharedPreferences("AutoReelScrollPrefs", Context.MODE_PRIVATE)

    override fun getName(): String = "AccessibilityManager"

    @ReactMethod
    fun isAccessibilityEnabled(promise: Promise) {
        val enabled = checkAccessibilityEnabled(reactApplicationContext)
        promise.resolve(enabled)
    }

    @ReactMethod
    fun openAccessibilitySettings() {
        val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        reactApplicationContext.startActivity(intent)
    }

    @ReactMethod
    fun isOverlayPermissionGranted(promise: Promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            promise.resolve(Settings.canDrawOverlays(reactApplicationContext))
        } else {
            promise.resolve(true)
        }
    }

    @ReactMethod
    fun openOverlaySettings() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val intent = Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:${reactApplicationContext.packageName}")
            ).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            reactApplicationContext.startActivity(intent)
        }
    }

    @ReactMethod
    fun startAutoScroll(packageName: String, intervalSeconds: Int, randomMode: Boolean, promise: Promise) {
        try {
            // Save state to SharedPreferences
            sharedPrefs.edit()
                .putString("selected_package", packageName)
                .putInt("swipe_interval", intervalSeconds)
                .putBoolean("random_mode", randomMode)
                .putBoolean("service_running", true)
                .apply()

            // Start Foreground Service
            val serviceIntent = Intent(reactApplicationContext, AutoScrollForegroundService::class.java).apply {
                action = "START"
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                reactApplicationContext.startForegroundService(serviceIntent)
            } else {
                reactApplicationContext.startService(serviceIntent)
            }

            // Sync with accessibility service
            AutoScrollAccessibilityService.getInstance()?.apply {
                startScrolling(packageName, intervalSeconds, randomMode)
            }

            // Automatically launch target application to provide a premium UX
            val launchIntent = reactApplicationContext.packageManager.getLaunchIntentForPackage(packageName)
            if (launchIntent != null) {
                launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                reactApplicationContext.startActivity(launchIntent)
            }

            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("START_SERVICE_FAILED", e.message)
        }
    }

    @ReactMethod
    fun stopAutoScroll(promise: Promise) {
        try {
            sharedPrefs.edit()
                .putBoolean("service_running", false)
                .apply()

            // Stop Foreground Service
            val serviceIntent = Intent(reactApplicationContext, AutoScrollForegroundService::class.java).apply {
                action = "STOP"
            }
            reactApplicationContext.startService(serviceIntent)

            // Stop accessibility scroll loop
            AutoScrollAccessibilityService.getInstance()?.stopScrolling()

            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("STOP_SERVICE_FAILED", e.message)
        }
    }

    @ReactMethod
    fun performSwipe(promise: Promise) {
        val serviceInstance = AutoScrollAccessibilityService.getInstance()
        if (serviceInstance != null) {
            serviceInstance.triggerManualSwipe()
            promise.resolve(true)
        } else {
            promise.reject("SERVICE_NOT_CONNECTED", "Accessibility Service is not enabled or running.")
        }
    }

    @ReactMethod
    fun getCurrentPackage(promise: Promise) {
        val currentPkg = AutoScrollAccessibilityService.getInstance()?.getCurrentActivePackage()
        promise.resolve(currentPkg ?: "")
    }

    @ReactMethod
    fun getStatistics(promise: Promise) {
        checkAndResetDailyStats()
        val stats = Arguments.createMap().apply {
            putInt("totalSwipes", sharedPrefs.getInt("total_swipes", 0))
            putInt("todaySwipes", sharedPrefs.getInt("today_swipes", 0))
            putDouble("averageInterval", sharedPrefs.getFloat("average_interval", 0f).toDouble())
            putDouble("runningTime", sharedPrefs.getLong("running_time", 0L).toDouble())
            putBoolean("isRunning", sharedPrefs.getBoolean("service_running", false))
            putBoolean("isAccessibilityConnected", AutoScrollAccessibilityService.isServiceRunning())
        }
        promise.resolve(stats)
    }

    @ReactMethod
    fun getInstalledApps(promise: Promise) {
        Thread {
            try {
                val pm = reactApplicationContext.packageManager
                val intent = Intent(Intent.ACTION_MAIN, null).apply {
                    addCategory(Intent.CATEGORY_LAUNCHER)
                }
                val resolveInfos = pm.queryIntentActivities(intent, 0)
                val appsList = Arguments.createArray()

                for (resolveInfo in resolveInfos) {
                    val packageName = resolveInfo.activityInfo.packageName
                    if (packageName == reactApplicationContext.packageName) {
                        continue
                    }
                    val name = resolveInfo.loadLabel(pm).toString()
                    val iconDrawable = resolveInfo.loadIcon(pm)
                    val base64Icon = drawableToBase64(iconDrawable)

                    val appMap = Arguments.createMap().apply {
                        putString("name", name)
                        putString("packageName", packageName)
                        putString("icon", base64Icon)
                    }
                    appsList.pushMap(appMap)
                }
                promise.resolve(appsList)
            } catch (e: Exception) {
                promise.reject("GET_APPS_FAILED", e.message)
            }
        }.start()
    }

    @ReactMethod
    fun saveSettings(settings: ReadableMap, promise: Promise) {
        try {
            val editor = sharedPrefs.edit()
            if (settings.hasKey("darkMode")) editor.putBoolean("dark_mode", settings.getBoolean("darkMode"))
            if (settings.hasKey("randomMode")) editor.putBoolean("random_mode", settings.getBoolean("randomMode"))
            if (settings.hasKey("vibration")) editor.putBoolean("vibration", settings.getBoolean("vibration"))
            if (settings.hasKey("keepAwake")) editor.putBoolean("keep_awake", settings.getBoolean("keepAwake"))
            if (settings.hasKey("startOnBoot")) editor.putBoolean("start_on_boot", settings.getBoolean("startOnBoot"))
            if (settings.hasKey("autoResume")) editor.putBoolean("auto_resume", settings.getBoolean("autoResume"))
            if (settings.hasKey("swipeInterval")) editor.putInt("swipe_interval", settings.getInt("swipeInterval"))
            editor.apply()
            
            // Immediately notify services if settings updated
            AutoScrollAccessibilityService.getInstance()?.syncSettingsFromPrefs()
            AutoScrollForegroundService.getInstance()?.syncSettingsFromPrefs()

            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SAVE_SETTINGS_FAILED", e.message)
        }
    }

    @ReactMethod
    fun getSettings(promise: Promise) {
        try {
            val settings = Arguments.createMap().apply {
                putBoolean("darkMode", sharedPrefs.getBoolean("dark_mode", false))
                putBoolean("randomMode", sharedPrefs.getBoolean("random_mode", false))
                putBoolean("vibration", sharedPrefs.getBoolean("vibration", true))
                putBoolean("keepAwake", sharedPrefs.getBoolean("keep_awake", true))
                putBoolean("startOnBoot", sharedPrefs.getBoolean("start_on_boot", false))
                putBoolean("autoResume", sharedPrefs.getBoolean("auto_resume", false))
                putInt("swipeInterval", sharedPrefs.getInt("swipe_interval", 10))
                putString("selectedPackage", sharedPrefs.getString("selected_package", ""))
            }
            promise.resolve(settings)
        } catch (e: Exception) {
            promise.reject("GET_SETTINGS_FAILED", e.message)
        }
    }

    private fun checkAccessibilityEnabled(context: Context): Boolean {
        val expectedComponentName = ComponentName(context, AutoScrollAccessibilityService::class.java)
        val enabledServicesSetting = Settings.Secure.getString(
            context.contentResolver,
            Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        ) ?: return false

        val colonSplitter = TextUtils.SimpleStringSplitter(':')
        colonSplitter.setString(enabledServicesSetting)
        while (colonSplitter.hasNext()) {
            val componentNameString = colonSplitter.next()
            val enabledService = ComponentName.unflattenFromString(componentNameString)
            if (enabledService != null && enabledService == expectedComponentName) {
                return true
            }
        }
        return false
    }

    private fun checkAndResetDailyStats() {
        val currentDate = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
        val lastSwipeDate = sharedPrefs.getString("last_swipe_date", "")
        if (currentDate != lastSwipeDate) {
            sharedPrefs.edit()
                .putInt("today_swipes", 0)
                .putString("last_swipe_date", currentDate)
                .apply()
        }
    }

    private fun drawableToBase64(drawable: Drawable): String {
        val bitmap = if (drawable is BitmapDrawable) {
            drawable.bitmap
        } else {
            val width = if (drawable.intrinsicWidth > 0) drawable.intrinsicWidth else 96
            val height = if (drawable.intrinsicHeight > 0) drawable.intrinsicHeight else 96
            val bmp = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
            val canvas = Canvas(bmp)
            drawable.setBounds(0, 0, canvas.width, canvas.height)
            drawable.draw(canvas)
            bmp
        }
        
        // Scale down large icons to minimize memory consumption over bridge
        val scaledBitmap = if (bitmap.width > 128 || bitmap.height > 128) {
            Bitmap.createScaledBitmap(bitmap, 128, 128, true)
        } else {
            bitmap
        }
        
        val outputStream = ByteArrayOutputStream()
        scaledBitmap.compress(Bitmap.CompressFormat.PNG, 90, outputStream)
        val byteArray = outputStream.toByteArray()
        return Base64.encodeToString(byteArray, Base64.NO_WRAP)
    }
}
