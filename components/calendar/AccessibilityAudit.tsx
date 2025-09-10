import React from "react";
import { Text, View } from "react-native";

export const ACCESSIBILITY_GUIDELINES = {
  contrast: true,
  labels: true,
};

export const AccessibleButton: React.FC<{ label: string }> = ({ label }) => (
  <Text accessibilityRole="button">{label}</Text>
);

export const AccessibleText: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <Text>{children as any}</Text>;

const AccessibilityAudit: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  return <View>{children}</View>;
};

export default AccessibilityAudit;



