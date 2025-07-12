import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { State as GestureState, PanGestureHandler } from 'react-native-gesture-handler';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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
    backgroundColor: '#FFF',
    borderRadius: 18, // reduced from 24
    padding: 8, // reduced from 12
    alignItems: 'center',
    width: 220, // reduced from 300
    shadowColor: '#22C55E',
    shadowOpacity: 0.10,
    shadowRadius: 10, // reduced from 16
    elevation: 4, // reduced from 6
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginVertical: 8, // reduced from 12
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6, // reduced from 8
    gap: 6, // reduced from 8
  },
  arrowCircle: {
    backgroundColor: '#E6F9EF',
    borderRadius: 999,
    width: 22, // reduced from 28
    height: 22, // reduced from 28
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
    shadowColor: '#22C55E',
    shadowOpacity: 0.08,
    shadowRadius: 2, // reduced from 4
    elevation: 1, // reduced from 2
  },
  arrowIcon: {
    color: '#22C55E',
    fontSize: 12, // reduced from 16
  },
  monthYear: {
    fontSize: 13, // reduced from 15
    fontWeight: '700',
    fontFamily: 'SpaceMono',
    letterSpacing: 0.5,
    marginHorizontal: 6,
    textAlign: 'center',
  },
  gradientText: {
    backgroundColor: 'linear-gradient(90deg, #22C55E 0%, #A7F3D0 100%)',
    color: '#22C55E',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 6, // reduced from 8
    marginBottom: 2, // reduced from 4
    // Remove borderBottomWidth and borderColor to avoid double line
    // borderBottomWidth: 1,
    // borderColor: '#E5E7EB',
    paddingBottom: 2, // reduced from 4
  },
  dayHeading: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '700',
    color: '#A1A1AB',
    fontSize: 9, // reduced from 10
    fontFamily: 'SpaceMono',
    letterSpacing: 0.1,
    textTransform: 'uppercase',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    marginTop: 1, // reduced from 2
    marginBottom: 2, // reduced from 4
    // Add fixed height for 6 rows of cells (6 * cell size + margins)
    minHeight: 6 * 28, // 6 rows * (cell height + margin), cell height is 26 + margin 1 top/bottom
    maxHeight: 6 * 28,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 0.5, // reduced from 1
  },
  dayButton: {
    width: 20, // reduced from 26
    height: 20, // reduced from 26
    borderRadius: 10, // reduced from 13
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
    margin: 0.5, // reduced from 1
  },
  dayButtonToday: {
    borderColor: '#22C55E',
    backgroundColor: '#E6F9EF',
  },
  dayButtonSelected: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
    // Remove shadow and force circle
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButtonExpired: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  dayText: {
    fontSize: 11, // slightly larger for better readability
    color: '#222',
    fontWeight: '600',
    fontFamily: 'SpaceMono',
    textAlign: 'center',
    lineHeight: 14,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  dayTextSelected: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'SpaceMono',
    textAlign: 'center',
    lineHeight: 14,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  dayTextExpired: {
    color: '#D1D5DB',
    textDecorationLine: 'line-through',
  },
  todayLabel: {
    fontSize: 8, // reduced from 9
    color: '#22C55E',
    marginTop: 1, // reduced from 2
    fontWeight: '700',
  },
  summary: {
    marginTop: 6, // reduced from 10
    fontSize: 12, // reduced from 15
    color: '#22C55E',
    fontWeight: '600',
    fontFamily: 'SpaceMono',
    textAlign: 'center',
  },
});

