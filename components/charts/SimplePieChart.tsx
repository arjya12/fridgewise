// Simple Pie/Donut Chart Component using react-native-svg
// Provides category breakdown visualization for analytics data

import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';

export interface PieChartData {
  label: string;
  value: number;
  color: string;
}

interface SimplePieChartProps {
  data: PieChartData[];
  width: number;
  height: number;
  title?: string;
  innerRadius?: number; // Set to create donut chart
  showLabels?: boolean;
  showLegend?: boolean;
  backgroundColor?: string;
  textColor?: string;
  style?: ViewStyle;
}

export function SimplePieChart({
  data,
  width,
  height,
  title,
  innerRadius = 0,
  showLabels = true,
  showLegend = true,
  backgroundColor = 'transparent',
  textColor = '#374151',
  style
}: SimplePieChartProps) {
  const chartSize = Math.min(width, height) - 100; // Reserve space for legend
  const radius = chartSize / 2 - 20;
  const centerX = width / 2;
  const centerY = height / 2;
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <View style={[styles.container, { backgroundColor }, style]}>
        {title && (
          <Text style={[styles.title, { color: textColor }]}>{title}</Text>
        )}
        <Text style={[styles.noData, { color: textColor }]}>No data available</Text>
      </View>
    );
  }

  // Calculate angles for each slice
  let currentAngle = -Math.PI / 2; // Start from top
  const slices = data.map(item => {
    const sliceAngle = (item.value / total) * 2 * Math.PI;
    const slice = {
      ...item,
      startAngle: currentAngle,
      endAngle: currentAngle + sliceAngle,
      percentage: (item.value / total) * 100
    };
    currentAngle += sliceAngle;
    return slice;
  });

  // Create SVG path for pie slice
  const createArcPath = (startAngle: number, endAngle: number, outerRadius: number, innerRadius: number) => {
    const x1 = centerX + outerRadius * Math.cos(startAngle);
    const y1 = centerY + outerRadius * Math.sin(startAngle);
    const x2 = centerX + outerRadius * Math.cos(endAngle);
    const y2 = centerY + outerRadius * Math.sin(endAngle);
    
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
    
    if (innerRadius > 0) {
      // Donut chart
      const x3 = centerX + innerRadius * Math.cos(endAngle);
      const y3 = centerY + innerRadius * Math.sin(endAngle);
      const x4 = centerX + innerRadius * Math.cos(startAngle);
      const y4 = centerY + innerRadius * Math.sin(startAngle);
      
      return `M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`;
    } else {
      // Pie chart
      return `M ${centerX} ${centerY} L ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    }
  };

  // Get label position
  const getLabelPosition = (startAngle: number, endAngle: number, radius: number) => {
    const angle = (startAngle + endAngle) / 2;
    const labelRadius = radius * 0.7;
    return {
      x: centerX + labelRadius * Math.cos(angle),
      y: centerY + labelRadius * Math.sin(angle)
    };
  };

  return (
    <View style={[styles.container, { backgroundColor }, style]}>
      {title && (
        <Text style={[styles.title, { color: textColor }]}>{title}</Text>
      )}
      
      <Svg width={width} height={height}>
        {/* Pie slices */}
        {slices.map((slice, index) => {
          const path = createArcPath(slice.startAngle, slice.endAngle, radius, innerRadius);
          
          return (
            <React.Fragment key={index}>
              <Path
                d={path}
                fill={slice.color}
                stroke="#ffffff"
                strokeWidth="2"
              />
              
              {/* Labels on slices */}
              {showLabels && slice.percentage > 5 && (
                <SvgText
                  {...getLabelPosition(slice.startAngle, slice.endAngle, radius)}
                  fontSize="10"
                  fill="white"
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  {slice.percentage.toFixed(0)}%
                </SvgText>
              )}
            </React.Fragment>
          );
        })}

        {/* Center circle for donut chart */}
        {innerRadius > 0 && (
          <Circle
            cx={centerX}
            cy={centerY}
            r={innerRadius}
            fill={backgroundColor}
            stroke="none"
          />
        )}
      </Svg>

      {/* Legend */}
      {showLegend && (
        <View style={styles.legend}>
          {slices.map((slice, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: slice.color }]} />
              <Text style={[styles.legendText, { color: textColor }]}>
                {slice.label} ({slice.percentage.toFixed(1)}%)
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
  noData: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 50,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 15,
    paddingHorizontal: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    marginVertical: 2,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default SimplePieChart;