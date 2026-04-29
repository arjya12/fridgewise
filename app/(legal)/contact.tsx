import LegalPage from "@/components/LegalPage";
import { BodyText, Bullet, InlineLink, LinkText, SectionTitle } from "@/components/LegalText";
import React from "react";
import { View } from "react-native";

export default function ContactScreen() {
  return (
    <LegalPage title="Contact">
      <View style={{ gap: 8 }}>
        <BodyText>Need help with FridgeWise? We’re happy to help.</BodyText>
        <BodyText>
          Email us at{" "}
          <InlineLink href="mailto:fridgewise.app@gmail.com" accessibilityLabel="Email FridgeWise support">
            fridgewise.app@gmail.com
          </InlineLink>
          .
        </BodyText>
      </View>

      <View style={{ gap: 8 }}>
        <SectionTitle>When you contact us</SectionTitle>
        <BodyText>To help us assist you faster, please include:</BodyText>
        <View style={{ marginTop: -6 }}>
          <Bullet>What you were trying to do</Bullet>
          <Bullet>Any error message you saw</Bullet>
          <Bullet>Your device model and whether you’re using iOS or Android</Bullet>
        </View>
      </View>
    </LegalPage>
  );
}