export function Calendar({ selectedDate, onSelect, initialYear, initialMonth, minDate, maxDate }: CalendarProps) {
  const today = new Date();
  const [year, setYear] = useState(initialYear ?? today.getFullYear());
  const [month, setMonth] = useState(initialMonth ?? today.getMonth());
  // Animation state for year/month carousel
  const [animatingMonth, setAnimatingMonth] = useState(false);
  const [animatingYear, setAnimatingYear] = useState(false);
  const [pendingMonth, setPendingMonth] = useState<number | null>(null);
  const [pendingYear, setPendingYear] = useState<number | null>(null);
  const monthAnim = useRef(new Animated.Value(0)).current;
  const yearAnim = useRef(new Animated.Value(0)).current;
  // Use a horizontal rolling animation for weekday headings
  const [headingAnim, setHeadingAnim] = useState(new Animated.Value(0));
  const [pendingHeadings, setPendingHeadings] = useState<string[] | null>(null);
  const [headingDir, setHeadingDir] = useState<'left'|'right'>('left');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  // Build days grid for a given year/month, always starting with 1 in the first cell
  function buildDaysGrid(y: number, m: number) {
    const daysInMonth = getDaysInMonth(y, m);
    const firstDayOfWeek = getFirstDayOfWeek(y, m); // 0=Monday
    const days: { n: number, faded: boolean }[] = [];
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

  // Carousel animation for month
  function animateMonthCarousel(dir: 'left'|'right', onDone: () => void) {
    setAnimatingMonth(true);
    monthAnim.setValue(0);
    Animated.sequence([
      Animated.timing(monthAnim, {
        toValue: dir === 'left' ? -1 : 1,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(monthAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      })
    ]).start(() => {
      setAnimatingMonth(false);
      monthAnim.setValue(0);
      onDone();
    });
  }
  // Carousel animation for year (sideways)
  function animateYearCarousel(dir: 'left'|'right', onDone: () => void) {
    setAnimatingYear(true);
    yearAnim.setValue(0);
    Animated.sequence([
      Animated.timing(yearAnim, {
        toValue: dir === 'left' ? -1 : 1,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(yearAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      })
    ]).start(() => {
      setAnimatingYear(false);
      yearAnim.setValue(0);
      onDone();
    });
  }

  // Animate weekday headings when month/year changes
  function animateHeadings(dir: 'left'|'right', onDone: () => void) {
    setHeadingDir(dir);
    headingAnim.setValue(0);
    Animated.sequence([
      Animated.timing(headingAnim, {
        toValue: dir === 'left' ? -1 : 1,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(headingAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      })
    ]).start(onDone);
  }

  // Wrap month/year change handlers to also animate headings
  function handleMonthChange(dir: number) {
    if (animatingMonth) return;
    let newMonth = month + dir;
    let newYear = year;
    if (newMonth < 0) { newMonth = 11; newYear--; }
    if (newMonth > 11) { newMonth = 0; newYear++; }
    if (newYear < currentYear || (newYear === currentYear && newMonth < currentMonth)) return;
    const newFirstDay = getFirstDayOfWeek(newYear, newMonth);
    const newRotatedDays = DAYS.slice(newFirstDay).concat(DAYS.slice(0, newFirstDay));
    setPendingHeadings(newRotatedDays);
    animateHeadings(dir === 1 ? 'left' : 'right', () => {
      setMonth(newMonth);
      setYear(newYear);
      setPendingHeadings(null);
    });
    animateMonthCarousel(dir === 1 ? 'left' : 'right', () => {});
  }
  function handleYearChange(dir: number) {
    if (animatingYear) return;
    const newYear = year + dir;
    if (newYear < currentYear) return;
    const newFirstDay = getFirstDayOfWeek(newYear, month);
    const newRotatedDays = DAYS.slice(newFirstDay).concat(DAYS.slice(0, newFirstDay));
    setPendingHeadings(newRotatedDays);
    animateHeadings(dir === 1 ? 'left' : 'right', () => {
      setYear(newYear);
      setPendingHeadings(null);
    });
    animateYearCarousel(dir === 1 ? 'left' : 'right', () => {});
  }

  // Gesture handling for month/year
  function onMonthGesture({ nativeEvent }: any) {
    if (animatingMonth) return;
    if (nativeEvent.state === GestureState.END) {
      if (Math.abs(nativeEvent.translationX) > 40) {
        if (nativeEvent.translationX < 0 && !(year === currentYear && month >= 11)) handleMonthChange(1);
        else if (nativeEvent.translationX > 0 && !(year === currentYear && month <= currentMonth)) handleMonthChange(-1);
      }
    }
  }
  // Update gesture handling for year: left/right, not up/down
  function onYearGesture({ nativeEvent }: any) {
    if (animatingYear) return;
    if (nativeEvent.state === GestureState.END) {
      if (Math.abs(nativeEvent.translationX) > 40) {
        if (nativeEvent.translationX < 0) handleYearChange(1);
        else handleYearChange(-1);
      }
    }
  }

  // Animated styles for month/year
  const monthStyle = {
    opacity: monthAnim.interpolate({ inputRange: [-1, 0, 1], outputRange: [0, 1, 0] }),
    transform: [
      { translateX: monthAnim.interpolate({ inputRange: [-1, 0, 1], outputRange: [-40, 0, 40] }) },
    ],
  };
  // Animated style for year: fade/slide left/right
  const yearStyle = {
    opacity: yearAnim.interpolate({ inputRange: [-1, 0, 1], outputRange: [0, 1, 0] }),
    transform: [
      { translateX: yearAnim.interpolate({ inputRange: [-1, 0, 1], outputRange: [-40, 0, 40] }) },
    ],
  };

  // Animated style for weekday headings (horizontal roll)
  const headingStyle = {
    opacity: headingAnim.interpolate({ inputRange: [-1, 0, 1], outputRange: [0, 1, 0] }),
    transform: [
      { translateX: headingAnim.interpolate({ inputRange: [-1, 0, 1], outputRange: [-40, 0, 40] }) },
    ],
  };

  // Fade animation for days not in month
  const fadeAnim = useMemo(() => new Animated.Value(1), [month, year]);

  // Month names
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  // In the render, remove any rotatedDays or weekday offset logic and just use DAYS as the headings.
  const firstDay = getFirstDayOfWeek(year, month); // 0=Monday
  const rotatedDays = DAYS.slice(firstDay).concat(DAYS.slice(0, firstDay));

  // Helper to chunk array into rows of 7
  function chunkIntoRows(daysArr: { n: number, faded: boolean }[]) {
    const rows = [];
    for (let i = 0; i < daysArr.length; i += 7) {
      rows.push(daysArr.slice(i, i + 7));
    }
    return rows;
  }

  return (
    <View style={styles.container}>
      {/* Year and Month selectors with solid color */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 2 }}>
        <Pressable onPress={() => !animatingYear && year > currentYear && handleYearChange(-1)} style={styles.arrowCircle} disabled={year <= currentYear}>
          <Ionicons name="chevron-back" size={12} style={styles.arrowIcon} />
        </Pressable>
        <PanGestureHandler onHandlerStateChange={onYearGesture} enabled={!animatingYear}>
          <Animated.View style={[yearStyle, { minWidth: 48, alignItems: 'center', shadowColor: '#22C55E', shadowOpacity: 0.10, shadowRadius: 4, elevation: 2 }]}> 
            <View style={{ borderRadius: 16, paddingHorizontal: 14, paddingVertical: 4, backgroundColor: '#22C55E', borderWidth: 1, borderColor: '#16A34A' }}>
              <Text style={[styles.monthYear, { color: '#FFF' }]}>{pendingYear !== null ? pendingYear : year}</Text>
            </View>
          </Animated.View>
        </PanGestureHandler>
        <Pressable onPress={() => !animatingYear && handleYearChange(1)} style={styles.arrowCircle}>
          <Ionicons name="chevron-forward" size={12} style={styles.arrowIcon} />
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 6 }}>
        <Pressable onPress={() => !animatingMonth && !(year === currentYear && month <= currentMonth) && handleMonthChange(-1)} style={styles.arrowCircle} disabled={year === currentYear && month <= currentMonth}>
          <Ionicons name="chevron-back" size={12} style={styles.arrowIcon} />
        </Pressable>
        <PanGestureHandler onHandlerStateChange={onMonthGesture} enabled={!animatingMonth}>
          <Animated.View style={[monthStyle, { minWidth: 64, alignItems: 'center', shadowColor: '#22C55E', shadowOpacity: 0.10, shadowRadius: 4, elevation: 2 }]}> 
            <View style={{ borderRadius: 16, paddingHorizontal: 18, paddingVertical: 4, backgroundColor: '#22C55E', borderWidth: 1, borderColor: '#16A34A' }}>
              <Text style={[styles.monthYear, { color: '#FFF' }]}>{pendingMonth !== null ? MONTHS[pendingMonth] : MONTHS[month]}</Text>
            </View>
          </Animated.View>
        </PanGestureHandler>
        <Pressable onPress={() => !animatingMonth && handleMonthChange(1)} style={styles.arrowCircle}>
          <Ionicons name="chevron-forward" size={12} style={styles.arrowIcon} />
        </Pressable>
      </View>
      {/* Days of week */}
      <View style={styles.daysRow}>
        {DAYS.map((d, i) => <Text key={i} style={styles.dayHeading}>{d}</Text>)}
      </View>
      {/* Add a horizontal line below the weekdays row */}
      <View style={{ height: 1, backgroundColor: '#E5E7EB', width: '100%', marginBottom: 0 }} />
      {/* Days grid (standard calendar layout) */}
      <View style={{ width: '100%' }}>
        {chunkIntoRows(buildDaysGrid(year, month)).map((row, rowIdx) => (
          <View key={rowIdx} style={{ flexDirection: 'row', width: '100%' }}>
            {row.map((day, colIdx) => {
              if (day.n === 0) {
                return <View key={colIdx} style={styles.dayCell}><Text style={{ color: '#E5E7EB' }}> </Text></View>;
              }
              const isSelected = selectedDate &&
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
                    isToday && !isSelected && { borderWidth: 1, borderColor: '#22C55E', borderRadius: 10 },
                    !isExpired && !isSelected && styles.dayButton,
                  ]}
                  disabled={isExpired || animatingMonth || animatingYear}
                  onPress={() => onSelect(new Date(year, month, day.n))}
                >
                  <Text style={[
                    styles.dayText,
                    isExpired && styles.dayTextExpired,
                    isSelected && styles.dayTextSelected,
                    isToday && !isSelected && { color: '#22C55E', fontWeight: '700' },
                  ]}>{day.n}</Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
      {/* Always render the line and selected date container, but only show text if selectedDate is valid */}
      <View style={{ width: '100%', alignItems: 'center', minHeight: 38, marginTop: 0, paddingTop: 0 }}>
        <View style={{ height: 1, backgroundColor: '#E5E7EB', width: '100%', marginTop: 0, marginBottom: 0 }} />
        {selectedDate &&
          selectedDate.getFullYear() === year &&
          selectedDate.getMonth() === month &&
          buildDaysGrid(year, month).some(day => day.n === selectedDate.getDate()) ? (
          <>
            <Text style={{ fontSize: 12, color: '#A1A1AB', fontFamily: 'SpaceMono', marginBottom: 0, marginTop: 4 }}>Selected date</Text>
            <Text style={{ fontSize: 9, color: '#A1A1AB', fontFamily: 'SpaceMono', marginTop: 0 }}>
              {selectedDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
            </Text>
          </>
        ) : null}
      </View>
      {/* Choose Date Button */}
      <Pressable
        style={{ marginTop: 8, paddingVertical: 3, paddingHorizontal: 10, backgroundColor: '#22C55E', borderRadius: 10, alignItems: 'center', alignSelf: 'center' }}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 10 }}>Choose Date</Text>
      </Pressable>
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate || today}
          mode="date"
          display="default"
          onChange={(event: any, date?: Date) => {
            setShowDatePicker(false);
            if (date) onSelect(date);
          }}
        />
      )}
    </View>
  );
}

 