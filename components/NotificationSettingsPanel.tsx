// components/NotificationSettingsPanel.tsx
import {
  NotificationSettings,
  smartNotificationService,
} from "@/services/smartNotificationService";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface NotificationSettingsPanelProps {
  visible: boolean;
  onClose: () => void;
  textColor: string;
  backgroundColor: string;
  borderColor: string;
}

export default function NotificationSettingsPanel({
  visible,
  onClose,
  textColor,
  backgroundColor,
  borderColor,
}: NotificationSettingsPanelProps) {
  const [settings, setSettings] = useState<NotificationSettings>(
    smartNotificationService.getSettings()
  );
  const [showTimeSelector, setShowTimeSelector] = useState<{
    visible: boolean;
    type: "start" | "end";
  }>({ visible: false, type: "start" });

  useEffect(() => {
    if (visible) {
      setSettings(smartNotificationService.getSettings());
    }
  }, [visible]);

  const handleSettingChange = async (
    key: keyof NotificationSettings,
    value: any
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    try {
      await smartNotificationService.updateSettings({ [key]: value });
    } catch (error) {
      console.error("Failed to update notification settings:", error);
      Alert.alert("Error", "Failed to update notification settings");
    }
  };

  const handleQuietHourChange = async (
    key: "start" | "end" | "enabled",
    value: any
  ) => {
    const newQuietHours = { ...settings.quietHours, [key]: value };
    const newSettings = { ...settings, quietHours: newQuietHours };
    setSettings(newSettings);

    try {
      await smartNotificationService.updateSettings({
        quietHours: newQuietHours,
      });
    } catch (error) {
      console.error("Failed to update quiet hours:", error);
      Alert.alert("Error", "Failed to update quiet hours settings");
    }
  };

  const requestNotificationPermission = async () => {
    try {
      const success = await smartNotificationService.initialize();
      if (success) {
        Alert.alert("Success", "Notification permissions granted!");
        handleSettingChange("enabled", true);
      } else {
        Alert.alert(
          "Permission Denied",
          "Please enable notifications in your device settings to receive food expiry alerts."
        );
      }
    } catch (error) {
      Alert.alert("Error", "Failed to request notification permission");
    }
  };

  const SettingRow = ({
    icon,
    title,
    description,
    value,
    onToggle,
    disabled = false,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    description?: string;
    value: boolean;
    onToggle: (value: boolean) => void;
    disabled?: boolean;
  }) => (
    <View style={[styles.settingRow, { borderBottomColor: borderColor }]}>
      <View style={styles.settingInfo}>
        <View style={styles.settingHeader}>
          <Ionicons name={icon} size={20} color={textColor} />
          <Text style={[styles.settingTitle, { color: textColor }]}>
            {title}
          </Text>
        </View>
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
        trackColor={{ false: "#E0E0E0", true: "#007AFF" }}
        thumbColor={value ? "#FFFFFF" : "#F4F3F4"}
      />
    </View>
  );

  const FrequencySelector = () => (
    <View style={[styles.settingRow, { borderBottomColor: borderColor }]}>
      <View style={styles.settingInfo}>
        <View style={styles.settingHeader}>
          <Ionicons name="time" size={20} color={textColor} />
          <Text style={[styles.settingTitle, { color: textColor }]}>
            Notification Frequency
          </Text>
        </View>
      </View>
      <View style={styles.frequencyOptions}>
        {(["realtime", "daily", "twice-daily"] as const).map((freq) => (
          <TouchableOpacity
            key={freq}
            style={[
              styles.frequencyOption,
              settings.frequency === freq && styles.frequencyOptionActive,
              { borderColor },
            ]}
            onPress={() => handleSettingChange("frequency", freq)}
          >
            <Text
              style={[
                styles.frequencyText,
                {
                  color: settings.frequency === freq ? "#FFFFFF" : textColor,
                },
              ]}
            >
              {freq === "realtime"
                ? "Real-time"
                : freq === "daily"
                ? "Daily"
                : "Twice Daily"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const QuietHoursSelector = () => (
    <View style={[styles.settingSection, { borderColor }]}>
      <Text style={[styles.sectionTitle, { color: textColor }]}>
        Quiet Hours
      </Text>

      <SettingRow
        icon="moon"
        title="Enable Quiet Hours"
        description="Pause notifications during specified hours"
        value={settings.quietHours.enabled}
        onToggle={(value) => handleQuietHourChange("enabled", value)}
      />

      {settings.quietHours.enabled && (
        <View style={styles.timeSelectors}>
          <TouchableOpacity
            style={[styles.timeSelector, { backgroundColor, borderColor }]}
            onPress={() =>
              setShowTimeSelector({ visible: true, type: "start" })
            }
          >
            <Text style={[styles.timeLabel, { color: textColor }]}>
              Start Time
            </Text>
            <Text style={[styles.timeValue, { color: "#007AFF" }]}>
              {settings.quietHours.start}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.timeSelector, { backgroundColor, borderColor }]}
            onPress={() => setShowTimeSelector({ visible: true, type: "end" })}
          >
            <Text style={[styles.timeLabel, { color: textColor }]}>
              End Time
            </Text>
            <Text style={[styles.timeValue, { color: "#007AFF" }]}>
              {settings.quietHours.end}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: borderColor }]}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textColor }]}>
            Notification Settings
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Master Toggle */}
          <View style={[styles.settingSection, { borderColor }]}>
            <SettingRow
              icon="notifications"
              title="Enable Notifications"
              description="Receive alerts about expiring food items"
              value={settings.enabled}
              onToggle={
                settings.enabled
                  ? (value) => handleSettingChange("enabled", value)
                  : () => requestNotificationPermission()
              }
            />
          </View>

          {settings.enabled && (
            <>
              {/* Expiry Notifications */}
              <View style={[styles.settingSection, { borderColor }]}>
                <Text style={[styles.sectionTitle, { color: textColor }]}>
                  Expiry Alerts
                </Text>

                <SettingRow
                  icon="warning"
                  title="Critical Items"
                  description="Items that expire today or have expired"
                  value={settings.criticalItems}
                  onToggle={(value) =>
                    handleSettingChange("criticalItems", value)
                  }
                />

                <SettingRow
                  icon="alert-circle"
                  title="Warning Items"
                  description="Items expiring in 1-2 days"
                  value={settings.warningItems}
                  onToggle={(value) =>
                    handleSettingChange("warningItems", value)
                  }
                />

                <SettingRow
                  icon="calendar"
                  title="Soon Items"
                  description="Items expiring this week"
                  value={settings.soonItems}
                  onToggle={(value) => handleSettingChange("soonItems", value)}
                />
              </View>

              {/* Meal & Planning */}
              <View style={[styles.settingSection, { borderColor }]}>
                <Text style={[styles.sectionTitle, { color: textColor }]}>
                  Meal Planning
                </Text>

                <SettingRow
                  icon="restaurant"
                  title="Meal Suggestions"
                  description="Recipe ideas based on expiring items"
                  value={settings.mealSuggestions}
                  onToggle={(value) =>
                    handleSettingChange("mealSuggestions", value)
                  }
                />

                <SettingRow
                  icon="sunny"
                  title="Morning Reminder"
                  description="Daily summary of items to check"
                  value={settings.morningReminder}
                  onToggle={(value) =>
                    handleSettingChange("morningReminder", value)
                  }
                />

                <SettingRow
                  icon="moon"
                  title="Evening Planning"
                  description="Plan tomorrow's meals in advance"
                  value={settings.eveningPlanning}
                  onToggle={(value) =>
                    handleSettingChange("eveningPlanning", value)
                  }
                />
              </View>

              {/* Frequency */}
              <View style={[styles.settingSection, { borderColor }]}>
                <Text style={[styles.sectionTitle, { color: textColor }]}>
                  Timing
                </Text>
                <FrequencySelector />
              </View>

              {/* Quiet Hours */}
              <QuietHoursSelector />

              {/* Stats */}
              <View style={[styles.settingSection, { borderColor }]}>
                <Text style={[styles.sectionTitle, { color: textColor }]}>
                  Statistics
                </Text>
                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statLabel, { color: textColor }]}>
                      Notifications Today
                    </Text>
                    <Text style={[styles.statValue, { color: "#007AFF" }]}>
                      12
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statLabel, { color: textColor }]}>
                      Actions Taken
                    </Text>
                    <Text style={[styles.statValue, { color: "#34C759" }]}>
                      8
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statLabel, { color: textColor }]}>
                      Response Rate
                    </Text>
                    <Text style={[styles.statValue, { color: "#007AFF" }]}>
                      67%
                    </Text>
                  </View>
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </View>

      {/* Time Selector Modal */}
      <TimeSelector
        visible={showTimeSelector.visible}
        type={showTimeSelector.type}
        currentTime={
          showTimeSelector.type === "start"
            ? settings.quietHours.start
            : settings.quietHours.end
        }
        onSelect={(time) => {
          handleQuietHourChange(showTimeSelector.type, time);
          setShowTimeSelector({ visible: false, type: "start" });
        }}
        onClose={() => setShowTimeSelector({ visible: false, type: "start" })}
        textColor={textColor}
        backgroundColor={backgroundColor}
        borderColor={borderColor}
      />
    </Modal>
  );
}

