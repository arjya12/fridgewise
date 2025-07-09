import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import ActionButton from "../ActionButton";

// Mock the theme hook
jest.mock("../../../hooks/useThemeColor", () => ({
  useThemeColor: jest.fn(() => "#0a7ea4"),
}));

describe("ActionButton", () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    mockOnPress.mockClear();
  });

  it('renders "Mark as Used" button correctly', () => {
    const { getByText } = render(
      <ActionButton type="used" onPress={mockOnPress} />
    );

    expect(getByText("Mark as Used")).toBeTruthy();
  });

  it('renders "Delete" button correctly', () => {
    const { getByText } = render(
      <ActionButton type="delete" onPress={mockOnPress} />
    );

    expect(getByText("Delete")).toBeTruthy();
  });

  it("calls onPress when button is pressed", () => {
    const { getByText } = render(
      <ActionButton type="used" onPress={mockOnPress} />
    );

    fireEvent.press(getByText("Mark as Used"));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it("does not call onPress when disabled", () => {
    const { getByText } = render(
      <ActionButton type="used" onPress={mockOnPress} disabled={true} />
    );

    fireEvent.press(getByText("Mark as Used"));
    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it("renders different sizes correctly", () => {
    const { getByText: getSmall } = render(
      <ActionButton type="used" onPress={mockOnPress} size="small" />
    );
    const { getByText: getLarge } = render(
      <ActionButton type="used" onPress={mockOnPress} size="large" />
    );

    expect(getSmall("Mark as Used")).toBeTruthy();
    expect(getLarge("Mark as Used")).toBeTruthy();
  });

  it("has proper accessibility attributes", () => {
    const { getByRole } = render(
      <ActionButton type="used" onPress={mockOnPress} />
    );

    const button = getByRole("button");
    expect(button).toBeTruthy();
  });

  it("shows disabled state correctly", () => {
    const { getByRole } = render(
      <ActionButton type="used" onPress={mockOnPress} disabled={true} />
    );

    const button = getByRole("button");
    expect(button.props.accessibilityState.disabled).toBe(true);
  });

  it("handles press in and press out events", () => {
    const { getByText } = render(
      <ActionButton type="used" onPress={mockOnPress} />
    );

    const button = getByText("Mark as Used");
    fireEvent(button, "pressIn");
    fireEvent(button, "pressOut");

    // Should not throw errors
    expect(button).toBeTruthy();
  });
});
