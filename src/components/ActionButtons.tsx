import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, HelperText, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface ActionButtonsProps {
  isAccessibilityEnabled: boolean;
  isServiceRunning: boolean;
  selectedPackage: string;
  onEnableAccessibility: () => void;
  onStartService: () => void;
  onStopService: () => void;
  onChooseTargetApp: () => void;
}

export function ActionButtons({
  isAccessibilityEnabled,
  isServiceRunning,
  selectedPackage,
  onEnableAccessibility,
  onStartService,
  onStopService,
  onChooseTargetApp,
}: ActionButtonsProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      {!isAccessibilityEnabled && (
        <View style={styles.alertContainer}>
          <Button
            mode="contained"
            onPress={onEnableAccessibility}
            style={[styles.button, styles.permissionButton]}
            buttonColor={theme.colors.error}
            icon={() => <MaterialCommunityIcons name="security" size={20} color="#FFF" />}
          >
            Enable Accessibility Permission
          </Button>
          <HelperText type="info" visible style={styles.helperText}>
            Accessibility permission is required to perform swipe-up gestures.
          </HelperText>
        </View>
      )}

      {isServiceRunning ? (
        <Button
          mode="contained"
          onPress={onStopService}
          style={styles.button}
          buttonColor="#F44336"
          icon={() => <MaterialCommunityIcons name="stop" size={20} color="#FFF" />}
        >
          Stop Scroll Engine
        </Button>
      ) : (
        <Button
          mode="contained"
          onPress={onStartService}
          disabled={!isAccessibilityEnabled || !selectedPackage}
          style={styles.button}
          buttonColor={theme.colors.primary}
          icon={() => <MaterialCommunityIcons name="play" size={20} color="#FFF" />}
        >
          Start Scroll Engine
        </Button>
      )}

      <Button
        mode="outlined"
        onPress={onChooseTargetApp}
        disabled={isServiceRunning}
        style={styles.button}
        icon={() => (
          <MaterialCommunityIcons
            name="apps"
            size={20}
            color={isServiceRunning ? theme.colors.outline : theme.colors.primary}
          />
        )}
      >
        Choose Target App
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  button: {
    marginVertical: 8,
    borderRadius: 24,
    paddingVertical: 4,
  },
  permissionButton: {
    elevation: 3,
  },
  alertContainer: {
    marginBottom: 8,
  },
  helperText: {
    textAlign: 'center',
    fontSize: 12,
  },
});
