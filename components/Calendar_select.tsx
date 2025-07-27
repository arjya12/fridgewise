import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
} from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedGestureHandler,
  withTiming,
} from "react-native-reanimated";
import { useCalendar } from "../hooks/useCalendar";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  // JS: 0=Sunday, 1=Monday...
  let day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Make Monday=0
}

interface CalendarProps {
  selectedDate: Date | null;
  onSelect: (date: Date) => void;
  initialYear?: number;
  initialMonth?: number;
  minDate?: Date;
  maxDate?: Date;
}

// Move styles definition above the Calendar component
const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFF",
    borderRadius: 18, // reduced from 24
    padding: 8, // reduced from 12
    alignItems: "center",
    width: 220, // reduced from 300
    shadowColor: "#22C55E",
    shadowOpacity: 0.1,
    shadowRadius: 10, // reduced from 16
    elevation: 4, // reduced from 6
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginVertical: 8, // reduced from 12
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6, // reduced from 8
    gap: 6, // reduced from 8
  },
  arrowCircle: {
    backgroundColor: "#E6F9EF",
    borderRadius: 999,
    width: 22, // reduced from 28
    height: 22, // reduced from 28
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 2,
    shadowColor: "#22C55E",
    shadowOpacity: 0.08,
    shadowRadius: 2, // reduced from 4
    elevation: 1, // reduced from 2
  },
  arrowIcon: {
    color: "#22C55E",
    fontSize: 12, // reduced from 16
  },
  monthYear: {
    fontSize: 13, // reduced from 15
    fontWeight: "700",
    fontFamily: "SpaceMono",
    letterSpacing: 0.5,
    marginHorizontal: 6,
    textAlign: "center",
  },
  gradientText: {
    backgroundColor: "linear-gradient(90deg, #22C55E 0%, #A7F3D0 100%)",
    color: "#22C55E",
  },
  daysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 6, // reduced from 8
    marginBottom: 2, // reduced from 4
    // Remove borderBottomWidth and borderColor to avoid double line
    // borderBottomWidth: 1,
    // borderColor: '#E5E7EB',
    paddingBottom: 2, // reduced from 4
  },
  dayHeading: {
    flex: 1,
    textAlign: "center",
    fontWeight: "700",
    color: "#A1A1AB",
    fontSize: 9, // reduced from 10
    fontFamily: "SpaceMono",
    letterSpacing: 0.1,
    textTransform: "uppercase",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
    marginTop: 1, // reduced from 2
    marginBottom: 2, // reduced from 4
    // Add fixed height for 6 rows of cells (6 * cell size + margins)
    minHeight: 6 * 28, // 6 rows * (cell height + margin), cell height is 26 + margin 1 top/bottom
    maxHeight: 6 * 28,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 0.5, // reduced from 1
  },
  dayButton: {
    width: 20, // reduced from 26
    height: 20, // reduced from 26
    borderRadius: 10, // reduced from 13
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "transparent",
    backgroundColor: "transparent",
    margin: 0.5, // reduced from 1
  },
  dayButtonToday: {
    borderColor: "#22C55E",
    backgroundColor: "#E6F9EF",
  },
  dayButtonSelected: {
    backgroundColor: "#22C55E",
    borderColor: "#22C55E",
    // Remove shadow and force circle
    shadowColor: "transparent",
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  dayButtonExpired: {
    backgroundColor: "transparent",
    borderColor: "transparent",
  },
  dayText: {
    fontSize: 11, // slightly larger for better readability
    color: "#222",
    fontWeight: "600",
    fontFamily: "SpaceMono",
    textAlign: "center",
    lineHeight: 14,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  dayTextSelected: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "SpaceMono",
    textAlign: "center",
    lineHeight: 14,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  dayTextExpired: {
    color: "#D1D5DB",
    textDecorationLine: "line-through",
  },
  todayLabel: {
    fontSize: 8, // reduced from 9
    color: "#22C55E",
    marginTop: 1, // reduced from 2
    fontWeight: "700",
  },
  summary: {
    marginTop: 6, // reduced from 10
    fontSize: 12, // reduced from 15
    color: "#22C55E",
    fontWeight: "600",
    fontFamily: "SpaceMono",
    textAlign: "center",
  },
});

