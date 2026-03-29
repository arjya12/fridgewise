import SafeAreaWrapper from "@/components/SafeAreaWrapper";
import { SettingsConfirmModal } from "@/components/SettingsConfirmModal";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import {
  clearAllAppData,
  deleteUserAccount,
} from "@/services/accountDataService";
import { Ionicons } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from "react-native";

type SettingsDataModal =
  | null
  | { key: "signIn"; intent: "clear" | "delete" }
  | { key: "clear" }
  | { key: "clearOk" }
  | { key: "clearErr"; message: string }
  | { key: "delete1" }
  | { key: "delete2" }
  | { key: "deleteErr"; message: string };

type DataBusyOp = false | "clear" | "delete";

type ToggleRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  primaryColor: string;
  subTextColor: string;
};

function ToggleRow({
  icon,
  title,
  description,
  value,
  onValueChange,
  primaryColor,
  subTextColor,
}: ToggleRowProps) {
  return (
    <View style={styles.settingItem}>
      <View style={styles.settingIconContainer}>
        <Ionicons name={icon} size={19} color="#16A34A" />
      </View>
      <View style={styles.settingContent}>
        <ThemedText style={styles.settingTitle}>{title}</ThemedText>
        <ThemedText style={[styles.settingDescription, { color: subTextColor }]}>
          {description}
        </ThemedText>
      </View>
      <View style={styles.toggleShell}>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: "#D4D4D8", true: primaryColor }}
          thumbColor="#FFFFFF"
          ios_backgroundColor="#D4D4D8"
        />
      </View>
    </View>
  );
}

type ActionRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  onPress: () => void;
  subTextColor: string;
  isDanger?: boolean;
};

function ActionRow({
  icon,
  title,
  description,
  onPress,
  subTextColor,
  isDanger = false,
}: ActionRowProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.settingItem, pressed && styles.rowPressed]}>
      <View style={styles.settingIconContainer}>
        <Ionicons name={icon} size={19} color={isDanger ? "#DC2626" : "#16A34A"} />
      </View>
      <View style={styles.settingContent}>
        <ThemedText style={[styles.settingTitle, isDanger ? styles.settingTitleDanger : null]}>
          {title}
        </ThemedText>
        {description ? (
          <ThemedText style={[styles.settingDescription, { color: subTextColor }]}>
            {description}
          </ThemedText>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color="#16A34A" />
    </Pressable>
  );
}

