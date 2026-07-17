package com.autoreelscroll

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            val sharedPrefs = context.getSharedPreferences("AutoReelScrollPrefs", Context.MODE_PRIVATE)
            val startOnBoot = sharedPrefs.getBoolean("start_on_boot", false)
            val isRunning = sharedPrefs.getBoolean("service_running", false)
            val autoResume = sharedPrefs.getBoolean("auto_resume", false)

            // Start service if start-on-boot is toggled, or if auto-resume is toggled and it was previously running
            if (startOnBoot || (autoResume && isRunning)) {
                val serviceIntent = Intent(context, AutoScrollForegroundService::class.java).apply {
                    action = "START"
                }
                
                try {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        context.startForegroundService(serviceIntent)
                    } else {
                        context.startService(serviceIntent)
                    }
                } catch (e: Exception) {
                    // Fail silently on boot crashes (e.g. background execution limits)
                }
            }
        }
    }
}