export function Calendar({
  selectedDate: initialSelectedDate,
  onSelect,
  initialYear,
  initialMonth,
}: CalendarProps) {
  const today = new Date();
  const {
    currentDate,
    selectedDate,
    selectDate,
    changeMonth,
    changeYear,
    animatedStyle,
    translateX,
    opacity,
    yearTranslateX,
    yearOpacity,
    yearAnimatedStyle,
  } = useCalendar(
    initialYear ?? today.getFullYear(),
    initialMonth ?? today.getMonth(),
    onSelect
  );

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthGestureHandler = useAnimatedGestureHandler<
    PanGestureHandlerGestureEvent,
    { startX: number }
  >({
    onStart: (_, ctx) => {
      ctx.startX = translateX.value;
    },
    onActive: (event, ctx) => {
      translateX.value = ctx.startX + event.translationX;
      opacity.value = withTiming(0.5, { duration: 100 });
    },
    onEnd: (event) => {
      const { translationX } = event;
      if (Math.abs(translationX) > 50) {
        const increment = translationX > 0 ? -1 : 1;
        runOnJS(changeMonth)(increment);
      }
      translateX.value = withTiming(0);
      opacity.value = withTiming(1);
    },
  });

  const yearGestureHandler = useAnimatedGestureHandler<
    PanGestureHandlerGestureEvent,
    { startY: number }
  >({
    onStart: (_, ctx) => {
      ctx.startY = yearTranslateX.value;
    },
    onActive: (event, ctx) => {
      yearTranslateX.value = ctx.startY + event.translationY;
      yearOpacity.value = withTiming(0.5, { duration: 100 });
    },
    onEnd: (event) => {
      const { translationY } = event;
      if (Math.abs(translationY) > 50) {
        const increment = translationY > 0 ? -1 : 1;
        runOnJS(changeYear)(increment);
      }
      yearTranslateX.value = withTiming(0);
      yearOpacity.value = withTiming(1);
    },
  });

  // Build days grid for a given year/month, always starting with 1 in the first cell
  function buildDaysGrid(y: number, m: number) {
    const daysInMonth = getDaysInMonth(y, m);
    const firstDayOfWeek = getFirstDayOfWeek(y, m); // 0=Monday
    const days: { n: number; faded: boolean }[] = [];
    // Add blanks before the 1st
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push({ n: 0, faded: true });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({ n: d, faded: false });
    }
    // Fill the rest of the last row with blanks so each row is 7 days
    const remainder = days.length % 7;
    if (remainder !== 0) {
      for (let i = 0; i < 7 - remainder; i++) {
        days.push({ n: 0, faded: true });
      }
    }
    return days;
  }
  const currentDays = buildDaysGrid(year, month);

  // Month names
  const MONTHS = [
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

  // In the render, remove any rotatedDays or weekday offset logic and just use DAYS as the headings.
  const firstDay = getFirstDayOfWeek(year, month); // 0=Monday
  const rotatedDays = DAYS.slice(firstDay).concat(DAYS.slice(0, firstDay));

  // Helper to chunk array into rows of 7
  function chunkIntoRows(daysArr: { n: number; faded: boolean }[]) {
    const rows = [];
    for (let i = 0; i < daysArr.length; i += 7) {
      rows.push(daysArr.slice(i, i + 7));
    }
    return rows;
  }

  return (
    <View style={styles.container}>
      {/* Year and Month selectors with solid color */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          marginBottom: 2,
        }}
      >
        <Pressable onPress={() => changeYear(-1)} style={styles.arrowCircle}>
          <Ionicons name="chevron-back" size={12} style={styles.arrowIcon} />
        </Pressable>
        <PanGestureHandler onGestureEvent={yearGestureHandler}>
          <Animated.View
            style={[
              yearAnimatedStyle,
              {
                minWidth: 48,
                alignItems: "center",
                shadowColor: "#22C55E",
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              },
            ]}
          >
            <View
              style={{
                borderRadius: 16,
                paddingHorizontal: 14,
                paddingVertical: 4,
                backgroundColor: "#22C55E",
                borderWidth: 1,
                borderColor: "#16A34A",
              }}
            >
              <Text style={[styles.monthYear, { color: "#FFF" }]}>{year}</Text>
            </View>
          </Animated.View>
        </PanGestureHandler>
        <Pressable onPress={() => changeYear(1)} style={styles.arrowCircle}>
          <Ionicons name="chevron-forward" size={12} style={styles.arrowIcon} />
        </Pressable>
      </View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          marginBottom: 6,
        }}
      >
        <Pressable onPress={() => changeMonth(-1)} style={styles.arrowCircle}>
          <Ionicons name="chevron-back" size={12} style={styles.arrowIcon} />
        </Pressable>
        <PanGestureHandler onGestureEvent={monthGestureHandler}>
          <Animated.View
            style={[
              animatedStyle,
              {
                minWidth: 64,
                alignItems: "center",
                shadowColor: "#22C55E",
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              },
            ]}
          >
            <View
              style={{
                borderRadius: 16,
                paddingHorizontal: 18,
                paddingVertical: 4,
                backgroundColor: "#22C55E",
                borderWidth: 1,
                borderColor: "#16A34A",
              }}
            >
              <Text style={[styles.monthYear, { color: "#FFF" }]}>
                {currentDate.toLocaleString("default", { month: "long" })}
              </Text>
            </View>
          </Animated.View>
        </PanGestureHandler>
        <Pressable onPress={() => changeMonth(1)} style={styles.arrowCircle}>
          <Ionicons name="chevron-forward" size={12} style={styles.arrowIcon} />
        </Pressable>
      </View>
      {/* Days of week */}
      <View style={styles.daysRow}>
        {DAYS.map((d, i) => (
          <Text key={i} style={styles.dayHeading}>
            {d}
          </Text>
        ))}
      </View>
      {/* Add a horizontal line below the weekdays row */}
      <View
        style={{
          height: 1,
          backgroundColor: "#E5E7EB",
          width: "100%",
          marginBottom: 0,
        }}
      />
      {/* Days grid (standard calendar layout) */}
      <View style={{ width: "100%" }}>
        {chunkIntoRows(buildDaysGrid(year, month)).map((row, rowIdx) => (
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
                selectedDate.value &&
                selectedDate.value.getFullYear() === year &&
                selectedDate.value.getMonth() === month &&
                selectedDate.value.getDate() === day.n;
              const isToday =
                today.getFullYear() === year &&
                today.getMonth() === month &&
                today.getDate() === day.n;
              const isExpired = day.faded;
              return (
                <Pressable
                  key={colIdx}
                  style={[
                    styles.dayCell,
                    isExpired && styles.dayButtonExpired,
                    isSelected && styles.dayButtonSelected,
                    isToday &&
                      !isSelected && {
                        borderWidth: 1,
                        borderColor: "#22C55E",
                        borderRadius: 10,
                      },
                    !isExpired && !isSelected && styles.dayButton,
                  ]}
                  disabled={isExpired}
                  onPress={() => selectDate(currentDateObj)}
                >
                  <Text
                    style={[
                      styles.dayText,
                      isExpired && styles.dayTextExpired,
                      isSelected && styles.dayTextSelected,
                      isToday &&
                        !isSelected && { color: "#22C55E", fontWeight: "700" },
                    ]}
                  >
                    {day.n}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
      {/* Always render the line and selected date container, but only show text if selectedDate is valid */}
      <View
        style={{
          width: "100%",
          alignItems: "center",
          minHeight: 38,
          marginTop: 0,
          paddingTop: 0,
        }}
      >
        <View
          style={{
            height: 1,
            backgroundColor: "#E5E7EB",
            width: "100%",
            marginTop: 0,
            marginBottom: 0,
          }}
        />
        {selectedDate.value &&
        selectedDate.value.getFullYear() === year &&
        selectedDate.value.getMonth() === month &&
        buildDaysGrid(year, month).some(
          (day) => day.n === selectedDate.value?.getDate()
        ) ? (
          <>
            <Text
              style={{
                fontSize: 12,
                color: "#A1A1AB",
                fontFamily: "SpaceMono",
                marginBottom: 0,
                marginTop: 4,
              }}
            >
              Selected date
            </Text>
            <Text
              style={{
                fontSize: 9,
                color: "#A1A1AB",
                fontFamily: "SpaceMono",
                marginTop: 0,
              }}
            >
              {selectedDate.value.toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Text>
          </>
        ) : null}
      </View>
    </View>
  );
}
