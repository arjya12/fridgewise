/**
 * More Screen
 * Consolidates secondary features and administrative functions
 * Provides access to Settings, Reports, Help, and other features
 */

import SafeAreaWrapper from "@/components/SafeAreaWrapper";
import { OfflineNoticeModal } from "@/components/OfflineNoticeModal";
import { SettingsConfirmModal } from "@/components/SettingsConfirmModal";
import { ThemedView } from "@/components/ThemedView";
import { useAuth } from "@/contexts/AuthContext";
import { isNetworkRequestFailed } from "@/utils/networkError";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  CaretRight,
  ChatCircleDots,
  Gear,
  Info,
  SignOut,
} from "phosphor-react-native";
import { supabase } from "@/lib/supabase";

// =============================================================================
// INTERFACES
// =============================================================================

interface MenuSection {
  title: string;
  items: MenuItem[];
}

interface MenuItem {
  id: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  action: () => void;
  showChevron?: boolean;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function MoreScreen() {
  const { user, userProfile, signOut } = useAuth();

  // Light theme — phone background + white surfaces
  const backgroundColor = "#FFFFFF";
  const cardBackgroundColor = "#FFFFFF";
  const surface2 = "#F0F0F0";
  const textColor = "#1A1A18";
  const subTextColor = "#AEADA6";

  // Accent colors for unified Phosphor styling
  const accentLight = "#EAF7F0";
  const accentDark = "#2a9960";
  const accent = "#3DBF7A";
  const textMuted = "#AEADA6";
  const borderColor = "rgba(0,0,0,0.07)";
  const danger = "#C0483A";

  const liveDisplayName = userProfile?.full_name || user?.email || "Your Name";
  const liveInitials = (() => {
    const parts = (liveDisplayName || "").trim().split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? "";
    const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
    return (first + last).toUpperCase();
  })();

  // Stats (All-time, pantry-only)
  const [statsLoading, setStatsLoading] = useState(true);
  const [totalItemsAdded, setTotalItemsAdded] = useState<number | null>(null);
  const [topCategory, setTopCategory] = useState<string | null>(null);
  /** After first successful fetch, refocus (e.g. back from Settings) refreshes without "Loading…" */
  const insightsStatsReadyRef = useRef(false);

  const [signOutModalVisible, setSignOutModalVisible] = useState(false);
  const [signOutBusy, setSignOutBusy] = useState(false);
  const [offlineNoticeVisible, setOfflineNoticeVisible] = useState(false);
  const frozenDisplayNameRef = useRef(liveDisplayName);
  const frozenInitialsRef = useRef(liveInitials);
  const frozenStatsRef = useRef({
    totalItemsAdded: null as number | null,
    topCategory: null as string | null,
    statsLoading: true,
  });

  const displayName = signOutBusy ? frozenDisplayNameRef.current : liveDisplayName;
  const initials = signOutBusy ? frozenInitialsRef.current : liveInitials;
  const visibleTotalItemsAdded = signOutBusy
    ? frozenStatsRef.current.totalItemsAdded
    : totalItemsAdded;
  const visibleTopCategory = signOutBusy
    ? frozenStatsRef.current.topCategory
    : topCategory;
  const visibleStatsLoading = signOutBusy
    ? frozenStatsRef.current.statsLoading
    : statsLoading;

  useEffect(() => {
    if (signOutBusy) return;
    frozenDisplayNameRef.current = liveDisplayName;
    frozenInitialsRef.current = liveInitials;
  }, [liveDisplayName, liveInitials, signOutBusy]);

  useEffect(() => {
    if (signOutBusy) return;
    frozenStatsRef.current = {
      totalItemsAdded,
      topCategory,
      statsLoading,
    };
  }, [totalItemsAdded, topCategory, statsLoading, signOutBusy]);

  useEffect(() => {
    if (signOutBusy) return;
    insightsStatsReadyRef.current = false;
    setTotalItemsAdded(null);
    setTopCategory(null);
    setStatsLoading(!!user);
  }, [user?.id, signOutBusy]);


  // =============================================================================
  // NAVIGATION ACTIONS
  // =============================================================================

  const navigateToSettings = useCallback(() => {
    router.push("/(tabs)/settings");
  }, []);

  const navigateToProfile = useCallback(() => {
    router.push("/(tabs)/profile");
  }, []);

  const generateWasteReport = useCallback(() => {
    router.push("/(tabs)/waste-report");
  }, []);

  const generateConsumptionReport = useCallback(() => {
    router.push("/(tabs)/consumption-report");
  }, []);

  const navigateToAbout = useCallback(() => {
    router.push("/(tabs)/about");
  }, []);

  const contactSupport = useCallback(() => {
    router.push("/(legal)/contact");
  }, []);

  const handleSignOut = () => setSignOutModalVisible(true);

  const confirmSignOut = async () => {
    setSignOutBusy(true);
    try {
      await signOut();
      setSignOutModalVisible(false);
      router.replace("/(auth)/welcome");
    } catch (error) {
      if (isNetworkRequestFailed(error)) {
        setSignOutModalVisible(false);
        setOfflineNoticeVisible(true);
        return;
      }

      if (__DEV__) {
        console.error("Sign out error");
      }
      Alert.alert("Error", "Failed to sign out. Please try again.");
    } finally {
      setSignOutBusy(false);
    }
  };

  const loadInsightsStats = useCallback(async () => {
    if (!user) {
      if (!signOutBusy) setStatsLoading(false);
      return;
    }
    const showLoading = !insightsStatsReadyRef.current;
    try {
      if (showLoading) setStatsLoading(true);

      const [
        { data: activeRows, error: activeRowsErr },
        { data: usageRows, error: usageRowsErr },
      ] = await Promise.all([
        supabase
          .from("food_items")
          .select("id, category, quantity")
          .eq("user_id", user.id)
          .gt("quantity", 0),
        supabase
          .from("usage_logs")
          .select(
            `
            item_id,
            status,
            food_items!usage_logs_item_id_fkey (
              category
            )
          `
          )
          .eq("user_id", user.id)
          .in("status", ["used", "wasted"]),
      ]);

      if (activeRowsErr) throw activeRowsErr;
      if (usageRowsErr) throw usageRowsErr;

      const categoryTotals: Record<string, { label: string; count: number }> = {};
      const addCategoryCount = (category: unknown) => {
        const raw = typeof category === "string" ? category.trim() : "";
        if (!raw) return;
        const key = raw.toLowerCase();
        if (!categoryTotals[key]) {
          categoryTotals[key] = { label: raw, count: 0 };
        }
        categoryTotals[key]!.count += 1;
      };

      const seenItemIds = new Set<string>();

      (activeRows ?? []).forEach((r: any) => {
        const itemId = typeof r?.id === "string" ? r.id : String(r?.id ?? "");
        if (!itemId) return;
        const qtyRaw = Number(r?.quantity ?? 0);
        const qty = Number.isFinite(qtyRaw) ? Math.max(0, qtyRaw) : 0;
        if (!qty) return;
        if (seenItemIds.has(itemId)) return;
        seenItemIds.add(itemId);
        addCategoryCount(r?.category);
      });

      (usageRows ?? []).forEach((r: any) => {
        if (!r?.food_items) return;
        const itemId =
          typeof r?.item_id === "string" ? r.item_id : String(r?.item_id ?? "");
        if (!itemId) return;
        if (seenItemIds.has(itemId)) return;
        seenItemIds.add(itemId);
        addCategoryCount(r?.food_items?.category);
      });

      setTotalItemsAdded(seenItemIds.size);

      const top = Object.values(categoryTotals).sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return a.label.localeCompare(b.label);
      })[0];
      setTopCategory(top?.label ?? null);
      insightsStatsReadyRef.current = true;
    } catch (e) {
      console.warn("More stats load failed", e);
      setTotalItemsAdded(null);
      setTopCategory(null);
      insightsStatsReadyRef.current = false;
    } finally {
      setStatsLoading(false);
    }
  }, [user?.id, signOutBusy]);

  useEffect(() => {
    void loadInsightsStats();
  }, [loadInsightsStats]);

  useFocusEffect(
    useCallback(() => {
      void loadInsightsStats();
    }, [loadInsightsStats])
  );

  // =============================================================================
  // MENU CONFIGURATION
  // =============================================================================

  const menuSections: MenuSection[] = [
    {
      title: "Account",
      items: [
        {
          id: "settings",
          title: "Settings",
          description: "App preferences & configuration",
          icon: <Gear size={20} weight="bold" color={accentDark} />,
          action: navigateToSettings,
          showChevron: true,
        },
      ],
    },
    {
      title: "Insights",
      items: [
        {
          id: "waste-report",
          title: "Waste Report",
          description: "See what was discarded and when",
          action: generateWasteReport,
          showChevron: true,
        },
        {
          id: "consumption-report",
          title: "Consumption Report",
          description: "Track what you use most often",
          action: generateConsumptionReport,
          showChevron: true,
        },
      ],
    },
    {
      title: "Support & Info",
      items: [
        {
          id: "contact-support",
          title: "Contact Support",
          description: "Get help from our team",
          icon: <ChatCircleDots size={20} weight="bold" color={accentDark} />,
          action: contactSupport,
          showChevron: true,
        },
        {
          id: "about",
          title: "About",
          description: "App details & legal",
          icon: <Info size={20} weight="bold" color={accentDark} />,
          action: navigateToAbout,
          showChevron: true,
        },
      ],
    },
  ];

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================

  const renderMenuItem = (item: MenuItem, index: number) => (
    <View key={item.id}>
      {index > 0 && <View style={styles.menuDivider} />}

      <Pressable
        onPress={item.action}
        style={({ pressed }) => [
          styles.menuItemRow,
          pressed ? { backgroundColor: surface2 } : null,
        ]}
      >
        <View style={styles.menuItemContent}>
          {item.icon ? <View style={styles.iconWrap}>{item.icon}</View> : null}

          <View style={styles.itemText}>
            <Text
              style={[
                styles.itemLabel,
                (item.id === "waste-report" || item.id === "consumption-report") &&
                  styles.reportItemLabel,
              ]}
            >
              {item.title}
            </Text>
            <Text
              style={[
                styles.itemSub,
                (item.id === "waste-report" || item.id === "consumption-report") &&
                  styles.reportItemSub,
              ]}
            >
              {item.description}
            </Text>
          </View>

          {item.showChevron && (
            <CaretRight size={16} color={accentDark} weight="bold" />
          )}
        </View>
      </Pressable>
    </View>
  );

  const renderStatsCards = () => {
    const itemsAddedValue =
      visibleTotalItemsAdded == null
        ? visibleStatsLoading
          ? "Loading…"
          : "—"
        : String(visibleTotalItemsAdded);

    return (
      <View style={styles.statsGrid}>
        <View style={[styles.statCardWide, styles.statCardCount]}>
          <Text style={[styles.statValue, styles.statValueLarge, styles.statValueOnGreen]}>
            {itemsAddedValue}
          </Text>
          <View style={[styles.statPill, styles.statPillCentered, styles.statPillGreenSolid]}>
            <Text style={[styles.statPillText, styles.statPillTextWhite]}>
              Items Added
            </Text>
          </View>
        </View>

        <View style={[styles.statCardWide, styles.statCardCategory]}>
          <View
            style={[
              styles.statPill,
              styles.statPillCentered,
              styles.statPillGreenSolid,
              styles.statPillTopCategory,
            ]}
          >
            <Text style={[styles.statPillText, styles.statPillTextWhite, styles.statPillTextTopCategory]}>
              Top Category
            </Text>
          </View>
          {visibleStatsLoading ? (
            <Text style={[styles.statValue, styles.statValueCategory]}>Loading…</Text>
          ) : visibleTopCategory ? (
            <Text style={[styles.statValue, styles.statValueCategory]} numberOfLines={2}>
              {visibleTopCategory}
            </Text>
          ) : null}
        </View>
      </View>
    );
  };

  const renderSection = (section: MenuSection) => (
    <View key={section.title} style={styles.section}>
      {section.title ? (
        <Text
          style={
            section.title === "Insights"
              ? styles.sectionLabelInsights
              : styles.sectionLabel
          }
        >
          {section.title}
        </Text>
      ) : null}

      {section.title === "Insights" && renderStatsCards()}

      {section.items.length > 0 && (
        <View style={styles.cardGroup}>
          {section.items.map((item, index) => renderMenuItem(item, index))}
        </View>
      )}
    </View>
  );

  const renderSignOutCard = () => (
    <Pressable
      onPress={handleSignOut}
      style={({ pressed }) => [
        styles.signOutBtn,
        pressed ? { opacity: 0.88, transform: [{ scale: 0.98 }] } : null,
      ]}
    >
      <View style={styles.signOutIconWrap}>
        <SignOut size={18} weight="bold" color="#FFFFFF" />
      </View>
      <Text style={styles.signOutText}>Sign Out</Text>
    </Pressable>
  );

  return (
    <SafeAreaWrapper usePadding edges={[]}>
      <ThemedView style={[styles.container, { backgroundColor }]}>
        <View style={styles.content}>
          <View style={styles.headerFloating}>
            <Pressable
              onPress={navigateToProfile}
              style={({ pressed }) => [
                styles.profileCard,
                pressed ? { transform: [{ scale: 0.98 }] } : null,
              ]}
            >
              <View style={styles.profileCardInner}>
                <View style={styles.avatar}>
                  <LinearGradient
                    colors={[accent, accentDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.avatarGradient}
                  >
                    <Text style={styles.avatarText}>{initials || "?"}</Text>
                  </LinearGradient>
                </View>

                <View style={styles.profileInfo}>
                  <Text style={styles.profileName} numberOfLines={1}>
                    {displayName}
                  </Text>
                  <Text style={styles.profileSubtitle}>
                    View and edit your details
                  </Text>
                </View>

                <CaretRight size={16} weight="bold" color={accentDark} />
              </View>
            </Pressable>
          </View>

          {menuSections.map(renderSection)}

          {/* Sign Out Button + version */}
          {!signOutModalVisible && (
            <View style={styles.signOutSection}>{renderSignOutCard()}</View>
          )}
          <Text style={styles.versionText}>v1.0.0 · FridgeWise</Text>
        </View>
      </ThemedView>
      <SettingsConfirmModal
        visible={signOutModalVisible}
        title="Are you sure?"
        message="You’ll need to sign in again to access your account."
        primaryLabel="Sign out"
        primaryVariant="danger"
        onPrimary={confirmSignOut}
        secondaryLabel="Cancel"
        onSecondary={() => setSignOutModalVisible(false)}
        busy={signOutBusy}
        onRequestClose={signOutBusy ? () => {} : () => setSignOutModalVisible(false)}
      />
      <OfflineNoticeModal
        visible={offlineNoticeVisible}
        onDismiss={() => setOfflineNoticeVisible(false)}
      />
    </SafeAreaWrapper>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingBottom: 22,
  },
  headerFloating: {
    marginTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 4,
    zIndex: 10,
    elevation: 10,
  },
  profileCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.18)",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 9,
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  profileCardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  profileHeaderLeftCol: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  profileHeaderChevron: {
    width: 24,
    alignItems: "center",
    alignSelf: "center",
    marginTop: -2,
  },
  profileCardName: {
    fontSize: 16,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#1B5C3A",
    letterSpacing: -0.3,
    maxWidth: 220,
  },
  profileCardSubtitle: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "600",
  },

  profileIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  profileInitials: {
    fontSize: 13,
    fontWeight: "900",
  },
  profileName: {
    fontSize: 15,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: "#1A1A18",
    letterSpacing: -0.1,
    maxWidth: 240,
  },
  profileSubtitle: {
    marginTop: 1,
    fontSize: 12,
    fontWeight: "500",
    color: "#AEADA6",
    lineHeight: 16,
  },
  section: {
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 0,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 2,
    opacity: 0.92,
  },
  sectionCards: {
    gap: 8,
  },
  menuCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2a8a60",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: "#14532D",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  signOutSection: {
    paddingTop: 14,
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  signOutCard: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: "#14532D",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  menuItemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    backgroundColor: "transparent",
  },
  menuItemInfo: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 1,
  },
  menuItemDescription: {
    fontSize: 12,
    lineHeight: 16,
  },

  statsGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2a8a60",
    backgroundColor: "#FFFFFF",
    padding: 10,
    shadowColor: "#14532D",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  statText: {
    flex: 1,
  },
  statTitle: {
    fontSize: 13,
    fontWeight: "900",
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
    marginTop: 3,
    lineHeight: 13,
    opacity: 0.8,
  },
  statKicker: {
    fontSize: 24,
    fontFamily: "PlusJakartaSans_700Bold",
    fontWeight: "700",
    color: "#15803D",
    letterSpacing: 0,
    marginBottom: 1,
    textAlign: "center",
    lineHeight: 28,
  },
  statValue: {
    fontSize: 28,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#111827",
    lineHeight: 32,
    letterSpacing: -0.6,
    fontWeight: "700",
  },
  statValueLarge: {
    fontSize: 34,
    lineHeight: 36,
    letterSpacing: -0.9,
  },
  statValueCategory: {
    fontSize: 26,
    lineHeight: 30,
    letterSpacing: -0.35,
    textAlign: "center",
    color: "#147A3C",
    fontFamily: "PlusJakartaSans_700Bold",
    fontWeight: "700",
  },
  statValueOnGreen: {
    color: "#FFFFFF",
  },
  statCaption: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9CA3AF",
    marginTop: 2,
    lineHeight: 13,
    textAlign: "center",
  },
  statCaptionOnGreen: {
    color: "#DCFCE7",
  },
  statSubtitle: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 1,
    lineHeight: 14,
  },
  statPill: {
    alignSelf: "flex-start",
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 0,
  },
  statPillText: {
    fontSize: 10,
    fontWeight: "800",
  },
  statPillCentered: {
    alignSelf: "center",
  },
  statPillOnGreen: {
    backgroundColor: "#FFFFFF",
  },
  statPillTextGreen: {
    color: "#15803D",
  },
  statPillNeutral: {
    backgroundColor: "#ECFDF3",
  },
  statPillGreenSolid: {
    backgroundColor: "#16A34A",
  },
  statPillTextWhite: {
    color: "#FFFFFF",
  },
  statPillTopCategory: {
    paddingHorizontal: 11,
    paddingVertical: 4,
    marginBottom: 6,
  },
  statPillTextTopCategory: {
    fontSize: 12,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#15803D",
    marginBottom: 10,
    paddingLeft: 4,
    letterSpacing: 0.1,
  },
  sectionLabelInsights: {
    fontSize: 15,
    fontWeight: "600",
    color: "#15803D",
    marginBottom: 10,
    paddingLeft: 4,
    letterSpacing: 0.05,
  },
  cardGroup: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    shadowColor: "#000000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    overflow: "hidden",
  },
  menuDivider: {
    height: 1,
    backgroundColor: "rgba(15, 23, 42, 0.08)",
    marginHorizontal: 18,
  },
  menuItemRow: {
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    backgroundColor: "transparent",
  },
  itemText: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A1A18",
    letterSpacing: -0.1,
  },
  itemSub: {
    fontSize: 12,
    color: "#AEADA6",
    marginTop: 1,
    lineHeight: 16,
  },
  reportItemLabel: {
    fontWeight: "700",
    letterSpacing: -0.05,
  },
  reportItemSub: {
    color: "#6B7280",
    marginTop: 2,
  },
  profileCardInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#FFFFFF",
    letterSpacing: 1,
    fontWeight: "700",
  },
  profileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  versionText: {
    textAlign: "center",
    fontSize: 12,
    color: "#AEADA6",
    paddingBottom: 8,
    marginTop: 6,
  },
  signOutBtn: {
    width: "84%",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#C63E2F",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    shadowColor: "#C63E2F",
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  signOutIconWrap: {
    marginRight: 7,
    marginTop: 0,
  },
  signOutText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: -0.1,
  },
  statCardWide: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    shadowOpacity: 0,
    elevation: 0,
    minHeight: 84,
    alignItems: "center",
    justifyContent: "center",
  },
  statCardCount: {
    backgroundColor: "#22C55E",
    borderColor: "#16A34A",
  },
  statCardCategory: {
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(0,0,0,0.08)",
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
});
