// Simple Line Chart Component using react-native-svg
// Provides trend visualization for time-series data

import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import Svg, { Circle, Line, Polyline, Text as SvgText } from "react-native-svg";

export interface LineChartData {
  x: string;
  y: number;
}

interface SimpleLineChartProps {
  data: LineChartData[];
  compareData?: LineChartData[]; // ghost series for previous period
  width: number;
  height: number;
  title?: string;
  showPoints?: boolean;
  lineColor?: string;
  pointColor?: string;
  backgroundColor?: string;
  textColor?: string;
  style?: ViewStyle;
  onPointPress?: (label: string, value: number) => void;
  getPointA11yLabel?: (label: string, value: number) => string;
}

export function SimpleLineChart({
  data,
  compareData,
  width,
  height,
  title,
  showPoints = true,
  lineColor = "#059669",
  pointColor = "#065F46",
  backgroundColor = "transparent",
  textColor = "#374151",
  style,
  onPointPress,
  getPointA11yLabel,
}: SimpleLineChartProps) {
  // Add internal padding so points never touch/overflow borders
  const padding = { top: 16, right: 16, bottom: 28, left: 44 };
  const chartHeight = Math.max(1, height - (padding.top + padding.bottom));
  const chartWidth = Math.max(1, width - (padding.left + padding.right));
  const allY = [
    ...data.map((d) => d.y),
    ...(compareData ? compareData.map((d) => d.y) : []),
  ];
  // Force baseline 0 and add a small headroom buffer for the max
  const rawMax = Math.max(...(allY.length ? allY : [0]));
  const maxY = rawMax > 0 ? Math.ceil(rawMax * 1.1) : 1;
  const minY = 0;
  const range = maxY - minY || 1;

  const getX = (index: number) => {
    const denom = Math.max(1, data.length - 1);
    return padding.left + (index / denom) * chartWidth;
  };

  const getY = (value: number) => {
    const normalizedValue = (value - minY) / range;
    const y = padding.top + chartHeight - normalizedValue * chartHeight;
    // Clamp to ensure we never draw outside the padded area
    return Math.max(padding.top, Math.min(padding.top + chartHeight, y));
  };

  // Create points string for polyline
  const points = data
    .map((item, index) => `${getX(index)},${getY(item.y)}`)
    .join(" ");

  const comparePoints = (compareData ?? [])
    .map((item, index) => `${getX(index)},${getY(item.y)}`)
    .join(" ");

  return (
    <View style={[styles.container, { backgroundColor }, style]}>
      {title && (
        <Text style={[styles.title, { color: textColor }]}>{title}</Text>
      )}

      <Svg width={width} height={height}>
        {/* Y-axis */}
        <Line
          x1={String(padding.left)}
          y1={String(padding.top)}
          x2={String(padding.left)}
          y2={String(padding.top + chartHeight)}
          stroke={textColor}
          strokeWidth="1"
          opacity="0.3"
        />

        {/* X-axis */}
        <Line
          x1={String(padding.left)}
          y1={String(padding.top + chartHeight)}
          x2={String(padding.left + chartWidth)}
          y2={String(padding.top + chartHeight)}
          stroke={textColor}
          strokeWidth="1"
          opacity="0.3"
        />

        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((percent, index) => {
          const y = padding.top + chartHeight - chartHeight * percent;
          return (
            <Line
              key={index}
              x1={String(padding.left)}
              y1={y}
              x2={String(padding.left + chartWidth)}
              y2={y}
              stroke={textColor}
              strokeWidth="0.5"
              opacity="0.1"
              strokeDasharray="2,2"
            />
          );
        })}

        {/* Compare line (ghost) */}
        {compareData && compareData.length > 1 && (
          <Polyline
            points={comparePoints}
            fill="none"
            stroke={lineColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.4}
          />
        )}

        {/* Line */}
        {data.length > 1 && (
          <Polyline
            points={points}
            fill="none"
            stroke={lineColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Data points */}
        {showPoints &&
          data.map((item, index) => (
            <Circle
              key={index}
              cx={getX(index)}
              cy={getY(item.y)}
              r="4"
              fill={pointColor}
              onPress={() => onPointPress && onPointPress(item.x, item.y)}
              accessibilityLabel={
                getPointA11yLabel
                  ? getPointA11yLabel(item.x, item.y)
                  : undefined
              }
            />
          ))}

        {/* Y-axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((percent, index) => {
          const value = Math.round(minY + range * percent);
          const y = padding.top + chartHeight - chartHeight * percent;

          return (
            <SvgText
              key={index}
              x={String(padding.left - 5)}
              y={y + 3}
              fontSize="10"
              fill={textColor}
              textAnchor="end"
            >
              {value}
            </SvgText>
          );
        })}

        {/* X-axis labels - show only every few points for readability */}
        {data.map((item, index) => {
          const shouldShow =
            data.length <= 7 || index % Math.ceil(data.length / 7) === 0;
          if (!shouldShow) return null;

          return (
            <SvgText
              key={index}
              x={getX(index)}
              y={padding.top + chartHeight + 14}
              fontSize="9"
              fill={textColor}
              textAnchor="middle"
              transform={`rotate(-45, ${getX(index)}, ${
                padding.top + chartHeight + 14
              })`}
            >
              {item.x.length > 6 ? `${item.x.substring(0, 6)}...` : item.x}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    borderRadius: 12,
    overflow: "hidden",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 10,
  },
});

export default SimpleLineChart;
