import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  // JS: 0=Sunday, 1=Monday...
  let day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Make Monday=0
}

interface SimpleCalendarProps {
  selectedDate: Date | null;
  onSelect: (date: Date) => void;
  /**
   * Optional callback to inform parent how many week rows
   * are currently rendered (5 or 6). Used to adjust layout
   * around the calendar.
   */
  onWeeksChange?: (weeks: number) => void;
}

export function SimpleCalendar({
  selectedDate,
  onSelect,
  onWeeksChange,
}: SimpleCalendarProps) {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(
    selectedDate
      ? new Date(selectedDate.getFullYear(), selectedDate.getMonth())
      : new Date()
  );
  useEffect(() => {
    if (!selectedDate) return;
    setCurrentDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  }, [selectedDate]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // ── Month/year wheel picker (same UX as Calendar screen) ───────────────────
  const [pickerOpen, setPickerOpen] = useState(false);
  const [tempMonth, setTempMonth] = useState(month + 1);
  const [tempYear, setTempYear] = useState(year);

  const WHEEL_ITEM_H = 32;
  const WHEEL_VISIBLE = 5;
  const WHEEL_PAD = Math.floor(WHEEL_VISIBLE / 2); // 2
  const wheelSpacerH = WHEEL_PAD * WHEEL_ITEM_H;

  const MONTHS = useMemo(
    () =>
      [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],
    []
  );
  const MONTH_LOOP_REPEATS = 40;
  const MONTH_LOOP_START = Math.floor(MONTH_LOOP_REPEATS / 2) * 12;

  const baseYear = useMemo(() => new Date().getFullYear(), []);
  const YEAR_PAST = 2;
  const YEAR_FUTURE = 12;
  const yearsData = useMemo(() => {
    const start = baseYear - YEAR_PAST;
    return Array.from({ length: YEAR_PAST + 1 + YEAR_FUTURE }).map(
      (_, i) => start + i
    );
  }, [baseYear]);

  const monthRef = useRef<FlatList<string>>(null);
  const yearRef = useRef<FlatList<number>>(null);

  const scrollWheelToIndex = (ref: any, index: number, animated: boolean) => {
    const offset = Math.max(0, index * WHEEL_ITEM_H);
    ref.current?.scrollToOffset({ offset, animated });
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const changeMonth = (increment: number) => {
    const newDate = new Date(year, month + increment, 1);
    setCurrentDate(newDate);
  };

  const changeYear = (increment: number) => {
    const newDate = new Date(year + increment, month, 1);
    setCurrentDate(newDate);
  };

  function buildDaysGrid(y: number, m: number) {
    const daysInMonth = getDaysInMonth(y, m);
    const firstDayOfWeek = getFirstDayOfWeek(y, m);
    const days: { n: number; faded: boolean }[] = [];

    // Add blanks before the 1st
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push({ n: 0, faded: true });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dayDate = new Date(y, m, d);
      const isPast = dayDate < today;
      days.push({ n: d, faded: isPast });
    }

    // Pad with blanks after the last day so the final row always has 7 cells
    const remainder = days.length % 7;
    if (remainder !== 0) {
      const cellsToAdd = 7 - remainder;
      for (let i = 0; i < cellsToAdd; i++) {
        days.push({ n: 0, faded: true });
      }
    }

    return days;
  }

  function chunkIntoRows(daysArr: { n: number; faded: boolean }[]) {
    const rows = [];
    for (let i = 0; i < daysArr.length; i += 7) {
      rows.push(daysArr.slice(i, i + 7));
    }
    return rows;
  }

  const daysGrid = buildDaysGrid(year, month);
  const rows = chunkIntoRows(daysGrid);

  // Inform parent how many week rows are rendered (5 or 6).
  // Do this in an effect so we don't call setState during render.
  useEffect(() => {
    if (onWeeksChange) {
      onWeeksChange(rows.length);
    }
  }, [rows.length, onWeeksChange]);

  return (
    <View style={styles.container}>
      {/* Calendar icon (acts as dropdown trigger) */}
      <Pressable
        style={styles.hintIcon}
        onPress={() => {
          setTempMonth(month + 1);
          setTempYear(year);
          setPickerOpen(true);
          requestAnimationFrame(() => {
            scrollWheelToIndex(monthRef, MONTH_LOOP_START + month, false);
            const yi = Math.max(0, yearsData.indexOf(year));
            scrollWheelToIndex(yearRef, yi, false);
          });
        }}
      >
        <Ionicons name="calendar-outline" size={16} color="#22C55E" />
      </Pressable>

      {/* Year and Month selectors */}
      <View style={styles.header}>
        <Pressable onPress={() => changeYear(-1)} style={styles.arrowCircle}>
          <Ionicons name="chevron-back" size={12} style={styles.arrowIcon} />
        </Pressable>
        <View style={styles.yearContainer}>
          <Text style={[styles.monthYear, { color: "#FFF" }]}>{year}</Text>
        </View>
        <Pressable onPress={() => changeYear(1)} style={styles.arrowCircle}>
          <Ionicons name="chevron-forward" size={12} style={styles.arrowIcon} />
        </Pressable>
      </View>

      <View style={styles.header}>
        <Pressable onPress={() => changeMonth(-1)} style={styles.arrowCircle}>
          <Ionicons name="chevron-back" size={12} style={styles.arrowIcon} />
        </Pressable>
        <View style={styles.monthContainer}>
          <Text style={[styles.monthYear, { color: "#FFF" }]}>
            {monthNames[month]}
          </Text>
        </View>
        <Pressable onPress={() => changeMonth(1)} style={styles.arrowCircle}>
          <Ionicons name="chevron-forward" size={12} style={styles.arrowIcon} />
        </Pressable>
      </View>

      {/* Days header */}
      <View style={styles.daysRow}>
        {DAYS.map((d, i) => (
          <Text key={i} style={styles.dayHeading}>
            {d}
          </Text>
        ))}
      </View>

      {/* Days grid */}
      <View style={{ width: "100%" }}>
        {rows.map((row, rowIdx) => (
          <View key={rowIdx} style={{ flexDirection: "row", width: "100%" }}>
            {row.map((day, colIdx) => {
              if (day.n === 0) {
                return (
                  <View key={colIdx} style={styles.dayCell}>
                    <Text style={{ color: "#E5E7EB" }}> </Text>
                  </View>
                );
              }

              const currentDateObj = new Date(year, month, day.n);
              const isSelected =
                selectedDate &&
                selectedDate.getFullYear() === year &&
                selectedDate.getMonth() === month &&
                selectedDate.getDate() === day.n;
              const isToday =
                today.getFullYear() === year &&
                today.getMonth() === month &&
                today.getDate() === day.n;
              const isExpired = day.faded;

              return (
                <Pressable
                  key={colIdx}
                  style={styles.dayCell}
                  disabled={isExpired}
                  onPress={() => onSelect(currentDateObj)}
                >
                  <View
                    style={[
                      styles.dayPill,
                      !isExpired && styles.dayPillDefault,
                      isExpired && styles.dayPillExpired,
                      isToday && !isSelected && styles.dayPillToday,
                      isSelected && styles.dayPillSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        isExpired && styles.dayTextExpired,
                        isSelected && styles.dayTextSelected,
                        isToday && !isSelected && styles.dayTextToday,
                      ]}
                    >
                      {day.n}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      <Modal
        transparent
        visible={pickerOpen}
        animationType="fade"
        onRequestClose={() => setPickerOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setPickerOpen(false)}
          />
          <View style={styles.modalCard}>
            <View style={styles.wheelsRow}>
              <View style={styles.wheelCol}>
                <View style={styles.wheelBody}>
                  <View style={styles.wheelHighlight} pointerEvents="none" />
                  <FlatList
                    ref={monthRef}
                    data={Array.from({ length: 12 * MONTH_LOOP_REPEATS }).map(
                      (_, i) => MONTHS[i % 12]
                    )}
                    keyExtractor={(it, idx) => `${it}-${idx}`}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                    overScrollMode="never"
                    snapToInterval={WHEEL_ITEM_H}
                    decelerationRate="fast"
                    disableIntervalMomentum
                    contentContainerStyle={{ paddingVertical: wheelSpacerH }}
                    getItemLayout={(_, index) => ({
                      length: WHEEL_ITEM_H,
                      offset: WHEEL_ITEM_H * index,
                      index,
                    })}
                    initialScrollIndex={MONTH_LOOP_START + (tempMonth - 1)}
                    onMomentumScrollEnd={(e) => {
                      const idx = Math.round(
                        e.nativeEvent.contentOffset.y / WHEEL_ITEM_H
                      );
                      const raw = (Array.from({
                        length: 12 * MONTH_LOOP_REPEATS,
                      }).map((_, i) => MONTHS[i % 12]) as any[])[idx];
                      const m = MONTHS.indexOf(raw);
                      if (m >= 0) setTempMonth(m + 1);
                      const minSafe = 12 * 6;
                      const maxSafe = 12 * (MONTH_LOOP_REPEATS - 6);
                      if (idx < minSafe || idx > maxSafe) {
                        scrollWheelToIndex(
                          monthRef,
                          MONTH_LOOP_START + (m >= 0 ? m : 0),
                          false
                        );
                      }
                    }}
                    renderItem={({ item, index }) => {
                      const active = index === MONTH_LOOP_START + (tempMonth - 1);
                      return (
                        <View style={styles.wheelItem}>
                          <Text
                            style={[
                              styles.wheelText,
                              active && styles.wheelTextActive,
                            ]}
                          >
                            {item}
                          </Text>
                        </View>
                      );
                    }}
                  />
                </View>
              </View>

              <View style={styles.wheelCol}>
                <View style={styles.wheelBody}>
                  <View style={styles.wheelHighlight} pointerEvents="none" />
                  <FlatList
                    ref={yearRef}
                    data={yearsData}
                    keyExtractor={(it, idx) => `${it}-${idx}`}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                    overScrollMode="never"
                    snapToInterval={WHEEL_ITEM_H}
                    decelerationRate="fast"
                    disableIntervalMomentum
                    contentContainerStyle={{ paddingVertical: wheelSpacerH }}
                    getItemLayout={(_, index) => ({
                      length: WHEEL_ITEM_H,
                      offset: WHEEL_ITEM_H * index,
                      index,
                    })}
                    initialScrollIndex={Math.max(0, yearsData.indexOf(tempYear))}
                    onMomentumScrollEnd={(e) => {
                      let idx = Math.round(
                        e.nativeEvent.contentOffset.y / WHEEL_ITEM_H
                      );
                      if (idx < 0) idx = 0;
                      if (idx > yearsData.length - 1) idx = yearsData.length - 1;
                      const y = yearsData[idx];
                      if (typeof y === "number") setTempYear(y);
                      if (idx <= 0) scrollWheelToIndex(yearRef, 0, false);
                    }}
                    renderItem={({ item }) => {
                      const active = item === tempYear;
                      return (
                        <View style={styles.wheelItem}>
                          <Text
                            style={[
                              styles.wheelText,
                              active && styles.wheelTextActive,
                            ]}
                          >
                            {item}
                          </Text>
                        </View>
                      );
                    }}
                  />
                </View>
              </View>
            </View>

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setPickerOpen(false)}
                style={styles.modalCancel}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setCurrentDate(new Date(tempYear, tempMonth - 1, 1));
                  setPickerOpen(false);
                }}
                style={styles.modalApply}
              >
                <Text style={styles.modalApplyText}>Apply</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 8,
    alignItems: "center",
    width: 220,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginVertical: 8,
  },
  hintIcon: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 10,
    opacity: 0.9,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    gap: 8,
  },
  arrowCircle: {
    backgroundColor: "#F3F4F6",
    borderRadius: 999,
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 2,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 1.5,
    elevation: 0,
  },
  arrowIcon: {
    color: "#22C55E",
    fontSize: 12,
  },
  yearContainer: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 4,
    backgroundColor: "#22C55E",
    borderWidth: 1,
    borderColor: "#16A34A",
    minWidth: 48,
    alignItems: "center",
  },
  monthContainer: {
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 4,
    backgroundColor: "#22C55E",
    borderWidth: 1,
    borderColor: "#16A34A",
    minWidth: 64,
    alignItems: "center",
  },
  monthYear: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "SpaceMono",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.35)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  modalLabel: {
    textAlign: "center",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: "#94A3B8",
    marginBottom: 10,
  },
  wheelsRow: {
    flexDirection: "row",
    gap: 10,
  },
  wheelCol: {
    flex: 1,
  },
  wheelBody: {
    height: 32 * 5,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    overflow: "hidden",
    position: "relative",
  },
  wheelHighlight: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 64,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    backgroundColor: "rgba(220,252,231,0.35)",
  },
  wheelItem: {
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  wheelText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  wheelTextActive: {
    color: "#15803D",
    fontWeight: "700",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 12,
    gap: 16,
  },
  modalCancel: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  modalApply: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#22C55E",
  },
  modalApplyText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  daysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 6,
    marginBottom: 2,
    paddingBottom: 2,
  },
  dayHeading: {
    flex: 1,
    textAlign: "center",
    fontSize: 10,
    fontWeight: "600",
    color: "#A1A1AB",
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 3,
    marginVertical: 4,
  },
  // Pill that visually represents a day; kept smaller than the cell for a cleaner look
  dayPill: {
    width: 26,
    height: 26,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  dayPillDefault: {
    backgroundColor: "#F8F9FA",
  },
  dayPillSelected: {
    backgroundColor: "#22C55E",
  },
  dayPillToday: {
    borderWidth: 1,
    borderColor: "#22C55E",
    backgroundColor: "#ECFDF3",
  },
  dayPillExpired: {
    backgroundColor: "#F3F4F6",
  },
  dayText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#374151",
  },
  dayTextSelected: {
    color: "#FFF",
    fontWeight: "700",
  },
  dayTextToday: {
    color: "#22C55E",
    fontWeight: "700",
  },
  dayTextExpired: {
    color: "#D1D5DB",
  },
  selectedDateContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: "#E5E7EB",
  },
  selectedDateText: {
    fontSize: 12,
    color: "#22C55E",
    fontWeight: "600",
  },
});
