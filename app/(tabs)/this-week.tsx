import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CaretLeft } from "phosphor-react-native";

import { useAuth } from "@/contexts/AuthContext";
import { FoodItem, supabase, UsageLog } from "@/lib/supabase";
import { foodItemsService } from "@/services/foodItems";
import { formatExpiry } from "@/utils/formatExpiry";

const UI = {
  bg: "#ffffff",
  card: "#ffffff",
  border: "#e8e6e0",
  divider: "#ece9e2",
  ink: "#1f2937",
  muted: "#6b7280",
  amber: "#B45309",
  amberBg: "#FEF3C7",
  amberBorder: "#FDE68A",
  red: "#991B1B",
  redBg: "#FEE2E2",
  redBorder: "#FECACA",
  ok: "#166534",
  okBg: "#DCFCE7",
  okBorder: "#BBF7D0",
};

function PillBadge({
  text,
  tone,
}: {
  text: string;
  tone: "amber" | "green" | "red";
}) {
  const s =
    tone === "green"
      ? { bg: UI.okBg, border: UI.okBorder, ink: UI.ok }
      : tone === "red"
      ? { bg: UI.redBg, border: UI.redBorder, ink: UI.red }
      : { bg: UI.amberBg, border: UI.amberBorder, ink: UI.amber };

  return (
    <View style={[styles.pill, { backgroundColor: s.bg, borderColor: s.border }]}>
      <Text style={[styles.pillText, { color: s.ink }]} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

export default function ThisWeekScreen() {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [expiring, setExpiring] = useState<FoodItem[]>([]);
  const [logs, setLogs] = useState<
    Array<UsageLog & { food_items?: { name?: string } | null }>
  >([]);

  const load = useCallback(async () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    const exp = await foodItemsService.getExpiringItems(7);
    setExpiring(exp as unknown as FoodItem[]);

    const { data, error } = await supabase
      .from("usage_logs")
      .select(
        `
        *,
        food_items (
          name
        )
      `
      )
      .in("status", ["used", "wasted"])
      .gte("logged_at", start.toISOString())
      .lte("logged_at", end.toISOString())
      .order("logged_at", { ascending: false });
    if (error) throw error;
    setLogs((data as any) ?? []);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!user) {
        router.replace({ pathname: "/(auth)/welcome" });
        return;
      }
      load();
    }, [user, load])
  );

  const rows = useMemo(() => {
    const expiringRows = expiring.map((it) => ({
      key: `e-${it.id}`,
      title: it.name,
      date: it.expiry_date
        ? new Date(it.expiry_date).toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
          })
        : "No date",
      pill: formatExpiry(it.expiry_date),
      tone: "amber" as const,
    }));

    const logRows = logs.map((l) => {
      const dt = new Date(l.logged_at);
      const weekday = dt.toLocaleDateString(undefined, { weekday: "short" });
      return {
        key: `l-${l.id}`,
        title: l.food_items?.name || "Item",
        date: dt.toLocaleDateString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
        }),
        pill:
          l.status === "used"
            ? `Consumed ${weekday}`
            : `Thrown away ${weekday}`,
        tone: l.status === "used" ? ("green" as const) : ("red" as const),
      };
    });

    return [...expiringRows, ...logRows];
  }, [expiring, logs]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "right", "left"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          style={styles.backWrap}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <CaretLeft size={18} color={UI.ink} weight="bold" />
        </Pressable>

        <Text style={styles.title}>This week</Text>
        <Text style={styles.subtitle}>
          Expiring items and your recent usage activity.
        </Text>

        <View style={styles.list}>
          {rows.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Nothing to show</Text>
              <Text style={styles.emptyText}>
                Add items with expiry dates, or log usage to see weekly activity.
              </Text>
            </View>
          ) : (
            rows.map((r) => (
              <View key={r.key} style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {r.title}
                  </Text>
                  <Text style={styles.rowDate} numberOfLines={1}>
                    {r.date}
                  </Text>
                </View>
                <PillBadge text={r.pill} tone={r.tone} />
              </View>
            ))
          )}
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: UI.bg,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  backWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: UI.border,
    backgroundColor: UI.card,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    marginTop: 10,
    fontSize: 22,
    fontWeight: "800",
    color: UI.ink,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "600",
    color: UI.muted,
  },
  list: {
    marginTop: 14,
    gap: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: UI.card,
    borderWidth: 0.5,
    borderColor: UI.border,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: UI.ink,
  },
  rowDate: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "600",
    color: UI.muted,
  },
  pill: {
    borderWidth: 0.5,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxWidth: 150,
  },
  pillText: {
    fontSize: 12,
    fontWeight: "700",
  },
  emptyCard: {
    backgroundColor: UI.card,
    borderWidth: 0.5,
    borderColor: UI.border,
    borderRadius: 14,
    padding: 12,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: UI.ink,
  },
  emptyText: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "600",
    color: UI.muted,
    lineHeight: 16,
  },
});

