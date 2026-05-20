/**
 * Consumption Report — all-time insights, green accent on white.
 */

import { OfflineNoticeModal } from "@/components/OfflineNoticeModal";
import { getReportCategoryIcon } from "@/lib/reportCategoryIcons";
import { useAuth } from "@/contexts/AuthContext";
import { loadConsumptionReportAllTime } from "@/services/insightsReportData";
import { isOfflineLikeError } from "@/utils/networkError";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ArrowLeft } from "phosphor-react-native";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ACCENT = "#3DBF7A";
const BG = "#FFFFFF";
const CARD = "#FFFFFF";
const INK = "#1A1A18";

const goBackToMore = () => {
  router.replace("/(tabs)/more");
};

const heroSerif = Platform.select({
  ios: "Georgia",
  android: "serif",
  default: undefined,
});

export default function ConsumptionReportScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = (useBottomTabBarHeight() as number) || 24;
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<Awaited<
    ReturnType<typeof loadConsumptionReportAllTime>
  > | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [offlineNoticeVisible, setOfflineNoticeVisible] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const d = await loadConsumptionReportAllTime(user.id);
      setData(d);
    } catch (e: unknown) {
      if (isOfflineLikeError(e, { hasAuthenticatedUser: Boolean(user?.id) })) {
        setOfflineNoticeVisible(true);
        setError(null);
      } else {
        console.warn("Consumption report load failed", e);
        setError("Could not load data. Pull to try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      if (!user) {
        router.replace({ pathname: "/(auth)/welcome" });
        return;
      }
      void load();
    }, [user, load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="dark" backgroundColor={BG} />
      <View style={styles.header}>
        <Pressable
          onPress={goBackToMore}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Back to More"
        >
          <ArrowLeft size={22} color={ACCENT} weight="bold" />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Consumption Report
        </Text>
      </View>

      {loading && !data ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={ACCENT} />
          <Text style={styles.loadingLabel}>Loading…</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{
            // Tab bar layout height already includes bottom inset + float gap (EnhancedTabBar).
            paddingBottom: tabBarHeight + 8,
            flexGrow: 1,
            backgroundColor: BG,
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />
          }
          showsVerticalScrollIndicator={false}
        >
          {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

          <View style={styles.hero}>
            <View style={styles.heroRow}>
              <Text style={styles.heroKicker}>TOTAL CONSUMED</Text>
              <Text style={styles.heroValue}>{data?.totalConsumedQty ?? 0}</Text>
            </View>
          </View>

          <View style={styles.pairRow}>
            <View style={styles.smallCard}>
              <Text style={styles.smallKicker}>MOST CONSUMED</Text>
              {data?.mostConsumed ? (
                <Text style={styles.smallPrimary} numberOfLines={2}>
                  <Text
                    style={[
                      styles.mostConsumedName,
                      heroSerif ? { fontFamily: heroSerif } : null,
                    ]}
                  >
                    {data.mostConsumed.name}
                  </Text>
                  <Text style={styles.mostConsumedTimes}> ×{data.mostConsumed.times}</Text>
                </Text>
              ) : (
                <Text style={styles.smallPrimary}>—</Text>
              )}
            </View>
            <View style={styles.smallCard}>
              <Text style={styles.smallKicker}>CONSUME RATE</Text>
              <Text
                style={[styles.smallPrimaryRate, heroSerif ? { fontFamily: heroSerif } : null]}
              >
                {data?.consumeRatePct != null ? `${data.consumeRatePct}%` : "—"}
              </Text>
            </View>
          </View>

          <Text style={[styles.sectionLabel, styles.sectionLabelByCategory]}>BY CATEGORY</Text>
          <View style={styles.card}>
            {!data?.categoriesTop5.length ? (
              <Text style={styles.emptyText}></Text>
            ) : (
              data.categoriesTop5.map((row) => {
                const Icon = getReportCategoryIcon(row.displayLabel, row.displayLabel);
                return (
                  <View key={row.key} style={styles.catRow}>
                    <View style={styles.catLeft}>
                      <View style={styles.iconTile}>
                        <Icon size={16} color={ACCENT} weight="fill" />
                      </View>
                      <Text style={styles.catName} numberOfLines={1}>
                        {row.displayLabel}
                      </Text>
                    </View>
                    <Text style={styles.catQty}>{row.qty}</Text>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${row.barPct}%` }]} />
                    </View>
                  </View>
                );
              })
            )}
          </View>

          <Text style={[styles.sectionLabel, styles.sectionLabelMostItems]}>MOST CONSUMED ITEMS</Text>
          <View style={styles.itemsCard}>
            {!data?.itemsTop5.length ? (
              <Text style={styles.itemsEmptyText}></Text>
            ) : (
              data.itemsTop5.map((row) => {
                const CatIcon = getReportCategoryIcon(row.categoryLabel, row.name);
                return (
                  <View key={`c-${row.rank}-${row.name}`} style={styles.rankRowWrap}>
                    <View style={styles.rankBadge}>
                      <Text style={styles.rankBadgeText}>{row.rank}</Text>
                    </View>
                    <View style={styles.rankBody}>
                      <Text style={styles.rankTitleLine} numberOfLines={1}>
                        <Text style={styles.rankNameInline}>{row.name}</Text>
                        <Text style={styles.rankTimesInline}> ×{row.times}</Text>
                      </Text>
                      <View style={styles.categoryChip}>
                        <CatIcon size={12} color={ACCENT} weight="fill" />
                        <Text style={styles.categoryChipText} numberOfLines={1}>
                          {row.categoryLabel}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      )}
      <OfflineNoticeModal
        visible={offlineNoticeVisible}
        onDismiss={() => setOfflineNoticeVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  header: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 44,
  },
  backBtn: {
    position: "absolute",
    left: 10,
    zIndex: 1,
    padding: 6,
  },
  headerTitle: {
    flex: 1,
    marginHorizontal: 48,
    fontSize: 17,
    fontFamily: "PlusJakartaSans_700Bold",
    color: ACCENT,
    letterSpacing: -0.3,
    textAlign: "center",
  },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingLabel: { marginTop: 10, color: ACCENT, fontWeight: "600", fontSize: 14 },
  scroll: { flex: 1, backgroundColor: BG },
  errorBanner: {
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#FEF2F2",
    color: "#991B1B",
    fontWeight: "600",
    fontSize: 13,
  },
  hero: {
    marginHorizontal: 16,
    marginTop: 4,
    backgroundColor: ACCENT,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  heroKicker: {
    flex: 1,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.85,
    color: "rgba(255,255,255,0.92)",
  },
  heroValue: {
    fontSize: 22,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#FFFFFF",
    letterSpacing: -0.4,
  },
  pairRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 6,
    gap: 6,
  },
  smallCard: {
    flex: 1,
    backgroundColor: CARD,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "rgba(61, 191, 122, 0.2)",
    shadowOpacity: 0,
    elevation: 0,
    alignItems: "center",
    minHeight: 62,
    justifyContent: "center",
  },
  smallKicker: {
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: "#2a9960",
    opacity: 0.9,
    textAlign: "center",
    width: "100%",
  },
  smallPrimary: {
    marginTop: 3,
    fontSize: 14,
    fontWeight: "700",
    color: ACCENT,
    textAlign: "center",
    width: "100%",
  },
  mostConsumedName: {
    fontSize: 14,
    fontWeight: "700",
    color: ACCENT,
  },
  mostConsumedTimes: {
    fontSize: 14,
    fontWeight: "800",
    color: ACCENT,
    opacity: 0.65,
  },
  smallPrimaryRate: {
    marginTop: 3,
    fontSize: 18,
    fontWeight: "700",
    color: ACCENT,
    textAlign: "center",
    width: "100%",
  },
  sectionLabel: {
    marginTop: 14,
    marginBottom: 6,
    marginHorizontal: 20,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    color: ACCENT,
    opacity: 0.95,
  },
  sectionLabelByCategory: {
    marginTop: 12,
    marginBottom: 3,
  },
  sectionLabelMostItems: {
    marginTop: 10,
    marginBottom: 3,
  },
  card: {
    marginHorizontal: 16,
    backgroundColor: CARD,
    borderRadius: 10,
    paddingVertical: 2,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(61, 191, 122, 0.16)",
    shadowOpacity: 0,
    elevation: 0,
  },
  catRow: {
    paddingVertical: 5,
    position: "relative",
  },
  catLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 3,
    paddingRight: 40,
  },
  iconTile: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  catName: {
    flex: 1,
    fontSize: 13,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: INK,
  },
  catQty: {
    position: "absolute",
    right: 0,
    top: 5,
    fontSize: 13,
    fontWeight: "800",
    color: ACCENT,
  },
  barTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E8EAED",
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: ACCENT,
  },
  emptyText: {
    paddingVertical: 12,
    fontSize: 13,
    color: "#166534",
    fontWeight: "600",
    opacity: 0.85,
  },
  itemsCard: {
    marginHorizontal: 16,
    gap: 4,
    paddingBottom: 2,
  },
  rankRowWrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: CARD,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E8EAED",
    gap: 6,
  },
  rankBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(61, 191, 122, 0.1)",
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: "rgba(61, 191, 122, 0.28)",
  },
  rankBadgeText: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 11,
    color: ACCENT,
    letterSpacing: -0.3,
    textAlign: "center",
    marginTop: Platform.OS === "android" ? -1 : 0,
  },
  rankBody: {
    flex: 1,
    minWidth: 0,
  },
  rankTitleLine: {
    fontSize: 13,
  },
  rankNameInline: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: INK,
  },
  rankTimesInline: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 13,
    color: ACCENT,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginTop: 2,
    paddingHorizontal: 0,
    paddingVertical: 0,
    gap: 4,
    maxWidth: "100%",
  },
  categoryChipText: {
    flex: 1,
    flexShrink: 1,
    fontSize: 10,
    fontWeight: "700",
    color: "#4B5563",
    letterSpacing: 0.15,
    minWidth: 0,
  },
  itemsEmptyText: {
    paddingVertical: 8,
    fontSize: 12,
    color: "#166534",
    fontWeight: "600",
    opacity: 0.85,
  },
});
