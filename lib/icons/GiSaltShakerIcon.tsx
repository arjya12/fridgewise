/**
 * Game Icons salt shaker (react-icons: `GiSaltShaker`). Renders with react-native-svg because
 * `react-icons` outputs DOM <svg> and does not work on iOS/Android.
 */
import React from "react";
import Svg, { Path } from "react-native-svg";

import { GI_SALT_SHAKER_PATH } from "./giSaltShakerPath";

export type GiSaltShakerIconProps = {
  size?: number;
  color?: string;
  weight?: "regular" | "fill" | "bold" | string;
};

export function GiSaltShakerIcon({
  size = 24,
  color = "#000",
}: GiSaltShakerIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 512 512">
      <Path d={GI_SALT_SHAKER_PATH} fill={color} />
    </Svg>
  );
}

GiSaltShakerIcon.displayName = "GiSaltShakerIcon";
