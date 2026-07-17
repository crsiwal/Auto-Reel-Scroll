package com.autoreelscroll

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.content.Context
import android.content.SharedPreferences
import android.graphics.Path
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.view.accessibility.AccessibilityEvent
import java.text.SimpleDateFormat
import java.util.*
import kotlin.random.Random

class AutoScrollAccessibilityService : AccessibilityService() {

    private lateinit var sharedPrefs: SharedPreferences
    private val handler = Handler(Looper.getMainLooper())
    private var isLoopActive = false

    private var targetPackage: String = ""
    private var currentActivePackage: String = ""
    private var intervalSeconds: Int = 10
    private var randomMode: Boolean = false
    private var vibrationEnabled: Boolean = true
    private var isRunning: Boolean = false

    private val gestureRunnable = object : Runnable {
        override fun run() {
            if (!isRunning || currentActivePackage != targetPackage) {
                isLoopActive = false
                return
            }

            performSwipeGesture()

            val nextDelay = getNextDelayMs()
            handler.postDelayed(this, nextDelay)
        }
    }

    companion object {
        private var instance: AutoScrollAccessibilityService? = null
        fun getInstance(): AutoScrollAccessibilityService? = instance
        fun isServiceRunning(): Boolean = instance != null
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        sharedPrefs = getSharedPreferences("AutoReelScrollPrefs", Context.MODE_PRIVATE)
        syncSettingsFromPrefs()
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent) {
        if (event.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            val pkg = event.packageName?.toString()
            if (pkg != null) {
                currentActivePackage = pkg
                
                // If the target app has become active and the service is set to run,
                // kick off the gesture loop.
                if (pkg == targetPackage && isRunning) {
                    startGestureLoop()
                } else {
                    stopGestureLoop()
                }
            }
        }
    }

    override fun onInterrupt() {
        // Required method by AccessibilityService
    }

    override fun onDestroy() {
        super.onDestroy()
        stopGestureLoop()
        instance = null
    }

    fun startScrolling(pkg: String, interval: Int, rand: Boolean) {
        targetPackage = pkg
        intervalSeconds = interval
        randomMode = rand
        isRunning = true
        
        syncSettingsFromPrefs()
    }

    fun stopScrolling() {
        isRunning = false
        stopGestureLoop()
        
        // Sync state back to preferences
        sharedPrefs.edit().putBoolean("service_running", false).apply()
    }

    fun triggerManualSwipe() {
        performSwipeGesture()
    }

    fun getCurrentActivePackage(): String {
        return currentActivePackage
    }

    fun syncSettingsFromPrefs() {
        if (!::sharedPrefs.isInitialized) return
        
        targetPackage = sharedPrefs.getString("selected_package", "") ?: ""
        intervalSeconds = sharedPrefs.getInt("swipe_interval", 10)
        randomMode = sharedPrefs.getBoolean("random_mode", false)
        vibrationEnabled = sharedPrefs.getBoolean("vibration", true)
        isRunning = sharedPrefs.getBoolean("service_running", false)

        if (isRunning && currentActivePackage == targetPackage) {
            startGestureLoop()
        } else {
            stopGestureLoop()
        }
    }

    private fun startGestureLoop() {
        if (isLoopActive) return
        if (!isRunning || targetPackage.isEmpty() || currentActivePackage != targetPackage) return

        isLoopActive = true
        val delay = getNextDelayMs()
        handler.postDelayed(gestureRunnable, delay)
    }

    private fun stopGestureLoop() {
        handler.removeCallbacks(gestureRunnable)
        isLoopActive = false
    }

    private fun getNextDelayMs(): Long {
        var secs = intervalSeconds
        if (randomMode) {
            // Adds random variance of ±2 seconds
            val variance = Random.nextInt(-2, 3)
            secs += variance
            if (secs < 5) secs = 5 // Minimum limit is 5 seconds as specified
        }
        return secs.toLong() * 1000L
    }

    private fun performSwipeGesture() {
        val displayMetrics = resources.displayMetrics
        val width = displayMetrics.widthPixels
        val height = displayMetrics.heightPixels

        // Swipe Coordinates: from 50% width, 80% height to 50% width, 20% height
        val startX = width * 0.5f
        val startY = height * 0.8f
        val endX = width * 0.5f
        val endY = height * 0.2f

        val path = Path().apply {
            moveTo(startX, startY)
            lineTo(endX, endY)
        }

        val gestureBuilder = GestureDescription.Builder()
        // Swipe duration: 300ms
        val stroke = GestureDescription.StrokeDescription(path, 0, 300)
        gestureBuilder.addStroke(stroke)

        dispatchGesture(gestureBuilder.build(), object : GestureResultCallback() {
            override fun onCompleted(gestureDescription: GestureDescription?) {
                super.onCompleted(gestureDescription)
                onGestureSuccess()
            }

            override fun onCancelled(gestureDescription: GestureDescription?) {
                super.onCancelled(gestureDescription)
            }
        }, null)
    }

    private fun onGestureSuccess() {
        // Increment statistics
        val currentDate = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
        val lastSwipeDate = sharedPrefs.getString("last_swipe_date", "")
        
        val totalSwipes = sharedPrefs.getInt("total_swipes", 0) + 1
        var todaySwipes = sharedPrefs.getInt("today_swipes", 0) + 1
        
        if (currentDate != lastSwipeDate) {
            todaySwipes = 1
        }

        sharedPrefs.edit().apply {
            putInt("total_swipes", totalSwipes)
            putInt("today_swipes", todaySwipes)
            putString("last_swipe_date", currentDate)
            apply()
        }

        // Trigger vibration feedback
        if (vibrationEnabled) {
            vibrate()
        }
    }

    private fun vibrate() {
        try {
            val vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vibratorManager = getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
                vibratorManager.defaultVibrator
            } else {
                @Suppress("DEPRECATION")
                getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator.vibrate(VibrationEffect.createOneShot(40, VibrationEffect.DEFAULT_AMPLITUDE))
            } else {
                @Suppress("DEPRECATION")
                vibrator.vibrate(40)
            }
        } catch (e: Exception) {
            // Ignore vibration errors
        }
    }
}
