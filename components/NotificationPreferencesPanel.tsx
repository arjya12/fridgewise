// components/NotificationPreferencesPanel.tsx
import { useThemeColor } from "@/hooks/useThemeColor";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface NotificationPreferencesPanelProps {
  onPreferencesChange?: (preferences: NotificationPreferences) => void;
}

interface NotificationPreferences {
  enabled: boolean;
  expiryAlerts: {
    enabled: boolean;
    criticalHours: number;
    warningHours: number;
    dailyReminder: boolean;
    dailyReminderTime: string;
  };
  mealSuggestions: {
    enabled: boolean;
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
    beforeMealMinutes: number;
  };
  shoppingReminders: {
    enabled: boolean;
    lowStockThreshold: number;
    weeklyReminder: boolean;
    reminderDay: number; // 0-6 (Sun-Sat)
  };
  wasteReduction: {
    enabled: boolean;
    aggressiveMode: boolean;
  };
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:MM
    endTime: string; // HH:MM
  };
}

const NotificationPreferencesPanel: React.FC<
  NotificationPreferencesPanelProps
> = ({ onPreferencesChange }) => {
  const [preferences, setPreferences] =
    useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const backgroundColor = useThemeColor(
    { light: "#FFFFFF", dark: "#1D1D1D" },
    "background"
  );
  const surfaceColor = useThemeColor(
    { light: "#F8F9FA", dark: "#2C2C2E" },
    "background"
  );
  const textColor = useThemeColor(
    { light: "#11181C", dark: "#ECEDEE" },
    "text"
  );
  const primaryColor = "#007AFF";
  const borderColor = useThemeColor(
    { light: "#E0E0E0", dark: "#3C3C3E" },
    "border"
  );

  useEffect(() => {
    loadPreferences();
  }, []);

  const STORAGE_KEY = "notification.preferences.v1";

  const getDefaultPreferences = (): NotificationPreferences => ({
    enabled: true,
    expiryAlerts: {
      enabled: true,
      criticalHours: 2,
      warningHours: 24,
      dailyReminder: false,
      dailyReminderTime: "09:00",
    },
    mealSuggestions: {
      enabled: true,
      breakfast: false,
      lunch: true,
      dinner: true,
      beforeMealMinutes: 30,
    },
    shoppingReminders: {
      enabled: false,
      lowStockThreshold: 1,
      weeklyReminder: false,
      reminderDay: 6,
    },
    wasteReduction: {
      enabled: true,
      aggressiveMode: false,
    },
    quietHours: {
      enabled: true,
      startTime: "22:00",
      endTime: "07:00",
    },
  });

  const loadPreferences = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed: NotificationPreferences = stored
        ? JSON.parse(stored)
        : getDefaultPreferences();
      setPreferences(parsed);
    } catch (error) {
      console.error("Error loading preferences:", error);
      Alert.alert("Error", "Failed to load notification preferences");
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async (newPreferences: NotificationPreferences) => {
    setSaving(true);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newPreferences));
      setPreferences(newPreferences);
      onPreferencesChange?.(newPreferences);
    } catch (error) {
      console.error("Error saving preferences:", error);
      Alert.alert("Error", "Failed to save notification preferences");
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (
    section: keyof NotificationPreferences,
    field: string,
    value: any
  ) => {
    if (!preferences) return;

    const updated = {
      ...preferences,
      [section]: {
        ...(preferences as any)[section],
        [field]: value,
      },
    };
    savePreferences(updated);
  };

  const updateTopLevelPreference = (
    field: keyof NotificationPreferences,
    value: any
  ) => {
    if (!preferences) return;

    const updated = {
      ...preferences,
      [field]: value,
    };
    savePreferences(updated);
  };

  const SectionHeader: React.FC<{
    title: string;
    icon: string;
    enabled: boolean;
    onToggle: (enabled: boolean) => void;
  }> = ({ title, icon, enabled, onToggle }) => (
    <View style={[styles.sectionHeader, { backgroundColor: surfaceColor }]}>
      <View style={styles.sectionTitleRow}>
        <Ionicons
          name={icon as any}
          size={20}
          color={enabled ? primaryColor : textColor}
        />
        <Text style={[styles.sectionTitle, { color: textColor }]}>{title}</Text>
      </View>
      <Switch
        value={enabled}
        onValueChange={onToggle}
        trackColor={{ false: borderColor, true: primaryColor + "40" }}
        thumbColor={enabled ? primaryColor : "#f4f3f4"}
      />
    </View>
  );

  const SettingRow: React.FC<{
    label: string;
    description?: string;
    value: boolean;
    onToggle: (value: boolean) => void;
    disabled?: boolean;
  }> = ({ label, description, value, onToggle, disabled = false }) => (
    <View style={[styles.settingRow, { opacity: disabled ? 0.5 : 1 }]}>
      <View style={styles.settingContent}>
        <Text style={[styles.settingLabel, { color: textColor }]}>{label}</Text>
        {description && (
          <Text style={[styles.settingDescription, { color: textColor }]}>
            {description}
          </Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        disabled={disabled}
        trackColor={{ false: borderColor, true: primaryColor + "40" }}
        thumbColor={value ? primaryColor : "#f4f3f4"}
      />
    </View>
  );

  const TimeInput: React.FC<{
    label: string;
    value: string;
    onChangeText: (value: string) => void;
    disabled?: boolean;
  }> = ({ label, value, onChangeText, disabled = false }) => (
    <View style={[styles.timeInputRow, { opacity: disabled ? 0.5 : 1 }]}>
      <Text style={[styles.timeInputLabel, { color: textColor }]}>{label}</Text>
      <TextInput
        style={[
          styles.timeInput,
          {
            backgroundColor: surfaceColor,
            borderColor,
            color: textColor,
          },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder="HH:MM"
        placeholderTextColor={textColor + "80"}
        editable={!disabled}
        keyboardType="numeric"
      />
    </View>
  );

  const NumberInput: React.FC<{
    label: string;
    value: number;
    onChangeValue: (value: number) => void;
    min?: number;
    max?: number;
    disabled?: boolean;
  }> = ({
    label,
    value,
    onChangeValue,
    min = 0,
    max = 999,
    disabled = false,
  }) => (
    <View style={[styles.numberInputRow, { opacity: disabled ? 0.5 : 1 }]}>
      <Text style={[styles.numberInputLabel, { color: textColor }]}>
        {label}
      </Text>
      <View style={styles.numberInputContainer}>
        <TouchableOpacity
          style={[styles.numberButton, { borderColor }]}
          onPress={() => onChangeValue(Math.max(min, value - 1))}
          disabled={disabled || value <= min}
        >
          <Ionicons name="remove" size={16} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.numberValue, { color: textColor }]}>{value}</Text>
        <TouchableOpacity
          style={[styles.numberButton, { borderColor }]}
          onPress={() => onChangeValue(Math.min(max, value + 1))}
          disabled={disabled || value >= max}
        >
          <Ionicons name="add" size={16} color={textColor} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const DaySelector: React.FC<{
    label: string;
    selectedDay: number;
    onSelectDay: (day: number) => void;
    disabled?: boolean;
  }> = ({ label, selectedDay, onSelectDay, disabled = false }) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return (
      <View style={[styles.daySelectorRow, { opacity: disabled ? 0.5 : 1 }]}>
        <Text style={[styles.daySelectorLabel, { color: textColor }]}>
          {label}
        </Text>
        <View style={styles.dayButtons}>
          {days.map((day, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayButton,
                { borderColor },
                selectedDay === index && { backgroundColor: primaryColor },
              ]}
              onPress={() => onSelectDay(index)}
              disabled={disabled}
            >
              <Text
                style={[
                  styles.dayButtonText,
                  { color: selectedDay === index ? "#FFFFFF" : textColor },
                ]}
              >
                {day}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  if (loading || !preferences) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: textColor }]}>
            Loading preferences...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Master Toggle */}
      <View style={[styles.masterSection, { backgroundColor: surfaceColor }]}>
        <SectionHeader
          title="Notifications"
          icon="notifications"
          enabled={preferences.enabled}
          onToggle={(enabled) => updateTopLevelPreference("enabled", enabled)}
        />
        <Text style={[styles.masterDescription, { color: textColor }]}>
          Enable smart notifications to get contextual alerts about expiring
          items, meal suggestions, and more.
        </Text>
      </View>

      {preferences.enabled && (
        <>
          {/* Expiry Alerts */}
          <View style={[styles.section, { backgroundColor: surfaceColor }]}>
            <SectionHeader
              title="Expiry Alerts"
              icon="alarm"
              enabled={preferences.expiryAlerts.enabled}
              onToggle={(enabled) =>
                updatePreference("expiryAlerts", "enabled", enabled)
              }
            />

            <NumberInput
              label="Critical Alert (hours before expiry)"
              value={preferences.expiryAlerts.criticalHours}
              onChangeValue={(value) =>
                updatePreference("expiryAlerts", "criticalHours", value)
              }
              min={1}
              max={72}
              disabled={!preferences.expiryAlerts.enabled}
            />

            <NumberInput
              label="Warning Alert (hours before expiry)"
              value={preferences.expiryAlerts.warningHours}
              onChangeValue={(value) =>
                updatePreference("expiryAlerts", "warningHours", value)
              }
              min={12}
              max={168}
              disabled={!preferences.expiryAlerts.enabled}
            />

            <SettingRow
              label="Daily Reminder"
              description="Get a daily summary of expiring items"
              value={preferences.expiryAlerts.dailyReminder}
              onToggle={(value) =>
                updatePreference("expiryAlerts", "dailyReminder", value)
              }
              disabled={!preferences.expiryAlerts.enabled}
            />

            <TimeInput
              label="Daily Reminder Time"
              value={preferences.expiryAlerts.dailyReminderTime}
              onChangeText={(value) =>
                updatePreference("expiryAlerts", "dailyReminderTime", value)
              }
              disabled={
                !preferences.expiryAlerts.enabled ||
                !preferences.expiryAlerts.dailyReminder
              }
            />
          </View>

          {/* Meal Suggestions */}
          <View style={[styles.section, { backgroundColor: surfaceColor }]}>
            <SectionHeader
              title="Meal Suggestions"
              icon="restaurant"
              enabled={preferences.mealSuggestions.enabled}
              onToggle={(enabled) =>
                updatePreference("mealSuggestions", "enabled", enabled)
              }
            />

            <SettingRow
              label="Breakfast Suggestions"
              description="Get breakfast ideas using expiring items"
              value={preferences.mealSuggestions.breakfast}
              onToggle={(value) =>
                updatePreference("mealSuggestions", "breakfast", value)
              }
              disabled={!preferences.mealSuggestions.enabled}
            />

            <SettingRow
              label="Lunch Suggestions"
              description="Get lunch ideas using expiring items"
              value={preferences.mealSuggestions.lunch}
              onToggle={(value) =>
                updatePreference("mealSuggestions", "lunch", value)
              }
              disabled={!preferences.mealSuggestions.enabled}
            />

            <SettingRow
              label="Dinner Suggestions"
              description="Get dinner ideas using expiring items"
              value={preferences.mealSuggestions.dinner}
              onToggle={(value) =>
                updatePreference("mealSuggestions", "dinner", value)
              }
              disabled={!preferences.mealSuggestions.enabled}
            />

            <NumberInput
              label="Suggest before meal (minutes)"
              value={preferences.mealSuggestions.beforeMealMinutes}
              onChangeValue={(value) =>
                updatePreference("mealSuggestions", "beforeMealMinutes", value)
              }
              min={15}
              max={120}
              disabled={!preferences.mealSuggestions.enabled}
            />
          </View>

          {/* Shopping Reminders */}
          <View style={[styles.section, { backgroundColor: surfaceColor }]}>
            <SectionHeader
              title="Shopping Reminders"
              icon="bag"
              enabled={preferences.shoppingReminders.enabled}
              onToggle={(enabled) =>
                updatePreference("shoppingReminders", "enabled", enabled)
              }
            />

            <NumberInput
              label="Low Stock Threshold"
              value={preferences.shoppingReminders.lowStockThreshold}
              onChangeValue={(value) =>
                updatePreference(
                  "shoppingReminders",
                  "lowStockThreshold",
                  value
                )
              }
              min={1}
              max={10}
              disabled={!preferences.shoppingReminders.enabled}
            />

            <SettingRow
              label="Weekly Shopping Reminder"
              description="Get reminded to go shopping weekly"
              value={preferences.shoppingReminders.weeklyReminder}
              onToggle={(value) =>
                updatePreference("shoppingReminders", "weeklyReminder", value)
              }
              disabled={!preferences.shoppingReminders.enabled}
            />

            <DaySelector
              label="Reminder Day"
              selectedDay={preferences.shoppingReminders.reminderDay}
              onSelectDay={(day) =>
                updatePreference("shoppingReminders", "reminderDay", day)
              }
              disabled={
                !preferences.shoppingReminders.enabled ||
                !preferences.shoppingReminders.weeklyReminder
              }
            />
          </View>

          {/* Waste Reduction */}
          <View style={[styles.section, { backgroundColor: surfaceColor }]}>
            <SectionHeader
              title="Waste Reduction"
              icon="leaf"
              enabled={preferences.wasteReduction.enabled}
              onToggle={(enabled) =>
                updatePreference("wasteReduction", "enabled", enabled)
              }
            />

            <SettingRow
              label="Aggressive Mode"
              description="Get more frequent notifications when waste risk is high"
              value={preferences.wasteReduction.aggressiveMode}
              onToggle={(value) =>
                updatePreference("wasteReduction", "aggressiveMode", value)
              }
              disabled={!preferences.wasteReduction.enabled}
            />
          </View>

          {/* Quiet Hours */}
          <View style={[styles.section, { backgroundColor: surfaceColor }]}>
            <SectionHeader
              title="Quiet Hours"
              icon="moon"
              enabled={preferences.quietHours.enabled}
              onToggle={(enabled) =>
                updatePreference("quietHours", "enabled", enabled)
              }
            />

            <TimeInput
              label="Start Time"
              value={preferences.quietHours.startTime}
              onChangeText={(value) =>
                updatePreference("quietHours", "startTime", value)
              }
              disabled={!preferences.quietHours.enabled}
            />

            <TimeInput
              label="End Time"
              value={preferences.quietHours.endTime}
              onChangeText={(value) =>
                updatePreference("quietHours", "endTime", value)
              }
              disabled={!preferences.quietHours.enabled}
            />
          </View>
        </>
      )}

      {/* Test Notification */}
      <View style={[styles.testSection, { backgroundColor: surfaceColor }]}>
        <TouchableOpacity
          style={[styles.testButton, { backgroundColor: primaryColor }]}
          onPress={async () => {
            try {
              await Notifications.scheduleNotificationAsync({
                content: {
                  title: "🧪 Test Notification",
                  body: "This is a test notification to check your settings.",
                },
                trigger: {
                  type: Notifications.SchedulableTriggerInputTypes
                    .TIME_INTERVAL,
                  seconds: 1,
                  repeats: false,
                } as Notifications.TimeIntervalTriggerInput,
              });
              Alert.alert("Success", "Test notification sent!");
            } catch (error) {
              Alert.alert("Error", "Failed to send test notification");
            }
          }}
          disabled={saving || !preferences.enabled}
        >
          <Ionicons name="send" size={16} color="#FFFFFF" />
          <Text style={styles.testButtonText}>Send Test Notification</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    opacity: 0.7,
  },
  masterSection: {
    padding: 16,
    margin: 16,
    borderRadius: 12,
  },
  masterDescription: {
    fontSize: 14,
    opacity: 0.8,
    marginTop: 8,
    lineHeight: 20,
  },
  section: {
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  settingContent: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 18,
  },
  timeInputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  timeInputLabel: {
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
  },
  timeInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    textAlign: "center",
    minWidth: 80,
  },
  numberInputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  numberInputLabel: {
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
  },
  numberInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  numberButton: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
  },
  numberValue: {
    fontSize: 16,
    fontWeight: "600",
    minWidth: 30,
    textAlign: "center",
  },
  daySelectorRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  daySelectorLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  dayButtons: {
    flexDirection: "row",
    gap: 6,
  },
  dayButton: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    minWidth: 36,
    alignItems: "center",
  },
  dayButtonText: {
    fontSize: 12,
    fontWeight: "500",
  },
  testSection: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  testButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  testButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default NotificationPreferencesPanel;
