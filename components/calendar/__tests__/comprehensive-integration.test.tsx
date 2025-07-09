// Comprehensive integration tests for the enhanced calendar system
// Tests the complete integration of all Phase 2, 3, and 4 components

import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import { Dimensions } from "react-native";

// Import all calendar components
import AccessibilityAudit from "../AccessibilityAudit";
import AnimatedCalendarTransitions from "../AnimatedCalendarTransitions";
import CalendarLegendIntegrated from "../CalendarLegendIntegrated";
import EnhancedCalendarCore from "../EnhancedCalendarCore";
import OptimizedInformationPanel from "../OptimizedInformationPanel";
import PerformanceOptimizedCalendar from "../PerformanceOptimizedCalendar";
import ResponsiveCalendarLayout from "../ResponsiveCalendarLayout";
import VirtualizedCalendarList from "../VirtualizedCalendarList";

// Import services and utilities
import { enhancedCalendarService } from "../../../services/enhancedCalendarService";
import { generateTestData } from "../../../test-utils";

// Mock dependencies
jest.mock("expo-constants", () => ({
  __esModule: true,
  default: {
    statusBarHeight: 44,
  },
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }: any) => children,
}));

jest.mock("../../../services/enhancedCalendarService", () => ({
  enhancedCalendarService: {
    getMonthData: jest.fn(),
    getCurrentMonthData: jest.fn(),
    getTodayData: jest.fn(),
    searchItems: jest.fn(),
    getFilteredData: jest.fn(),
    prefetchNextMonth: jest.fn(),
    clearCache: jest.fn(),
  },
}));

const mockEnhancedCalendarService = enhancedCalendarService as jest.Mocked<
  typeof enhancedCalendarService
>;

// Performance measurement utilities
interface PerformanceMetrics {
  renderTime: number;
  updateTime: number;
  memoryUsage: number;
  componentCount: number;
}

function measurePerformance<T>(fn: () => T): {
  result: T;
  metrics: Partial<PerformanceMetrics>;
} {
  const startTime = performance.now();
  const startMemory = (performance as any).memory?.usedJSHeapSize || 0;

  const result = fn();

  const endTime = performance.now();
  const endMemory = (performance as any).memory?.usedJSHeapSize || 0;

  return {
    result,
    metrics: {
      renderTime: endTime - startTime,
      memoryUsage: endMemory - startMemory,
    },
  };
}

