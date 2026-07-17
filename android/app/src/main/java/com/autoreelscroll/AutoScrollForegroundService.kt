package com.autoreelscroll

import android.app.*
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import androidx.core.app.NotificationCompat
import java.text.SimpleDateFormat
import java.util.*

class AutoScrollForegroundService : Service() {

    private lateinit var sharedPrefs: SharedPreferences
    private var wakeLock: PowerManager.WakeLock? = null
    private val CHANNEL_ID = "AutoScrollForegroundChannel"
    private val NOTIFICATION_ID = 888

    private var startTimeMillis: Long = 0L

    companion object {
        private var instance: AutoScrollForegroundService? = null
        fun getInstance(): AutoScrollForegroundService? = instance
    }

    override fun onCreate() {
        super.onCreate()
        instance = this
        sharedPrefs = getSharedPreferences("AutoReelScrollPrefs", Context.MODE_PRIVATE)
        createNotificationChannel()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val action = intent?.action
        val pkg = sharedPrefs.getString("selected_package", "") ?: ""
        val isRunning = sharedPrefs.getBoolean("service_running", false)

        when (action) {
            "START" -> {
                startTimeMillis = System.currentTimeMillis()
                acquireWakeLock()
                startForeground(NOTIFICATION_ID, buildNotification(pkg, true))
            }
            "PAUSE" -> {
                sharedPrefs.edit().putBoolean("service_running", false).apply()
                AutoScrollAccessibilityService.getInstance()?.stopScrolling()
                updateNotification(pkg, false)
                updateRunningTime()
            }
            "RESUME" -> {
                val interval = sharedPrefs.getInt("swipe_interval", 10)
                val randomMode = sharedPrefs.getBoolean("random_mode", false)
                
                sharedPrefs.edit().putBoolean("service_running", true).apply()
                AutoScrollAccessibilityService.getInstance()?.startScrolling(pkg, interval, randomMode)
                
                startTimeMillis = System.currentTimeMillis()
                acquireWakeLock()
                updateNotification(pkg, true)
            }
            "STOP" -> {
                sharedPrefs.edit().putBoolean("service_running", false).apply()
                AutoScrollAccessibilityService.getInstance()?.stopScrolling()
                updateRunningTime()
                releaseWakeLock()
                stopForeground(true)
                stopSelf()
            }
        }
        return START_NOT_STICKY
    }

    override fun onDestroy() {
        super.onDestroy()
        releaseWakeLock()
        instance = null
    }

    fun syncSettingsFromPrefs() {
        val keepAwake = sharedPrefs.getBoolean("keep_awake", true)
        val isRunning = sharedPrefs.getBoolean("service_running", false)
        if (keepAwake && isRunning) {
            acquireWakeLock()
        } else {
            releaseWakeLock()
        }
        val pkg = sharedPrefs.getString("selected_package", "") ?: ""
        updateNotification(pkg, isRunning)
    }

    private fun updateRunningTime() {
        if (startTimeMillis > 0L) {
            val elapsed = System.currentTimeMillis() - startTimeMillis
            val priorRunningTime = sharedPrefs.getLong("running_time", 0L)
            sharedPrefs.edit().putLong("running_time", priorRunningTime + elapsed).apply()
            startTimeMillis = 0L
        }
    }

    private fun buildNotification(packageName: String, isActive: Boolean): Notification {
        val appName = getAppNameFromPackage(packageName)
        val contentText = if (isActive) {
            "Auto Reel Scroll is scrolling $appName"
        } else {
            "Auto Scroll is paused"
        }

        // Action PendingIntents
        val pauseIntent = Intent(this, AutoScrollForegroundService::class.java).apply { action = "PAUSE" }
        val pausePending = PendingIntent.getService(this, 1, pauseIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)

        val resumeIntent = Intent(this, AutoScrollForegroundService::class.java).apply { action = "RESUME" }
        val resumePending = PendingIntent.getService(this, 2, resumeIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)

        val stopIntent = Intent(this, AutoScrollForegroundService::class.java).apply { action = "STOP" }
        val stopPending = PendingIntent.getService(this, 3, stopIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)

        // Main app launch PendingIntent
        val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
        val launchPending = if (launchIntent != null) {
            PendingIntent.getActivity(this, 0, launchIntent, PendingIntent.FLAG_IMMUTABLE)
        } else {
            val mainIntent = Intent(this, MainActivity::class.java)
            PendingIntent.getActivity(this, 0, mainIntent, PendingIntent.FLAG_IMMUTABLE)
        }

        val builder = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setContentTitle("Auto Reel Scroll Active")
            .setContentText(contentText)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setContentIntent(launchPending)
            .setOngoing(true)

        if (isActive) {
            builder.addAction(android.R.drawable.ic_media_pause, "Pause", pausePending)
        } else {
            builder.addAction(android.R.drawable.ic_media_play, "Resume", resumePending)
        }
        
        builder.addAction(android.R.drawable.ic_menu_close_clear_cancel, "Stop", stopPending)

        return builder.build()
    }

    private fun updateNotification(packageName: String, isActive: Boolean) {
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.notify(NOTIFICATION_ID, buildNotification(packageName, isActive))
    }

    private fun getAppNameFromPackage(packageName: String): String {
        if (packageName.isEmpty()) return "Instagram"
        return try {
            val pm = packageManager
            val appInfo = pm.getApplicationInfo(packageName, 0)
            pm.getApplicationLabel(appInfo).toString()
        } catch (e: Exception) {
            packageName.substringAfterLast('.')
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Auto Scroll Service Channel",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Foreground controller notification for reel auto scrolling"
            }
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    private fun acquireWakeLock() {
        val keepAwake = sharedPrefs.getBoolean("keep_awake", true)
        if (keepAwake && wakeLock == null) {
            val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
            wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "AutoReelScroll::ServiceWakeLock").apply {
                acquire(24 * 60 * 60 * 1000L /* 24 hours */)
            }
        }
    }

    private fun releaseWakeLock() {
        wakeLock?.let {
            if (it.isHeld) {
                it.release()
            }
        }
        wakeLock = null
    }
}
