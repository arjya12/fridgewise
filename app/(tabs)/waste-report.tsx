// Waste Report Screen (counts only)
// Implements period selection, trends, and breakdown grouped by item name

import SimpleLineChart from "@/components/charts/SimpleLineChart";
import {
  Bucket,
  DateRange,
  Granularity,
  InventoryItem,
  addDays,
  bucketizeWaste,
  changePercent,
  getPeriodRange,
  getPreviousRange,
  groupWastedItemsByName,
} from "@/services/wasteSelectors";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const { width: screenWidth } = Dimensions.get("window");

const STORAGE_KEYS = {
  granularity: "fw_waste_granularity",
  bucket: "fw_waste_selected_bucket",
};

// Mock selector fallbacks (replace with real selectors when available)
function useAllItems(): InventoryItem[] {
  // In a real app, replace with selectAllItems() from store
  return [];
}
function useGlobalFilters() {
  // Replace with selectFilters()
  return { location: "All" as const, search: "" };
}

export default function WasteReportScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ initialGranularity?: Granularity }>();
  const tabBarHeight = (useBottomTabBarHeight() as unknown as number) || 24;

  const allItems = useAllItems();
  const filters = useGlobalFilters();

  const [granularity, setGranularity] = useState<Granularity>(
    (params.initialGranularity as Granularity) || "month"
  );
  const [selectedBucketLabel, setSelectedBucketLabel] = useState<string | null>(
    null
  );
  const [refreshing, setRefreshing] = useState(false);
  const [compare, setCompare] = useState(false);
  const [activeCategories, setActiveCategories] = useState<
    string[] | undefined
  >(undefined);
  const [loading, setLoading] = useState(true);

  // Persist UI state
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.granularity, granularity).catch(() => {});
  }, [granularity]);
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.bucket, selectedBucketLabel ?? "").catch(
      () => {}
    );
  }, [selectedBucketLabel]);

  useEffect(() => {
    (async () => {
      const g = (await AsyncStorage.getItem(
        STORAGE_KEYS.granularity
      )) as Granularity | null;
      const b = await AsyncStorage.getItem(STORAGE_KEYS.bucket);
      if (g) setGranularity(g);
      if (b) setSelectedBucketLabel(b || null);
      setLoading(false);
    })();
  }, []);

  useFocusEffect(
    useCallback(() => {
      // could trigger store refresh here
      return () => {};
    }, [])
  );

  const now = useMemo(() => new Date(), []);
  const period = useMemo(
    () => getPeriodRange(granularity, now),
    [granularity, now]
  );
  const prevPeriod = useMemo(
    () => getPreviousRange(period, granularity),
    [period, granularity]
  );

  const effectiveFilters = useMemo(
    () => ({ ...filters, categories: activeCategories }),
    [filters, activeCategories]
  );
  const buckets = useMemo(
    () => bucketizeWaste(allItems, granularity, effectiveFilters, now),
    [allItems, granularity, effectiveFilters, now]
  );

  const currentCount = useMemo(() => {
    const range = selectedBucketLabel
      ? buckets.find((b) => b.bucketLabel === selectedBucketLabel)
      : null;
    if (range) return range.count;
    return buckets.reduce((sum, b) => sum + b.count, 0);
  }, [buckets, selectedBucketLabel]);

  const prevCount = useMemo(() => {
    // Approximate by recomputing buckets for prevPeriod and summing
    const prevBuckets = bucketizeWaste(
      allItems,
      granularity,
      effectiveFilters,
      addDays(prevPeriod.end, -1)
    );
    return prevBuckets.reduce((sum, b) => sum + b.count, 0);
  }, [allItems, effectiveFilters, granularity, prevPeriod]);

  const change = useMemo(
    () => changePercent(currentCount, prevCount),
    [currentCount, prevCount]
  );

  const breakdown = useMemo(() => {
    const range: DateRange = selectedBucketLabel
      ? (buckets.find((b) => b.bucketLabel === selectedBucketLabel) as Bucket)
      : period;
    return groupWastedItemsByName(
      allItems,
      { start: range.start, end: range.end },
      effectiveFilters,
      now
    );
  }, [allItems, buckets, effectiveFilters, now, period, selectedBucketLabel]);

  const handleRefresh = async () => {
    setRefreshing(true);
    // trigger store refresh if available
    setTimeout(() => setRefreshing(false), 400);
  };

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRow, setDetailRow] = useState<{
    name: string;
    instanceIds: string[];
  } | null>(null);

  const openDetail = (row: { name: string; instanceIds: string[] }) => {
    setDetailRow(row);
    setDetailOpen(true);
  };

  const clearBucket = () => setSelectedBucketLabel(null);

  // compute series data with hooks BEFORE any early return to keep hook order stable
  const trendData = buckets.map((b) => ({ x: b.bucketLabel, y: b.count }));
  const compareData = useMemo(() => {
    if (!compare) return undefined;
    const prevBuckets = bucketizeWaste(
      allItems,
      granularity,
      effectiveFilters,
      addDays(prevPeriod.end, -1)
    );
    return prevBuckets.map((b) => ({ x: b.bucketLabel, y: b.count }));
  }, [compare, allItems, granularity, effectiveFilters, prevPeriod]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <View style={[styles.container, styles.centered]}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading Waste Report…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const bottomInset = tabBarHeight;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Waste Report</Text>
        <TouchableOpacity
          onPress={handleRefresh}
          accessibilityLabel="Refresh"
          accessibilityHint="Reload waste data"
        >
          <Ionicons name="refresh" size={22} color="#374151" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContent}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={{ paddingBottom: bottomInset + 24 }}
      >
        {/* Segmented control */}
        <View accessibilityRole="tablist" style={styles.periodSelector}>
          {(["week", "month", "year"] as const).map((g) => {
            const isSelected = g === granularity;
            return (
              <TouchableOpacity
                key={g}
                accessibilityRole="tab"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${g} tab`}
                onPress={() => {
                  setGranularity(g);
                }}
                style={[
                  styles.periodButton,
                  isSelected && styles.selectedPeriod,
                ]}
              >
                <Text
                  style={[
                    styles.periodText,
                    isSelected && styles.selectedPeriodText,
                  ]}
                >
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Compare toggle and filter chip */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            marginTop: 8,
          }}
        >
          <TouchableOpacity
            onPress={() => setCompare(!compare)}
            accessibilityRole="switch"
            accessibilityState={{ checked: compare }}
          >
            <Text style={{ color: "#374151", fontWeight: "600" }}>
              {compare ? "Compare to previous: On" : "Compare to previous: Off"}
            </Text>
          </TouchableOpacity>
          {activeCategories && activeCategories.length ? (
            <TouchableOpacity
              style={styles.clearChip}
              onPress={() => setActiveCategories(undefined)}
            >
              <Ionicons name="funnel" size={14} color="#374151" />
              <Text style={styles.clearChipText}>Clear category filter</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* KPI Row */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Ionicons name="trash-outline" size={22} color="#6B7280" />
            <Text style={styles.summaryValue}>{currentCount}</Text>
            <Text style={styles.summaryLabel}>Items Wasted</Text>
          </View>
          <View style={styles.summaryCard}>
            <Ionicons
              name={change >= 0 ? "trending-up" : "trending-down"}
              size={22}
              color="#6B7280"
            />
            <Text style={styles.summaryValue}>
              {change > 0 ? "+" : ""}
              {change}%
            </Text>
            <Text style={styles.summaryLabel}>Change vs previous</Text>
          </View>
        </View>

        {/* Chart */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Waste Trends</Text>
          <SimpleLineChart
            data={trendData}
            compareData={compareData}
            width={screenWidth - 40}
            height={200}
            lineColor="#6B7280"
            pointColor="#4B5563"
            backgroundColor="#FFFFFF"
            onPointPress={(label: string) => setSelectedBucketLabel(label)}
            getPointA11yLabel={(label: string, value: number) =>
              `${label} — ${value} items wasted.`
            }
          />
          {/* Legend (tap to toggle categories) */}
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              marginTop: 8,
              gap: 8,
            }}
          >
            {[
              { key: "Produce", color: "#10B981" },
              { key: "Dairy", color: "#60A5FA" },
              { key: "Meat", color: "#F97316" },
              { key: "Pantry", color: "#8B5CF6" },
              { key: "Other", color: "#9CA3AF" },
            ].map((c) => {
              const isOn =
                !activeCategories || activeCategories.includes(c.key);
              return (
                <TouchableOpacity
                  key={c.key}
                  onPress={() => {
                    setActiveCategories((prev) => {
                      if (!prev || prev.length === 0) return [c.key];
                      return prev.includes(c.key)
                        ? prev.filter((k) => k !== c.key)
                        : [...prev, c.key];
                    });
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                    backgroundColor: isOn ? "#FFFFFF" : "#F3F4F6",
                  }}
                >
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: c.color,
                      marginRight: 6,
                      opacity: isOn ? 1 : 0.4,
                    }}
                  />
                  <Text style={{ color: "#374151", fontSize: 12 }}>
                    {c.key}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {selectedBucketLabel && (
            <View style={styles.filterRow}>
              <Text style={styles.filterText}>
                Filtered to: {selectedBucketLabel}
              </Text>
              <TouchableOpacity style={styles.clearChip} onPress={clearBucket}>
                <Ionicons name="close" size={14} color="#374151" />
                <Text style={styles.clearChipText}>Clear</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Breakdown List */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Breakdown</Text>
          {currentCount === 0 ? (
            <Text style={styles.emptyText}>
              No waste for this period. Keep it up.
            </Text>
          ) : (
            <View>
              {breakdown.map((item) => (
                <Pressable
                  key={item.name}
                  onPress={() =>
                    openDetail({
                      name: item.name,
                      instanceIds: item.instanceIds,
                    })
                  }
                  style={styles.row}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.name}, ${item.totalQty} total wasted, ${item.occurrences} occurrences`}
                >
                  <Text style={styles.rowName}>{item.name}</Text>
                  <View style={styles.rowRight}>
                    <Text style={styles.rowQty}>{item.totalQty}</Text>
                    <Text style={styles.rowOcc}>×{item.occurrences}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Detail Bottom Sheet (Modal) */}
      <Modal
        visible={detailOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{detailRow?.name}</Text>
            <Text style={styles.modalSub}>
              Instances: {detailRow?.instanceIds.length ?? 0}
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => {
                  // archiveItems(detailRow?.instanceIds ?? [])
                  setDetailOpen(false);
                }}
                style={[styles.actionBtn, styles.archiveBtn]}
                accessibilityLabel="Archive all"
              >
                <Text style={styles.actionText}>Archive All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  // markConsumed(detailRow?.instanceIds ?? [])
                  setDetailOpen(false);
                }}
                style={[styles.actionBtn, styles.usedBtn]}
                accessibilityLabel="Mark as used anyway"
              >
                <Text style={styles.actionText}>Mark as Used Anyway</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setDetailOpen(false)}
            >
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1F2937",
  },
  scrollContent: {
    flex: 1,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6B7280",
  },
  periodSelector: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 8,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: "center",
  },
  selectedPeriod: {
    backgroundColor: "#2563EB",
  },
  periodText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  selectedPeriodText: {
    color: "#FFFFFF",
  },
  summaryContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginTop: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
    textAlign: "center",
  },
  chartContainer: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  filterText: { fontSize: 13, color: "#4B5563" },
  clearChip: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearChipText: { marginLeft: 4, color: "#374151", fontSize: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  rowName: { fontSize: 15, color: "#111827", fontWeight: "600" },
  rowRight: { flexDirection: "row", alignItems: "center" },
  rowQty: { fontSize: 15, fontWeight: "700", color: "#111827" },
  rowOcc: { marginLeft: 8, fontSize: 12, color: "#6B7280" },
  emptyText: { color: "#6B7280", fontSize: 14 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  modalSub: { marginTop: 4, color: "#6B7280" },
  modalActions: { marginTop: 12, gap: 8 },
  actionBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  archiveBtn: { backgroundColor: "#E5E7EB" },
  usedBtn: { backgroundColor: "#D1FAE5" },
  actionText: { color: "#111827", fontWeight: "600" },
  closeBtn: { marginTop: 8, alignItems: "center" },
  closeText: { color: "#374151" },
});
