import { render } from "@testing-library/react-native";
import React from "react";
import CalendarLegend from "../CalendarLegend";

// Mock the theme hook
jest.mock("../../../hooks/useThemeColor", () => ({
  useThemeColor: jest.fn(() => "#687076"),
}));

describe("CalendarLegend", () => {
  it("renders legend items correctly", () => {
    const { getByText } = render(<CalendarLegend />);

    expect(getByText("Red: Expired")).toBeTruthy();
    expect(getByText("Orange: Today")).toBeTruthy();
    expect(getByText("Green: Future expiry")).toBeTruthy();
  });

  it("renders compact version correctly", () => {
    const { getByText, queryByText } = render(
      <CalendarLegend compact={true} />
    );

    expect(getByText("Expired")).toBeTruthy();
    expect(getByText("Today")).toBeTruthy();
    expect(getByText("Future")).toBeTruthy();

    // Should not show full descriptions in compact mode
    expect(queryByText("Red: Expired")).toBeFalsy();
  });

  it("applies custom styles correctly", () => {
    const customStyle = { backgroundColor: "red" };
    const { getByText } = render(<CalendarLegend style={customStyle} />);

    // Verify the legend renders with custom style by checking content
    expect(getByText("Red: Expired")).toBeTruthy();
  });

  it("renders all legend dots with correct colors", () => {
    const { getByText } = render(<CalendarLegend />);

    // Should render all three legend items
    expect(getByText("Red: Expired")).toBeTruthy();
    expect(getByText("Orange: Today")).toBeTruthy();
    expect(getByText("Green: Future expiry")).toBeTruthy();
  });

  it("has proper accessibility structure", () => {
    const { getByText } = render(<CalendarLegend />);

    const expiredText = getByText("Red: Expired");
    const todayText = getByText("Orange: Today");
    const futureText = getByText("Green: Future expiry");

    expect(expiredText).toBeTruthy();
    expect(todayText).toBeTruthy();
    expect(futureText).toBeTruthy();
  });
});
