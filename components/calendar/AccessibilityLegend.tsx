import React from "react";
import { Text, View } from "react-native";

const AccessibilityLegend: React.FC = () => (
  <View>
    <Text>Red: Expired</Text>
    <Text>Orange: Today</Text>
    <Text>Green: Future expiry</Text>
  </View>
);

export default AccessibilityLegend;



