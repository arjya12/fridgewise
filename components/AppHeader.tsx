import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type AppHeaderProps = {
  title?: string;
  subtitle?: string;
};

/**
 * Custom app header component that matches the Figma design
 */
const AppHeader: React.FC<AppHeaderProps> = ({
  title = "FridgeWise",
  subtitle = "Smart Food Management",
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top > 0 ? insets.top : 16 },
      ]}
    >
      <Image
        source={require("../assets/images/figma/fridgewise_logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  logo: {
    width: 46,
    height: 43,
    borderRadius: 10,
    marginRight: 10,
  },
  titleContainer: {
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "500",
    color: "#626974",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 11,
    color: "#B5B8BE",
  },
});

export default AppHeader;
