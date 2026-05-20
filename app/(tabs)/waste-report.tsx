/**
 * Waste Report — all-time insights, red accent on white (parity with consumption report).
 */

import { OfflineNoticeModal } from "@/components/OfflineNoticeModal";
import { getReportCategoryIcon } from "@/lib/reportCategoryIcons";
import { useAuth } from "@/contexts/AuthContext";
import { loadWasteReportAllTime } from "@/services/insightsReportData";
import { isOfflineLikeError } from "@/utils/networkError";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ArrowLeft, Info } from "phosphor-react-native";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ACCENT = "#D94F41";
const BG = "#FFFFFF";
const CARD = "#FFFFFF";
const INK = "#1A1A18";
/** Darker red for secondary labels (parity with consumption #2a9960) */
const ACCENT_MUTED = "#a33d32";

const goBackToMore = () => {
  router.replace("/(tabs)/more");
};

const heroSerif = Platform.select({
  ios: "Georgia",
  android: "serif",
  default: undefined,
});

export default function WasteReportScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = (useBottomTabBarHeight() as number) || 24;
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<Awaited<ReturnType<typeof loadWasteReportAllTime>> | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [offlineNoticeVisible, setOfflineNoticeVisible] = useState(false);
  const [avgDaysInfoVisible, setAvgDaysInfoVisible] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const d = await loadWasteReportAllTime(user.id);
      setData(d);
    } catch (e: unknown) {
      if (isOfflineLikeError(e, { hasAuthenticatedUser: Boolean(user?.id) })) {
        setOfflineNoticeVisible(true);
        setError(null);
      } else {
        console.warn("Waste report load failed", e);
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

  const MostExpiredCatIcon = data?.mostExpiredCategory
    ? getReportCategoryIcon(
        data.mostExpiredCategory.displayLabel,
        data.mostExpiredCategory.displayLabel
      )
    : null;


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
          Waste Report
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
            <View style={styles.heroDual}>
              <View style={styles.heroDualCell}>
                <Text style={styles.heroDualKicker} numberOfLines={2}>
                  {"CURRENTLY\nEXPIRED"}
                </Text>
                <Text style={styles.heroDualValue}>
                  {data?.expiredItemsInInventoryNow ?? 0}
                </Text>
              </View>
              <View style={styles.heroDualDivider} />
              <View style={styles.heroDualCell}>
                <Text style={styles.heroDualKicker} numberOfLines={2}>
                  {"THROWN\nAWAY"}
                </Text>
                <Text style={styles.heroDualValue}>{data?.totalThrownAwayQty ?? 0}</Text>
              </View>
            </View>
          </View>

          <View style={styles.pairRow}>
            <View style={styles.smallCard}>
              <Text style={styles.smallKicker}>MOST THROWN OUT</Text>
              {data?.mostWasted ? (
                <Text style={styles.smallPrimary} numberOfLines={2}>
                  <Text
                    style={[
                      styles.mostWastedName,
                      heroSerif ? { fontFamily: heroSerif } : null,
                    ]}
                  >
                    {data.mostWasted.name}
                  </Text>
                  <Text
                    style={[
                      styles.mostWastedName,
                      heroSerif ? { fontFamily: heroSerif } : null,
                    ]}
                  >
                    {" "}
                    ×{data.mostWasted.times}
                  </Text>
                </Text>
              ) : (
                <Text style={styles.smallPrimary}>—</Text>
              )}
            </View>
            <View style={styles.smallCard}>
              <Text style={styles.smallKicker}>WASTE RATE</Text>
              <Text
                style={[styles.smallPrimaryRate, heroSerif ? { fontFamily: heroSerif } : null]}
              >
                {data?.wasteRatePct != null ? `${data.wasteRatePct}%` : "—"}
              </Text>
            </View>
          </View>

          <Text style={[styles.sectionLabel, styles.sectionLabelExpiry]}>EXPIRY INSIGHTS</Text>
          <View style={styles.insightsGrid}>
            <View style={styles.expiryBeforeExpiryRow}>
              <Text style={styles.expiryBeforeExpiryLabel} numberOfLines={2}>
                Items thrown out before expiry
              </Text>
              <Text style={styles.expiryBeforeExpiryValue}>
                {data?.wastedBeforeExpiryQty ?? 0}
              </Text>
            </View>
            <View style={styles.insightPair}>
              <View style={[styles.insightCardTall, styles.insightCardCategoryWide]}>
                <Text style={styles.insightKicker}>MOST EXPIRED CATEGORY</Text>
                {data?.mostExpiredCategory && MostExpiredCatIcon ? (
                  <View style={styles.expiredCatRow}>
                    <View style={styles.expiredCatIconWrap}>
                      <MostExpiredCatIcon size={17} color={ACCENT} weight="fill" />
                    </View>
                    <Text style={styles.expiredCatInlineWrap} numberOfLines={1}>
                      <Text
                        style={[
                          styles.expiredCatUnified,
                          heroSerif ? { fontFamily: heroSerif } : null,
                        ]}
                      >
                        {data.mostExpiredCategory.displayLabel}
                      </Text>
                      {" "}
                      <Text
                        style={[
                          styles.expiredCatUnified,
                          heroSerif ? { fontFamily: heroSerif } : null,
                        ]}
                      >{`×${data.mostExpiredCategory.qty}`}</Text>
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.insightValueMuted}>—</Text>
                )}
              </View>
              <View style={[styles.insightCardTall, styles.insightCardPostExpiry]}>
                <Text style={styles.insightKicker}>AVG. DAYS AFTER EXPIRY</Text>
                <Text style={styles.insightValueDays}>
                  {data?.avgDaysPastExpiryWhenRemoved != null
                    ? `${data.avgDaysPastExpiryWhenRemoved} days`
                    : "—"}
                </Text>
                <Pressable
                  onPress={() => setAvgDaysInfoVisible(true)}
                  style={styles.infoIconBtnBottom}
                  accessibilityRole="button"
                  accessibilityLabel="About average days after expiry"
                >
                  <Info size={15} color={ACCENT_MUTED} weight="bold" />
                </Pressable>
              </View>
            </View>
            <View style={styles.expiredOutcomesCard}>
              <Text style={styles.insightKicker}>EXPIRED ITEM OUTCOMES</Text>
              {data?.expiredOutcomeRates ? (
                <View style={styles.expiredOutcomesDouble}>
                  <View style={styles.expiredOutcomeCell}>
                    <Text style={styles.expiredOutcomeKicker}>THROWN AWAY</Text>
                    <Text style={styles.expiredOutcomePct}>
                      {data.expiredOutcomeRates.thrownAwayPct}%
                    </Text>
                  </View>
                  <View style={styles.expiredOutcomeDivider} />
                  <View style={styles.expiredOutcomeCell}>
                    <Text style={styles.expiredOutcomeKicker}>CONSUMED</Text>
                    <Text style={styles.expiredOutcomePct}>
                      {data.expiredOutcomeRates.consumedPct}%
                    </Text>
                  </View>
                </View>
              ) : (
                <Text style={styles.expiredOutcomesEmpty}>
                </Text>
              )}
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

          <Text style={[styles.sectionLabel, styles.sectionLabelMostItems]}>MOST THROWN OUT ITEMS</Text>
          <View style={styles.itemsCard}>
            {!data?.itemsTop5.length ? (
              <Text style={styles.itemsEmptyText}></Text>
            ) : (
              data.itemsTop5.map((row) => {
                const CatIcon = getReportCategoryIcon(row.categoryLabel, row.name);
                return (
                  <View key={`w-${row.rank}-${row.name}`} style={styles.rankRowWrap}>
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

      <Modal
        visible={avgDaysInfoVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAvgDaysInfoVisible(false)}
      >
        <Pressable
          style={styles.infoModalBackdrop}
          onPress={() => setAvgDaysInfoVisible(false)}
        >
          <View
            style={styles.infoModalCard}
            accessibilityViewIsModal
            accessibilityLabel="Average days after expiry, explained"
          >
            <ScrollView
              style={styles.infoModalScroll}
              contentContainerStyle={styles.infoModalScrollContent}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              <Text style={styles.infoModalBody}>
                Measures how long items sit past their expiry before you act on them. Only actions
                on or after the expiry date are counted.
              </Text>
            </ScrollView>
            <Pressable
              onPress={() => setAvgDaysInfoVisible(false)}
              style={styles.infoModalOkBtn}
              accessibilityRole="button"
              accessibilityLabel="OK"
            >
              <Text style={styles.infoModalOkText}>OK</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

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
    paddingVertical: 10,
    paddingHorizontal: 8,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  heroDual: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  heroDualCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
    paddingVertical: 2,
    minWidth: 0,
  },
  heroDualDivider: {
    width: StyleSheet.hairlineWidth * 2,
    backgroundColor: "rgba(255,255,255,0.28)",
    marginVertical: 4,
  },
  heroDualKicker: {
    fontSize: 7,
    fontWeight: "800",
    letterSpacing: 0.35,
    color: "rgba(255,255,255,0.92)",
    textAlign: "center",
    marginBottom: 3,
    lineHeight: 9,
  },
  heroDualValue: {
    fontSize: 18,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#FFFFFF",
    letterSpacing: -0.35,
    textAlign: "center",
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
    borderColor: "rgba(217, 79, 65, 0.2)",
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
    color: ACCENT_MUTED,
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
  mostWastedName: {
    fontSize: 14,
    fontWeight: "700",
    color: ACCENT,
  },
  smallPrimaryRate: {
    marginTop: 3,
    fontSize: 18,
    fontWeight: "700",
    color: ACCENT,
    textAlign: "center",
    width: "100%",
  },
  sectionLabelExpiry: {
    marginTop: 12,
    marginBottom: 3,
  },
  expiryBeforeExpiryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "#FFF9F8",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(217, 79, 65, 0.14)",
  },
  expiryBeforeExpiryLabel: {
    flex: 1,
    fontSize: 12,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: ACCENT_MUTED,
    letterSpacing: -0.1,
    lineHeight: 16,
  },
  expiryBeforeExpiryValue: {
    fontSize: 26,
    fontFamily: "PlusJakartaSans_700Bold",
    color: ACCENT,
    letterSpacing: -0.5,
    flexShrink: 0,
  },
  insightsGrid: {
    marginHorizontal: 16,
    gap: 6,
    marginBottom: 2,
  },
  insightPair: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 6,
  },
  insightCardTall: {
    flex: 1,
    backgroundColor: CARD,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "rgba(217, 79, 65, 0.2)",
    minHeight: 72,
  },
  insightCardCategoryWide: {
    flex: 1.58,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  insightCardPostExpiry: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  expiredCatRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
    width: "100%",
    paddingHorizontal: 4,
    gap: 6,
  },
  /** Same colour, weight, and serif as the category name */
  expiredCatUnified: {
    color: ACCENT,
    fontSize: 14,
    fontWeight: "700",
  },
  expiredCatInlineWrap: {
    flexShrink: 1,
    textAlign: "center",
  },
  expiredCatIconWrap: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  infoIconBtnBottom: {
    alignSelf: "center",
    marginTop: 2,
    padding: 4,
  },
  insightValueDays: {
    marginTop: 4,
    fontSize: 20,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: ACCENT,
    letterSpacing: -0.35,
    textAlign: "center",
    width: "100%",
  },
  infoModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  infoModalCard: {
    backgroundColor: CARD,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    width: "100%",
    maxWidth: 360,
    borderWidth: 1,
    borderColor: "rgba(217, 79, 65, 0.14)",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  infoModalScroll: {
    maxHeight: 260,
  },
  infoModalScrollContent: {
    paddingBottom: 8,
  },
  infoModalOkBtn: {
    alignSelf: "center",
    marginTop: 4,
    paddingVertical: 12,
    paddingHorizontal: 40,
  },
  infoModalOkText: {
    fontSize: 17,
    fontFamily: "PlusJakartaSans_700Bold",
    color: ACCENT,
    letterSpacing: 0.3,
    textAlign: "center",
  },
  infoModalBody: {
    fontSize: 15,
    lineHeight: 23,
    color: "#374151",
    fontWeight: "500",
    letterSpacing: 0.15,
  },
  expiredOutcomesCard: {
    backgroundColor: CARD,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "rgba(217, 79, 65, 0.2)",
  },
  expiredOutcomesDouble: {
    flexDirection: "row",
    alignItems: "stretch",
    marginTop: 6,
  },
  expiredOutcomeCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 2,
    minWidth: 0,
  },
  expiredOutcomeDivider: {
    width: StyleSheet.hairlineWidth * 2,
    backgroundColor: "#E8EAED",
    marginVertical: 2,
  },
  expiredOutcomeKicker: {
    fontSize: 7,
    fontWeight: "800",
    letterSpacing: 0.35,
    color: ACCENT_MUTED,
    textAlign: "center",
    marginBottom: 4,
  },
  expiredOutcomePct: {
    fontSize: 16,
    fontFamily: "PlusJakartaSans_700Bold",
    color: ACCENT,
    letterSpacing: -0.25,
    textAlign: "center",
  },
  expiredOutcomesEmpty: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "600",
    color: "#9CA3AF",
    textAlign: "center",
  },
  insightKicker: {
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.75,
    color: ACCENT_MUTED,
    textAlign: "center",
    width: "100%",
    marginBottom: 4,
  },
  insightValueMuted: {
    marginTop: 4,
    fontSize: 18,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#9CA3AF",
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
    borderColor: "rgba(217, 79, 65, 0.16)",
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
    color: "#7F1D1D",
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
    backgroundColor: "rgba(217, 79, 65, 0.1)",
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: "rgba(217, 79, 65, 0.28)",
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
    color: "#7F1D1D",
    fontWeight: "600",
    opacity: 0.85,
  },
});