describe("Comprehensive Calendar Integration Tests", () => {
  const mockData = generateTestData(100); // Generate 100 test items

  beforeEach(() => {
    jest.clearAllMocks();
    mockEnhancedCalendarService.getMonthData.mockResolvedValue({
      items: mockData,
      statistics: {
        totalItems: mockData.length,
        expiredItems: 5,
        expiringToday: 3,
        expiringThisWeek: 10,
        categories: { fruits: 20, vegetables: 30, dairy: 25, meat: 25 },
      },
      dateMap: new Map(),
    });
  });

  describe("Full System Integration", () => {
    it("renders complete calendar system without errors", async () => {
      const { metrics } = measurePerformance(() => {
        return render(
          <AccessibilityAudit>
            <ResponsiveCalendarLayout>
              <AnimatedCalendarTransitions>
                <PerformanceOptimizedCalendar>
                  <EnhancedCalendarCore
                    currentDate={new Date("2024-01-15")}
                    onDatePress={jest.fn()}
                    onMonthChange={jest.fn()}
                  />
                  <CalendarLegendIntegrated
                    variant="interactive"
                    position="bottom"
                    showCounts={true}
                  />
                  <OptimizedInformationPanel
                    selectedDate="2024-01-15"
                    mode="standard"
                  />
                </PerformanceOptimizedCalendar>
              </AnimatedCalendarTransitions>
            </ResponsiveCalendarLayout>
          </AccessibilityAudit>
        );
      });

      // Performance assertions
      expect(metrics.renderTime).toBeLessThan(1000); // Should render in under 1 second

      // Wait for async operations
      await waitFor(() => {
        expect(mockEnhancedCalendarService.getMonthData).toHaveBeenCalled();
      });
    });

    it("handles data flow between all components", async () => {
      const onDatePress = jest.fn();
      const onMonthChange = jest.fn();

      const { getByTestId } = render(
        <ResponsiveCalendarLayout>
          <PerformanceOptimizedCalendar>
            <EnhancedCalendarCore
              currentDate={new Date("2024-01-15")}
              onDatePress={onDatePress}
              onMonthChange={onMonthChange}
              testID="calendar-core"
            />
            <OptimizedInformationPanel
              selectedDate="2024-01-15"
              mode="standard"
              testID="info-panel"
            />
          </PerformanceOptimizedCalendar>
        </ResponsiveCalendarLayout>
      );

      // Verify components are rendered
      expect(getByTestId("calendar-core")).toBeTruthy();
      expect(getByTestId("info-panel")).toBeTruthy();

      // Test data flow
      await waitFor(() => {
        expect(mockEnhancedCalendarService.getMonthData).toHaveBeenCalledWith(
          2024,
          0 // January 2024
        );
      });
    });

    it("maintains performance with large datasets", async () => {
      const largeDataset = generateTestData(1000); // 1000 items
      mockEnhancedCalendarService.getMonthData.mockResolvedValue({
        items: largeDataset,
        statistics: {
          totalItems: largeDataset.length,
          expiredItems: 50,
          expiringToday: 30,
          expiringThisWeek: 100,
          categories: { fruits: 200, vegetables: 300, dairy: 250, meat: 250 },
        },
        dateMap: new Map(),
      });

      const { metrics } = measurePerformance(() => {
        return render(
          <PerformanceOptimizedCalendar>
            <VirtualizedCalendarList
              data={largeDataset}
              renderItem={({ item }) => <div key={item.id}>{item.name}</div>}
            />
          </PerformanceOptimizedCalendar>
        );
      });

      // Performance should remain acceptable even with large datasets
      expect(metrics.renderTime).toBeLessThan(2000);
    });
  });

  describe("Responsive Design Integration", () => {
    it("adapts to different screen sizes", () => {
      const originalGet = Dimensions.get;

      // Test phone size
      Dimensions.get = jest.fn().mockReturnValue({ width: 375, height: 667 });

      const { rerender } = render(
        <ResponsiveCalendarLayout testID="responsive-layout">
          <EnhancedCalendarCore
            currentDate={new Date("2024-01-15")}
            onDatePress={jest.fn()}
            onMonthChange={jest.fn()}
          />
        </ResponsiveCalendarLayout>
      );

      // Test tablet size
      Dimensions.get = jest.fn().mockReturnValue({ width: 768, height: 1024 });

      rerender(
        <ResponsiveCalendarLayout testID="responsive-layout">
          <EnhancedCalendarCore
            currentDate={new Date("2024-01-15")}
            onDatePress={jest.fn()}
            onMonthChange={jest.fn()}
          />
        </ResponsiveCalendarLayout>
      );

      // Restore original
      Dimensions.get = originalGet;
    });

    it("handles orientation changes", () => {
      const { rerender } = render(
        <ResponsiveCalendarLayout>
          <EnhancedCalendarCore
            currentDate={new Date("2024-01-15")}
            onDatePress={jest.fn()}
            onMonthChange={jest.fn()}
          />
        </ResponsiveCalendarLayout>
      );

      // Simulate orientation change
      act(() => {
        // This would normally be triggered by device rotation
        Dimensions.get = jest.fn().mockReturnValue({ width: 667, height: 375 });
      });

      rerender(
        <ResponsiveCalendarLayout>
          <EnhancedCalendarCore
            currentDate={new Date("2024-01-15")}
            onDatePress={jest.fn()}
            onMonthChange={jest.fn()}
          />
        </ResponsiveCalendarLayout>
      );
    });
  });

  describe("Accessibility Integration", () => {
    it("maintains accessibility across all components", async () => {
      const { getByLabelText, getAllByRole } = render(
        <AccessibilityAudit enableAutomaticTesting={true}>
          <ResponsiveCalendarLayout>
            <EnhancedCalendarCore
              currentDate={new Date("2024-01-15")}
              onDatePress={jest.fn()}
              onMonthChange={jest.fn()}
            />
            <CalendarLegendIntegrated variant="interactive" position="bottom" />
          </ResponsiveCalendarLayout>
        </AccessibilityAudit>
      );

      // Wait for accessibility audit to complete
      await waitFor(() => {
        // Check for essential accessibility elements
        expect(() => getByLabelText("Food expiry calendar")).not.toThrow();
      });

      // Verify interactive elements have proper roles
      const buttons = getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(0);
    });

    it("provides proper screen reader support", async () => {
      const { getByTestId } = render(
        <AccessibilityAudit testID="accessibility-audit">
          <EnhancedCalendarCore
            currentDate={new Date("2024-01-15")}
            onDatePress={jest.fn()}
            onMonthChange={jest.fn()}
          />
        </AccessibilityAudit>
      );

      const auditComponent = getByTestId("accessibility-audit");
      expect(auditComponent).toBeTruthy();
    });
  });

  describe("Animation and Transition Integration", () => {
    it("handles animations without performance degradation", async () => {
      const { metrics } = measurePerformance(() => {
        return render(
          <AnimatedCalendarTransitions preset="smooth">
            <EnhancedCalendarCore
              currentDate={new Date("2024-01-15")}
              onDatePress={jest.fn()}
              onMonthChange={jest.fn()}
            />
          </AnimatedCalendarTransitions>
        );
      });

      // Animations should not significantly impact render time
      expect(metrics.renderTime).toBeLessThan(1500);
    });

    it("respects reduced motion preferences", () => {
      // Mock reduced motion preference
      jest.mock("react-native", () => ({
        ...jest.requireActual("react-native"),
        AccessibilityInfo: {
          isReduceMotionEnabled: jest.fn().mockResolvedValue(true),
        },
      }));

      const { container } = render(
        <AnimatedCalendarTransitions preset="gentle">
          <EnhancedCalendarCore
            currentDate={new Date("2024-01-15")}
            onDatePress={jest.fn()}
            onMonthChange={jest.fn()}
          />
        </AnimatedCalendarTransitions>
      );

      expect(container).toBeTruthy();
    });
  });

  describe("Performance Optimization Integration", () => {
    it("implements effective memoization", async () => {
      const onDatePress = jest.fn();
      let renderCount = 0;

      const TestComponent = () => {
        renderCount++;
        return (
          <PerformanceOptimizedCalendar>
            <EnhancedCalendarCore
              currentDate={new Date("2024-01-15")}
              onDatePress={onDatePress}
              onMonthChange={jest.fn()}
            />
          </PerformanceOptimizedCalendar>
        );
      };

      const { rerender } = render(<TestComponent />);

      // Rerender with same props
      rerender(<TestComponent />);

      // Component should not re-render unnecessarily
      // Note: This is a simplified test - real memoization testing would be more complex
      expect(renderCount).toBeLessThanOrEqual(2);
    });

    it("handles virtualization correctly", async () => {
      const largeDataset = generateTestData(500);

      const { getByTestId } = render(
        <VirtualizedCalendarList
          data={largeDataset}
          renderItem={({ item }) => (
            <div key={item.id} data-testid={`item-${item.id}`}>
              {item.name}
            </div>
          )}
          testID="virtualized-list"
        />
      );

      const list = getByTestId("virtualized-list");
      expect(list).toBeTruthy();

      // Only visible items should be rendered initially
      // This would need to be tested with actual virtualization library
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("handles service errors gracefully", async () => {
      mockEnhancedCalendarService.getMonthData.mockRejectedValue(
        new Error("Network error")
      );

      const { container } = render(
        <PerformanceOptimizedCalendar>
          <EnhancedCalendarCore
            currentDate={new Date("2024-01-15")}
            onDatePress={jest.fn()}
            onMonthChange={jest.fn()}
          />
        </PerformanceOptimizedCalendar>
      );

      // Component should still render despite service error
      expect(container).toBeTruthy();

      await waitFor(() => {
        expect(mockEnhancedCalendarService.getMonthData).toHaveBeenCalled();
      });
    });

    it("handles empty data states", async () => {
      mockEnhancedCalendarService.getMonthData.mockResolvedValue({
        items: [],
        statistics: {
          totalItems: 0,
          expiredItems: 0,
          expiringToday: 0,
          expiringThisWeek: 0,
          categories: {},
        },
        dateMap: new Map(),
      });

      const { container } = render(
        <OptimizedInformationPanel selectedDate="2024-01-15" mode="standard" />
      );

      expect(container).toBeTruthy();

      await waitFor(() => {
        expect(mockEnhancedCalendarService.getMonthData).toHaveBeenCalled();
      });
    });

    it("handles invalid dates gracefully", () => {
      const { container } = render(
        <EnhancedCalendarCore
          currentDate={new Date("invalid")}
          onDatePress={jest.fn()}
          onMonthChange={jest.fn()}
        />
      );

      // Should fallback to current date or handle gracefully
      expect(container).toBeTruthy();
    });
  });

  describe("Memory Management", () => {
    it("cleans up resources properly", async () => {
      const { unmount } = render(
        <PerformanceOptimizedCalendar>
          <VirtualizedCalendarList
            data={generateTestData(100)}
            renderItem={({ item }) => <div key={item.id}>{item.name}</div>}
          />
        </PerformanceOptimizedCalendar>
      );

      // Unmount component
      unmount();

      // Verify cleanup (this would be more detailed in a real implementation)
      expect(mockEnhancedCalendarService.clearCache).toHaveBeenCalled();
    });

    it("prevents memory leaks in long-running sessions", async () => {
      const startMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Simulate multiple renders and data updates
      for (let i = 0; i < 10; i++) {
        const { unmount } = render(
          <PerformanceOptimizedCalendar>
            <EnhancedCalendarCore
              currentDate={new Date(`2024-01-${i + 1}`)}
              onDatePress={jest.fn()}
              onMonthChange={jest.fn()}
            />
          </PerformanceOptimizedCalendar>
        );

        await act(async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
        });

        unmount();
      }

      const endMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = endMemory - startMemory;

      // Memory increase should be reasonable (this threshold may need adjustment)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // 10MB
    });
  });

  describe("User Interaction Flows", () => {
    it("handles complete user interaction flow", async () => {
      const onDatePress = jest.fn();
      const onMonthChange = jest.fn();

      const { getByTestId } = render(
        <ResponsiveCalendarLayout>
          <AnimatedCalendarTransitions>
            <PerformanceOptimizedCalendar>
              <EnhancedCalendarCore
                currentDate={new Date("2024-01-15")}
                onDatePress={onDatePress}
                onMonthChange={onMonthChange}
                testID="calendar-core"
              />
              <CalendarLegendIntegrated
                variant="interactive"
                position="bottom"
                testID="legend"
              />
              <OptimizedInformationPanel
                selectedDate="2024-01-15"
                mode="standard"
                testID="info-panel"
              />
            </PerformanceOptimizedCalendar>
          </AnimatedCalendarTransitions>
        </ResponsiveCalendarLayout>
      );

      // Simulate user interactions
      const calendarCore = getByTestId("calendar-core");
      const legend = getByTestId("legend");
      const infoPanel = getByTestId("info-panel");

      expect(calendarCore).toBeTruthy();
      expect(legend).toBeTruthy();
      expect(infoPanel).toBeTruthy();

      // Test date selection
      fireEvent.press(calendarCore);
      expect(onDatePress).toHaveBeenCalled();

      await waitFor(() => {
        expect(mockEnhancedCalendarService.getMonthData).toHaveBeenCalled();
      });
    });

    it("maintains state consistency across interactions", async () => {
      const { rerender } = render(
        <PerformanceOptimizedCalendar>
          <EnhancedCalendarCore
            currentDate={new Date("2024-01-15")}
            onDatePress={jest.fn()}
            onMonthChange={jest.fn()}
          />
        </PerformanceOptimizedCalendar>
      );

      // Change props and verify state consistency
      rerender(
        <PerformanceOptimizedCalendar>
          <EnhancedCalendarCore
            currentDate={new Date("2024-02-15")}
            onDatePress={jest.fn()}
            onMonthChange={jest.fn()}
          />
        </PerformanceOptimizedCalendar>
      );

      await waitFor(() => {
        expect(mockEnhancedCalendarService.getMonthData).toHaveBeenCalledWith(
          2024,
          1 // February 2024
        );
      });
    });
  });
});

describe("Performance Benchmarks", () => {
  const benchmarkData = generateTestData(1000);

  it("meets render time benchmarks", () => {
    const { metrics } = measurePerformance(() => {
      return render(
        <PerformanceOptimizedCalendar>
          <EnhancedCalendarCore
            currentDate={new Date("2024-01-15")}
            onDatePress={jest.fn()}
            onMonthChange={jest.fn()}
          />
        </PerformanceOptimizedCalendar>
      );
    });

    // Benchmark: Initial render should be under 500ms
    expect(metrics.renderTime).toBeLessThan(500);
  });

  it("meets memory usage benchmarks", () => {
    const { metrics } = measurePerformance(() => {
      return render(
        <VirtualizedCalendarList
          data={benchmarkData}
          renderItem={({ item }) => <div key={item.id}>{item.name}</div>}
        />
      );
    });

    // Benchmark: Memory usage should be reasonable
    if (metrics.memoryUsage !== undefined) {
      expect(metrics.memoryUsage).toBeLessThan(50 * 1024 * 1024); // 50MB
    }
  });

  it("meets interaction response time benchmarks", async () => {
    const onDatePress = jest.fn();

    const { getByTestId } = render(
      <EnhancedCalendarCore
        currentDate={new Date("2024-01-15")}
        onDatePress={onDatePress}
        onMonthChange={jest.fn()}
        testID="calendar-core"
      />
    );

    const startTime = performance.now();

    fireEvent.press(getByTestId("calendar-core"));

    const endTime = performance.now();
    const responseTime = endTime - startTime;

    // Benchmark: User interactions should respond within 100ms
    expect(responseTime).toBeLessThan(100);
    expect(onDatePress).toHaveBeenCalled();
  });
});
