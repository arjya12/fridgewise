// Simple Line Chart Component using react-native-svg
// Provides trend visualization for time-series data

import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';

export interface LineChartData {
  x: string;
  y: number;
}

interface SimpleLineChartProps {
  data: LineChartData[];
  width: number;
  height: number;
  title?: string;
  showPoints?: boolean;
  lineColor?: string;
  pointColor?: string;
  backgroundColor?: string;
  textColor?: string;
  style?: ViewStyle;
}

export function SimpleLineChart({
  data,
  width,
  height,
  title,
  showPoints = true,
  lineColor = '#059669',
  pointColor = '#065F46',
  backgroundColor = 'transparent',
  textColor = '#374151',
  style
}: SimpleLineChartProps) {
  const chartHeight = height - 80; // Reserve space for labels
  const chartWidth = width - 60; // Reserve space for margins
  const maxY = Math.max(...data.map(d => d.y));
  const minY = Math.min(...data.map(d => d.y));
  const range = maxY - minY || 1;

  const getX = (index: number) => {
    return 40 + (index / (data.length - 1)) * chartWidth;
  };

  const getY = (value: number) => {
    const normalizedValue = (value - minY) / range;
    return 20 + chartHeight - (normalizedValue * chartHeight);
  };

  // Create points string for polyline
  const points = data
    .map((item, index) => `${getX(index)},${getY(item.y)}`)
    .join(' ');

  return (
    <View style={[styles.container, { backgroundColor }, style]}>
      {title && (
        <Text style={[styles.title, { color: textColor }]}>{title}</Text>
      )}
      
      <Svg width={width} height={height}>
        {/* Y-axis */}
        <Line
          x1="40"
          y1="20"
          x2="40"
          y2={chartHeight + 20}
          stroke={textColor}
          strokeWidth="1"
          opacity="0.3"
        />
        
        {/* X-axis */}
        <Line
          x1="40"
          y1={chartHeight + 20}
          x2={width - 20}
          y2={chartHeight + 20}
          stroke={textColor}
          strokeWidth="1"
          opacity="0.3"
        />

        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((percent, index) => {
          const y = 20 + chartHeight - (chartHeight * percent);
          return (
            <Line
              key={index}
              x1="40"
              y1={y}
              x2={width - 20}
              y2={y}
              stroke={textColor}
              strokeWidth="0.5"
              opacity="0.1"
              strokeDasharray="2,2"
            />
          );
        })}

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
        {showPoints && data.map((item, index) => (
          <Circle
            key={index}
            cx={getX(index)}
            cy={getY(item.y)}
            r="4"
            fill={pointColor}
          />
        ))}

        {/* Y-axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((percent, index) => {
          const value = Math.round(minY + (range * percent));
          const y = 20 + chartHeight - (chartHeight * percent);
          
          return (
            <SvgText
              key={index}
              x="35"
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
          const shouldShow = data.length <= 7 || index % Math.ceil(data.length / 7) === 0;
          if (!shouldShow) return null;

          return (
            <SvgText
              key={index}
              x={getX(index)}
              y={chartHeight + 35}
              fontSize="9"
              fill={textColor}
              textAnchor="middle"
              transform={`rotate(-45, ${getX(index)}, ${chartHeight + 35})`}
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
    borderRadius: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
});

export default SimpleLineChart;