// Time Selector Component
interface TimeSelectorProps {
  visible: boolean;
  type: "start" | "end";
  currentTime: string;
  onSelect: (time: string) => void;
  onClose: () => void;
  textColor: string;
  backgroundColor: string;
  borderColor: string;
}

function TimeSelector({
  visible,
  type,
  currentTime,
  onSelect,
  onClose,
  textColor,
  backgroundColor,
  borderColor,
}: TimeSelectorProps) {
  const [selectedHour, setSelectedHour] = useState(
    parseInt(currentTime.split(":")[0])
  );
  const [selectedMinute, setSelectedMinute] = useState(
    parseInt(currentTime.split(":")[1])
  );

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = [0, 15, 30, 45];

  const handleConfirm = () => {
    const timeString = `${selectedHour
      .toString()
      .padStart(2, "0")}:${selectedMinute.toString().padStart(2, "0")}`;
    onSelect(timeString);
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.timeModalOverlay}>
        <View style={[styles.timeModal, { backgroundColor, borderColor }]}>
          <Text style={[styles.timeModalTitle, { color: textColor }]}>
            Select {type === "start" ? "Start" : "End"} Time
          </Text>

          <View style={styles.timePickers}>
            <View style={styles.timePicker}>
              <Text style={[styles.timePickerLabel, { color: textColor }]}>
                Hour
              </Text>
              <ScrollView
                style={styles.timePickerScroll}
                showsVerticalScrollIndicator={false}
              >
                {hours.map((hour) => (
                  <TouchableOpacity
                    key={hour}
                    style={[
                      styles.timeOption,
                      selectedHour === hour && styles.timeOptionSelected,
                    ]}
                    onPress={() => setSelectedHour(hour)}
                  >
                    <Text
                      style={[
                        styles.timeOptionText,
                        {
                          color: selectedHour === hour ? "#FFFFFF" : textColor,
                        },
                      ]}
                    >
                      {hour.toString().padStart(2, "0")}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.timePicker}>
              <Text style={[styles.timePickerLabel, { color: textColor }]}>
                Minute
              </Text>
              <ScrollView
                style={styles.timePickerScroll}
                showsVerticalScrollIndicator={false}
              >
                {minutes.map((minute) => (
                  <TouchableOpacity
                    key={minute}
                    style={[
                      styles.timeOption,
                      selectedMinute === minute && styles.timeOptionSelected,
                    ]}
                    onPress={() => setSelectedMinute(minute)}
                  >
                    <Text
                      style={[
                        styles.timeOptionText,
                        {
                          color:
                            selectedMinute === minute ? "#FFFFFF" : textColor,
                        },
                      ]}
                    >
                      {minute.toString().padStart(2, "0")}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={styles.timeModalActions}>
            <TouchableOpacity
              style={[styles.timeModalButton, { borderColor }]}
              onPress={onClose}
            >
              <Text style={[styles.timeModalButtonText, { color: textColor }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.timeModalButton, styles.timeModalButtonPrimary]}
              onPress={handleConfirm}
            >
              <Text style={styles.timeModalButtonTextPrimary}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  settingSection: {
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
  },
  settingDescription: {
    fontSize: 14,
    opacity: 0.7,
    marginLeft: 28,
  },
  frequencyOptions: {
    flexDirection: "row",
    gap: 8,
  },
  frequencyOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 16,
  },
  frequencyOptionActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  frequencyText: {
    fontSize: 12,
    fontWeight: "500",
  },
  timeSelectors: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  timeSelector: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: "center",
  },
  timeLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 16,
  },
  statItem: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
  },

  // Time Modal Styles
  timeModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  timeModal: {
    width: "80%",
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
  },
  timeModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 20,
  },
  timePickers: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 20,
  },
  timePicker: {
    flex: 1,
  },
  timePickerLabel: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 8,
  },
  timePickerScroll: {
    height: 120,
  },
  timeOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginVertical: 2,
    alignItems: "center",
  },
  timeOptionSelected: {
    backgroundColor: "#007AFF",
  },
  timeOptionText: {
    fontSize: 16,
    fontWeight: "500",
  },
  timeModalActions: {
    flexDirection: "row",
    gap: 12,
  },
  timeModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: "center",
  },
  timeModalButtonPrimary: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  timeModalButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  timeModalButtonTextPrimary: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
});
