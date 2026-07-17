# Auto Reel Scroll

Auto Reel Scroll is a complete, production-quality Android application built with React Native CLI (TypeScript) and native Android Kotlin modules. The application utilizes an Android `AccessibilityService` to perform automated swipe-up gestures at user-configurable intervals within a selected target app (such as Instagram, TikTok, YouTube Shorts, or Facebook Reels).

---

## Key Features

- **Dynamic App Selector**: Select any installed launcher application dynamically from a searchable app list. Custom Kotlin threads retrieve application icons and names, exposing them as Base64-encoded strings to the React Native UI.
- **Background Accessibility Engine**: Gestures are executed entirely in Kotlin via the `AccessibilityService`'s `dispatchGesture()` API. Swipes automatically pause when you exit the target app and resume when you return.
- **Persistent Foreground Service**: Runs a persistent foreground channel with system status notification and media-style action buttons (`Pause`, `Resume`, and `Stop`) to prevent the OS from killing the process.
- **Interval Control**: Configurable delays between 5 and 120 seconds. Optional **Random Mode** introduces a `±2 seconds` variance for natural behavior.
- **Material Design 3**: Modern design system using React Native Paper with dynamic dark/light theme switching, status chips, layout cards, and progress metrics.
- **Vibration & WakeLock**: Briefly vibrate on successful swipes and hold partial WakeLocks to prevent the screen from sleeping while active.
- **Start on Boot & Auto-Resume**: Relaunch services after device reboots if enabled.

---

## Folder Structure

The project conforms to clean architecture separating React Native frontend concerns from native Kotlin background threads:

```
├── android/                             # Android Studio Project Root
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── AndroidManifest.xml      # Registers services, permissions, and receiver
│   │   │   ├── res/
│   │   │   │   ├── xml/
│   │   │   │   │   └── accessibility_service_config.xml # Configures gesture capability
│   │   │   │   └── values/
│   │   │   │       ├── strings.xml      # System description strings
│   │   │   │       └── styles.xml       # Android theme configuration
│   │   │   └── java/com/autoreelscroll/
│   │   │       ├── MainActivity.kt      # standard React Native boot entry
│   │   │       ├── MainApplication.kt   # Registers Native Packages
│   │   │       ├── AccessibilityManagerModule.kt   # Core Bridge (exposes stats, apps list)
│   │   │       ├── AccessibilityManagerPackage.kt  # Registers Bridge Package
│   │   │       ├── AutoScrollAccessibilityService.kt # Controls Gesture dispatching & checks package state
│   │   │       ├── AutoScrollForegroundService.kt  # Notification builder & control action receiver
│   │   │       └── BootReceiver.kt      # Restores service after android.intent.action.BOOT_COMPLETED
│   └── build.gradle                     # Project level Gradle configurations
│
├── src/                                 # React Native TypeScript Source
│   ├── components/                      # UI Components (StatusCard, StatsGrid, AppListItem, etc.)
│   ├── screens/                         # App Screens (DashboardScreen, AppSelectionScreen, SettingsScreen)
│   ├── hooks/                           # custom hook useAccessibility for polling native stats
│   ├── native/                          # TypeScript definitions for the AccessibilityManager bridge
│   ├── navigation/                      # Navigation container and StackNavigator routes
│   ├── storage/                         # MMKV client key-value cache
│   └── theme/                           # Light/Dark Material Design 3 palettes
│
├── package.json                         # Node package dependencies
├── tsconfig.json                        # TypeScript settings
└── README.md                            # Complete setup and developer documentation
```

---

## Prerequisites

To build and run this application locally, ensure your development computer has the following tools installed:

1. **NodeJS**: Version `18.x` or higher.
2. **Java Development Kit (JDK)**: JDK 17 (required for Gradle 8.x).
3. **Android SDK & Build Tools**: Android SDK Platform Level 34.
4. **Android Device or Emulator**: Android 7.0 (API 24) or higher (required for gesture dispatcher APIs).

---

## Installation

1. **Clone the Repository** and navigate to the project directory:
   ```bash
   cd Auto-Reel-Scroll
   ```

2. **Install Node Dependencies**:
   ```bash
   npm install
   ```

---

## Build and Execution

1. **Start the Metro Bundler**:
   ```bash
   npm start
   ```

2. **Run on Connected Device / Emulator**:
   Ensure your device is connected via USB debugging (verify with `adb devices`), then execute:
   ```bash
   npm run android
   ```
   *Alternatively, you can open the `/android` directory inside Android Studio, sync Gradle, and click "Run App".*

---

## Required Android Settings

For the application to function correctly, the user must manually grant system permissions on the device:

### 1. Enable Accessibility Service (Mandatory)
1. In the app dashboard, tap **Enable Accessibility Permission** (this automatically redirects to the system settings page).
2. Go to **Installed Apps** (or **Downloaded Services** on some devices).
3. Select **Auto Reel Scroll**.
4. Turn on the switch and approve the warning alert.

### 2. Disable Battery Optimization (Highly Recommended)
Android's battery saver features may put background services to sleep:
1. Go to **Settings > Apps > Auto Reel Scroll**.
2. Select **Battery** or **App battery usage**.
3. Set the configuration to **Unrestricted** (or disable battery optimization).

### 3. Draw Over Other Apps / Notification Permissions (Optional)
- **Overlay Permission**: If floating buttons are added or for custom layouts, grant the permission when prompted.
- **Notifications**: On Android 13+ (API 33+), approve the notification request to display the persistent media controller actions.

---

## Technical Specifications

### Swipe Gesture Configuration
The swipe gesture coordinates are calculated dynamically based on screen display metrics. The gesture performs a vertical swipe-up gesture starting at `50% width` and `80% height` transitioning to `50% width` and `20% height` over a duration of `300 milliseconds`:
```kotlin
val startX = width * 0.5f
val startY = height * 0.8f
val endX = width * 0.5f
val endY = height * 0.2f
```

### Random Delay Formula
When **Randomize Delay** is checked in Settings, the app introduces a variance of `±2 seconds` on top of your selected base interval:
$$\text{Next Delay} = (\text{Interval} + \text{Variance}_{[-2, 2]}) \times 1000 \text{ ms}$$
*A safety floor of 5 seconds is enforced to prevent rapid continuous swiping.*

---

## Troubleshooting

### Q: The start button is greyed out.
- **A**: Ensure you have selected a target application in **Choose Target App** and that you have enabled the Accessibility Service under system settings.

### Q: The service is running, but gestures are not executing.
- **A**: Gestures only execute when the selected application (e.g. Instagram) is actively visible in the foreground. If you navigate back to the home screen or open another app, swiping pauses automatically.

### Q: The app closes in the background after some hours.
- **A**: Go to your phone's battery settings and set Auto Reel Scroll's battery profile to **Unrestricted** to prevent the OS from aggressively killing the background worker.

### Q: App list loads slowly or crashes with Out Of Memory.
- **A**: App icons are loaded on a separate background thread in Kotlin and automatically scaled down to `128x128 pixels` before converting to Base64. This minimizes RAM usage and avoids bridge congestion.