export default function SettingsScreen() {
  const cardBackgroundColor = "#FFFFFF";
  const cardBorderColor = "#F3F4F6";
  const subTextColor = "#6B7280";
  const primaryColor = "#22C55E";
  const tabBarHeight = (useBottomTabBarHeight() as unknown as number) || 24;

  const {
    expiryAlerts,
    setExpiryAlerts,
    lowStockAlerts,
    setLowStockAlerts,
    reloadSettingsFromStorage,
  } = useSettings();
  const { user } = useAuth();
  const [showChangeEmailSoon, setShowChangeEmailSoon] = useState(false);
  const [showExportSoon, setShowExportSoon] = useState(false);
  const [dataBusy, setDataBusy] = useState<DataBusyOp>(false);
  const [dataModal, setDataModal] = useState<SettingsDataModal>(null);

  const closeDataModal = useCallback(() => setDataModal(null), []);
  const anyDataBusy = dataBusy !== false;

  useEffect(() => {
    if (!showChangeEmailSoon) return;
    const timer = setTimeout(() => setShowChangeEmailSoon(false), 2600);
    return () => clearTimeout(timer);
  }, [showChangeEmailSoon]);

  useEffect(() => {
    if (!showExportSoon) return;
    const timer = setTimeout(() => setShowExportSoon(false), 2600);
    return () => clearTimeout(timer);
  }, [showExportSoon]);

  const runClearAllData = () => {
    if (!user?.id) {
      setDataModal({ key: "signIn", intent: "clear" });
      return;
    }
    setDataModal({ key: "clear" });
  };

  const runDeleteAccount = () => {
    if (!user?.id) {
      setDataModal({ key: "signIn", intent: "delete" });
      return;
    }
    setDataModal({ key: "delete1" });
  };

  const renderSettingsDataModal = () => {
    if (!dataModal) return null;
    switch (dataModal.key) {
      case "signIn":
        return (
          <SettingsConfirmModal
            visible
            title="Sign in required"
            message={
              dataModal.intent === "clear"
                ? "Sign in to clear your data."
                : "Sign in to delete your account."
            }
            primaryLabel="OK"
            onPrimary={closeDataModal}
            onRequestClose={closeDataModal}
          />
        );
      case "clear":
        return (
          <SettingsConfirmModal
            visible
            title="Clear all data?"
            message="Removes inventory, history, groceries, and cache. Settings stay; you stay signed in."
            primaryLabel="Clear"
            primaryVariant="danger"
            onPrimary={async () => {
              if (!user?.id) return;
              setDataBusy("clear");
              try {
                await clearAllAppData(user.id);
                await reloadSettingsFromStorage();
                setDataModal({ key: "clearOk" });
              } catch (e) {
                setDataModal({
                  key: "clearErr",
                  message: e instanceof Error ? e.message : "Something went wrong.",
                });
              } finally {
                setDataBusy(false);
              }
            }}
            onSecondary={closeDataModal}
            busy={dataBusy === "clear"}
            onRequestClose={dataBusy === "clear" ? () => {} : closeDataModal}
          />
        );
      case "clearOk":
        return (
          <SettingsConfirmModal
            visible
            title="Data cleared"
            message="Your Fridgewise data was removed. Settings on this device are unchanged."
            hideFooter
            showHeaderClose
            headerCloseColor="#15803D"
            autoDismissMs={5000}
            onRequestClose={closeDataModal}
          />
        );
      case "clearErr":
        return (
          <SettingsConfirmModal
            visible
            title="Could not clear data"
            message={dataModal.message}
            primaryLabel="OK"
            onPrimary={closeDataModal}
            onRequestClose={closeDataModal}
          />
        );
      case "delete1":
        return (
          <SettingsConfirmModal
            visible
            title="Delete account?"
            message="Deletes your profile and data, then signs you out. Contact support to remove your login completely."
            primaryLabel="Continue"
            primaryVariant="dangerOutline"
            onPrimary={() => setDataModal({ key: "delete2" })}
            onSecondary={closeDataModal}
            onRequestClose={closeDataModal}
          />
        );
      case "delete2":
        return (
          <SettingsConfirmModal
            visible
            accent="destructive"
            title="Delete permanently?"
            message="Your profile and app data will be removed. You can't undo this."
            primaryLabel="Delete account"
            primaryVariant="danger"
            onPrimary={async () => {
              if (!user?.id) return;
              setDataBusy("delete");
              try {
                await deleteUserAccount(user.id);
                setDataModal(null);
                router.replace("/(auth)/welcome");
              } catch (e) {
                setDataModal({
                  key: "deleteErr",
                  message: e instanceof Error ? e.message : "Something went wrong.",
                });
              } finally {
                setDataBusy(false);
              }
            }}
            onSecondary={closeDataModal}
            busy={dataBusy === "delete"}
            onRequestClose={dataBusy === "delete" ? () => {} : closeDataModal}
          />
        );
      case "deleteErr":
        return (
          <SettingsConfirmModal
            visible
            title="Could not delete account"
            message={dataModal.message}
            primaryLabel="OK"
            onPrimary={closeDataModal}
            onRequestClose={closeDataModal}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaWrapper usePadding edges={["top"]}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.replace("/(tabs)/more")}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={21} color="#15803D" />
          </Pressable>
          <ThemedText style={styles.headerTitle}>Settings</ThemedText>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: tabBarHeight + 26 },
          ]}
        >
          <View style={styles.sectionTitleWrap}>
            <ThemedText style={styles.sectionTitle}>Account Security</ThemedText>
          </View>
          <View
            style={[
              styles.section,
              { backgroundColor: cardBackgroundColor, borderColor: cardBorderColor },
            ]}
          >
            <Pressable
              onPress={() => setShowChangeEmailSoon((prev) => !prev)}
              style={({ pressed }) => [styles.settingItem, pressed && styles.rowPressed]}
            >
              <View style={styles.settingIconContainer}>
                <Ionicons name="mail-outline" size={19} color="#16A34A" />
              </View>
              <View style={styles.settingContent}>
                <ThemedText style={styles.settingTitle}>Change Email</ThemedText>
              </View>
              <Ionicons
                name={showChangeEmailSoon ? "chevron-down" : "chevron-forward"}
                size={18}
                color="#16A34A"
              />
            </Pressable>
            {showChangeEmailSoon ? (
              <View style={styles.changeEmailSoonWrap}>
                <View style={styles.changeEmailSoonSeparator} />
                <View style={styles.changeEmailSoonPill}>
                  <ThemedText style={styles.changeEmailSoonText}>Coming soon</ThemedText>
                </View>
              </View>
            ) : null}
            <View style={styles.settingsSeparator} />
            <ActionRow
              icon="key-outline"
              title="Change Password"
              onPress={() => router.push("/(auth)/change-password")}
              subTextColor={subTextColor}
            />
          </View>

          <View style={styles.sectionTitleWrap}>
            <ThemedText style={styles.sectionTitle}>Notifications</ThemedText>
          </View>
          <View
            style={[
              styles.section,
              { backgroundColor: cardBackgroundColor, borderColor: cardBorderColor },
            ]}
          >
            <ToggleRow
              icon="timer-outline"
              title="Expiry Alerts"
              description="Get alerts before items expire"
              value={expiryAlerts}
              onValueChange={setExpiryAlerts}
              primaryColor={primaryColor}
              subTextColor={subTextColor}
            />
            <View style={styles.settingsSeparator} />
            <ToggleRow
              icon="basket-outline"
              title="Grocery Reminders"
              description="Reminders for items to buy"
              value={lowStockAlerts}
              onValueChange={setLowStockAlerts}
              primaryColor={primaryColor}
              subTextColor={subTextColor}
            />
          </View>

          <View style={styles.sectionTitleWrap}>
            <ThemedText style={styles.sectionTitle}>Data</ThemedText>
          </View>
          <View
            style={[
              styles.section,
              { backgroundColor: cardBackgroundColor, borderColor: cardBorderColor },
            ]}
          >
            <Pressable
              onPress={() => setShowExportSoon((prev) => !prev)}
              style={({ pressed }) => [styles.settingItem, pressed && styles.rowPressed]}
            >
              <View style={styles.settingIconContainer}>
                <Ionicons name="download-outline" size={19} color="#16A34A" />
              </View>
              <View style={styles.settingContent}>
                <ThemedText style={styles.settingTitle}>Export My Data</ThemedText>
                <ThemedText style={[styles.settingDescription, { color: subTextColor }]}>
                  Download a copy of your data
                </ThemedText>
              </View>
              <Ionicons
                name={showExportSoon ? "chevron-down" : "chevron-forward"}
                size={18}
                color="#16A34A"
              />
            </Pressable>
            {showExportSoon ? (
              <View style={styles.changeEmailSoonWrap}>
                <View style={styles.changeEmailSoonSeparator} />
                <View style={styles.changeEmailSoonPill}>
                  <ThemedText style={styles.changeEmailSoonText}>Coming soon</ThemedText>
                </View>
              </View>
            ) : null}
            <View style={styles.settingsSeparator} />
            <Pressable
              onPress={runClearAllData}
              disabled={anyDataBusy}
              style={({ pressed }) => [
                styles.settingItem,
                pressed && styles.rowPressed,
                anyDataBusy && styles.rowDisabled,
              ]}
            >
              <View style={styles.settingIconContainer}>
                <Ionicons name="trash-bin-outline" size={19} color="#16A34A" />
              </View>
              <View style={styles.settingContent}>
                <ThemedText style={styles.settingTitle}>Clear All Data</ThemedText>
                <ThemedText style={[styles.settingDescription, { color: subTextColor }]}>
                  Remove all existing data
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#16A34A" />
            </Pressable>
            <View style={styles.settingsSeparator} />
            <Pressable
              onPress={runDeleteAccount}
              disabled={anyDataBusy}
              style={({ pressed }) => [
                styles.settingItem,
                pressed && styles.rowPressed,
                anyDataBusy && styles.rowDisabled,
              ]}
            >
              <View style={styles.settingIconContainer}>
                <Ionicons name="alert-circle-outline" size={19} color="#DC2626" />
              </View>
              <View style={styles.settingContent}>
                <ThemedText style={[styles.settingTitle, styles.settingTitleDanger]}>
                  Delete Account
                </ThemedText>
                <ThemedText style={[styles.settingDescription, { color: subTextColor }]}>
                  Permanently delete your account and all data
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#16A34A" />
            </Pressable>
          </View>
        </ScrollView>
      </ThemedView>
      {renderSettingsDataModal()}
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 10,
    position: "relative",
  },
  backButton: {
    position: "absolute",
    left: 18,
    top: 8,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: "PlusJakartaSans_700Bold",
    fontWeight: "700",
    color: "#15803D",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 34,
    paddingTop: 6,
  },
  section: {
    borderRadius: 14,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionTitleWrap: {
    paddingLeft: 4,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#15803D",
    letterSpacing: 0.1,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  settingIconContainer: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
    paddingRight: 10,
  },
  settingTitle: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  settingTitleDanger: {
    color: "#B91C1C",
  },
  settingDescription: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_500Medium",
    fontWeight: "500",
  },
  settingsSeparator: {
    height: 1,
    marginHorizontal: 16,
    backgroundColor: "#E5E7EB",
  },
  toggleShell: {
    paddingLeft: 6,
  },
  rowPressed: {
    opacity: 0.78,
  },
  rowDisabled: {
    opacity: 0.55,
  },
  changeEmailSoonWrap: {
    width: "100%",
    alignItems: "center",
    marginTop: 0,
    marginBottom: 8,
  },
  changeEmailSoonSeparator: {
    width: "92%",
    height: 1,
    backgroundColor: "#F1F5F9",
    marginBottom: 8,
  },
  changeEmailSoonPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#F3F4F6",
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  changeEmailSoonText: {
    fontSize: 11,
    color: "#4B5563",
    fontWeight: "600",
  },
});
