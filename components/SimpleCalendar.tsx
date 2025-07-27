import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

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
}

export function SimpleCalendar({
  selectedDate,
  onSelect,
}: SimpleCalendarProps) {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(
    selectedDate
      ? new Date(selectedDate.getFullYear(), selectedDate.getMonth())
      : new Date()
  );

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

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

    return days;
  }

  function chunkIntoRows(daysArr: { n: number; faded: boolean }[]) {
    const rows = [];
    for (let i = 0; i < daysArr.length; i += 7) {
      rows.push(daysArr.slice(i, i + 7));
    }
    return rows;
  }

  return (
    <View style={styles.container}>
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
                  style={[
                    styles.dayCell,
                    isExpired && styles.dayButtonExpired,
                    isSelected && styles.dayButtonSelected,
                    isToday && !isSelected && styles.dayButtonToday,
                    !isExpired && !isSelected && styles.dayButton,
                  ]}
                  disabled={isExpired}
                  onPress={() => onSelect(currentDateObj)}
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
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      {/* Selected date display */}
      {selectedDate && (
        <View style={styles.selectedDateContainer}>
          <Text style={styles.selectedDateText}>
            Selected: {selectedDate.toLocaleDateString()}
          </Text>
        </View>
      )}
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
    shadowColor: "#22C55E",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginVertical: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    gap: 8,
  },
  arrowCircle: {
    backgroundColor: "#E6F9EF",
    borderRadius: 999,
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 2,
    shadowColor: "#22C55E",
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
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
    fontFamily: "SpaceMono",
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    margin: 1,
  },
  dayButton: {
    borderRadius: 8,
    backgroundColor: "#F8F9FA",
  },
  dayButtonSelected: {
    backgroundColor: "#22C55E",
    borderRadius: 10,
    shadowColor: "#22C55E",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  dayButtonToday: {
    borderWidth: 1,
    borderColor: "#22C55E",
    borderRadius: 10,
  },
  dayButtonExpired: {
    backgroundColor: "transparent",
  },
  dayText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#374151",
    fontFamily: "SpaceMono",
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
