import React from "react";
import { Platform, Text, TextProps } from "react-native";

// A safe text component that ensures all text is properly wrapped
export const SafeText: React.FC<TextProps & { children: React.ReactNode }> = ({
  style,
  children,
  ...props
}) => {
  // Ensure children is always a string
  const safeChildren = React.Children.map(children, (child) => {
    if (typeof child === "string" || typeof child === "number") {
      return child.toString();
    }
    return child;
  });

  return (
    <Text
      style={[
        {
          fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
          includeFontPadding: false,
          textAlignVertical: "center",
        },
        style,
      ]}
      {...props}
    >
      {safeChildren}
    </Text>
  );
};

export default SafeText;
