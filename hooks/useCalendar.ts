import { useCallback, useState } from "react";
import { LayoutAnimation } from "react-native";
import { useAnimatedStyle, useSharedValue } from "react-native-reanimated";

const customLayoutAnimation = {
  duration: 300,
  create: {
    type: LayoutAnimation.Types.easeInEaseOut,
    property: LayoutAnimation.Properties.opacity,
  },
  update: {
    type: LayoutAnimation.Types.easeInEaseOut,
  },
};

export function useCalendar(
  initialYear: number,
  initialMonth: number,
  onDateSelect: (date: Date) => void
) {
  const [currentDate, setCurrentDate] = useState(
    new Date(initialYear, initialMonth)
  );
  const selectedDate = useSharedValue<Date | null>(null);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const yearTranslateX = useSharedValue(0);
  const yearOpacity = useSharedValue(1);

  const selectDate = useCallback(
    (date: Date) => {
      selectedDate.value = date;
      onDateSelect(date);
    },
    [onDateSelect, selectedDate]
  );

  const changeMonth = useCallback(
    (increment: number) => {
      const newDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + increment,
        1
      );
      LayoutAnimation.configureNext(customLayoutAnimation);
      setCurrentDate(newDate);
    },
    [currentDate]
  );

  const changeYear = useCallback(
    (increment: number) => {
      const newDate = new Date(
        currentDate.getFullYear() + increment,
        currentDate.getMonth(),
        1
      );
      LayoutAnimation.configureNext(customLayoutAnimation);
      setCurrentDate(newDate);
    },
    [currentDate]
  );

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateX: translateX.value }],
    };
  });

  const yearAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: yearOpacity.value,
      transform: [{ translateX: yearTranslateX.value }],
    };
  });

  return {
    currentDate,
    selectedDate,
    translateX,
    opacity,
    selectDate,
    changeMonth,
    changeYear,
    animatedStyle,
    yearTranslateX,
    yearOpacity,
    yearAnimatedStyle,
  };
}
