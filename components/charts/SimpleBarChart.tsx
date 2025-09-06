// Simple Bar Chart Component using react-native-svg
// Provides customizable bar chart visualization for analytics data

import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';

export interface BarChartData {
  label: string;
  value: number;
  color?: string;
}

interface SimpleBarChartProps {
  data: BarChartData[];
  width: number;
  height: number;
  title?: string;
  showValues?: boolean;
  maxValue?: number;
  barColor?: string;
  backgroundColor?: string;
  textColor?: string;
  style?: ViewStyle;
}

export function SimpleBarChart({
  data,
  width,
  height,
  title,
  showValues = true,
  maxValue,
  barColor = '#2563EB',
  backgroundColor = 'transparent',
  textColor = '#374151',
  style
}: SimpleBarChartProps) {
  const chartHeight = height - 60; // Reserve space for labels
  const chartWidth = width - 60; // Reserve space for margins
  const maxVal = maxValue || Math.max(...data.map(d => d.value));
  const barWidth = chartWidth / data.length * 0.7;
  const barSpacing = chartWidth / data.length;

  const getBarHeight = (value: number) => {
    if (maxVal === 0) return 0;
    return (value / maxVal) * chartHeight;
  };

  return (
    <View style={[styles.container, { backgroundColor }, style]}>
      {title && (
        <Text style={[styles.title, { color: textColor }]}>{title}</Text>
      )}
      
      <Svg width={width} height={height}>
        {/* Y-axis */}
        <Line
          x1="30"
          y1="10"
          x2="30"
          y2={chartHeight + 10}
          stroke={textColor}
          strokeWidth="1"
          opacity="0.3"
        />
        
        {/* X-axis */}
        <Line
          x1="30"
          y1={chartHeight + 10}
          x2={width - 30}
          y2={chartHeight + 10}
          stroke={textColor}
          strokeWidth="1"
          opacity="0.3"
        />

        {/* Bars */}
        {data.map((item, index) => {
          const barHeight = getBarHeight(item.value);
          const x = 30 + index * barSpacing + (barSpacing - barWidth) / 2;
          const y = chartHeight + 10 - barHeight;

          return (
            <React.Fragment key={index}>
              {/* Bar */}
              <Rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={item.color || barColor}
                rx="2"
              />
              
              {/* Value label */}
              {showValues && (
                <SvgText
                  x={x + barWidth / 2}
                  y={y - 5}
                  fontSize="12"
                  fill={textColor}
                  textAnchor="middle"
                >
                  {item.value}
                </SvgText>
              )}
              
              {/* X-axis label */}
              <SvgText
                x={x + barWidth / 2}
                y={chartHeight + 25}
                fontSize="10"
                fill={textColor}
                textAnchor="middle"
              >
                {item.label.length > 8 ? `${item.label.substring(0, 8)}...` : item.label}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* Y-axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((percent, index) => {
          const value = Math.round(maxVal * percent);
          const y = chartHeight + 10 - (chartHeight * percent);
          
          return (
            <SvgText
              key={index}
              x="25"
              y={y + 3}
              fontSize="10"
              fill={textColor}
              textAnchor="end"
            >
              {value}
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

export default SimpleBarChart;