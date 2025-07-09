import React, { useEffect, useRef } from "react";
import { Animated, Easing, TextStyle } from "react-native";

interface AnimatedCounterProps {
  value: number;
  style?: TextStyle;
  duration?: number;
  formatValue?: (value: number) => string;
  testID?: string;
}

/**
 * A component that animates number changes with a counting effect
 */
const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  style,
  duration = 800,
  formatValue = (val) => val.toString(),
  testID,
}) => {
  // Animation value for the counter
  const animatedValue = useRef(new Animated.Value(0)).current;
  // Store the previous value to animate from
  const prevValueRef = useRef(0);
  // Store the displayed value (for the Text component)
  const displayValueRef = useRef("0");
  // Store the animation for cleanup
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  // Update the animation when the value changes
  useEffect(() => {
    // Start from the previous value
    animatedValue.setValue(prevValueRef.current);

    // Stop any running animation
    if (animationRef.current) {
      animationRef.current.stop();
    }

    // Animate to the new value
    animationRef.current = Animated.timing(animatedValue, {
      toValue: value,
      duration,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false, // We need to use JS driver for interpolation
    });

    animationRef.current.start();

    // Store the current value as the previous value for the next animation
    prevValueRef.current = value;

    // Cleanup function to stop animation when component unmounts or value changes
    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
        animationRef.current = null;
      }
    };
  }, [value, duration]);

  // Listen to animation value changes and update the displayed value
  useEffect(() => {
    const listener = animatedValue.addListener(({ value: animValue }) => {
      // Round to avoid excessive decimal places
      const roundedValue = Math.round(animValue * 10) / 10;
      displayValueRef.current = formatValue(roundedValue);
    });

    return () => {
      animatedValue.removeListener(listener);
    };
  }, [formatValue]);

  // For testing environments, immediately set the value without animation
  useEffect(() => {
    if (process.env.NODE_ENV === "test") {
      displayValueRef.current = formatValue(value);
    }
  }, [value, formatValue]);

  return (
    <AnimatedText
      style={style}
      animatedValue={animatedValue}
      displayValueRef={displayValueRef}
      testID={testID}
    />
  );
};

// Separate component to handle re-renders efficiently
const AnimatedText = React.memo(
  ({
    style,
    animatedValue,
    displayValueRef,
    testID,
  }: {
    style?: TextStyle;
    animatedValue: Animated.Value;
    displayValueRef: React.MutableRefObject<string>;
    testID?: string;
  }) => {
    return (
      <Animated.Text style={style} testID={testID}>
        {displayValueRef.current}
      </Animated.Text>
    );
  }
);

AnimatedText.displayName = "AnimatedText";

AnimatedCounter.displayName = "AnimatedCounter";

export default AnimatedCounter;
