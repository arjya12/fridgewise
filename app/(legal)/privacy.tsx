import LegalPage from "@/components/LegalPage";
import {
  BodyText,
  Bullet,
  InlineLink,
  LinkText,
  MutedText,
  SectionTitle,
} from "@/components/LegalText";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function PrivacyScreen() {
  return (
    <LegalPage title="Privacy Policy">
      <View style={styles.introSection}>
        <MutedText>Last updated: April 28, 2026</MutedText>
        <BodyText>
          FridgeWise (“we”, “us”, “our”) respects your privacy. This Privacy Policy explains what
          information we collect and how we use it when you use our mobile application.
        </BodyText>
      </View>

      <View style={styles.compactSection}>
        <SectionTitle>Information we collect</SectionTitle>

        <View style={styles.infoList}>
          <View style={styles.infoItem}>
            <Text style={styles.infoBullet}>•</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoHeading}>Account information</Text>
              <Text style={styles.infoDetail}>When you create an account, we collect your email address.</Text>
            </View>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoBullet}>•</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoHeading}>User data</Text>
              <Text style={styles.infoDetail}>
                We collect the information you add to the Service, such as food items, quantities,
                categories, and expiry dates.
              </Text>
            </View>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoBullet}>•</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoHeading}>Support information</Text>
              <Text style={styles.infoDetail}>
                If you contact us, we collect the information you provide in your message.
              </Text>
            </View>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoBullet}>•</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoHeading}>Usage data</Text>
              <Text style={styles.infoDetail}>
                We may collect basic technical information such as device type, operating system, and
                general usage data to improve performance, reliability, and user experience.
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.compactSection}>
        <SectionTitle>How we use your information</SectionTitle>
        <BodyText>We use your information to:</BodyText>
        <View style={styles.list}>
          <Bullet>Provide and operate the Service</Bullet>
          <Bullet>Store and manage your food inventory data</Bullet>
          <Bullet>Send app-related notifications (such as expiry reminders)</Bullet>
          <Bullet>Respond to support requests</Bullet>
          <Bullet>Improve the performance and functionality of the Service</Bullet>
        </View>
      </View>

      <View style={styles.compactSection}>
        <SectionTitle>Data storage and third-party services</SectionTitle>
        <BodyText>
          We use third-party services to store and process your data. In particular, FridgeWise uses
          Supabase for authentication and database services.
        </BodyText>
        <BodyText>
          These providers process your data on our behalf and are responsible for maintaining
          appropriate security measures.
        </BodyText>
        <BodyText>
          You can review Supabase’s privacy policy here:{" "}
          <InlineLink href="https://supabase.com/privacy" accessibilityLabel="Open Supabase privacy policy">
            https://supabase.com/privacy
          </InlineLink>
        </BodyText>
      </View>

      <View style={styles.compactSection}>
        <SectionTitle>Data sharing</SectionTitle>
        <BodyText>We do not sell your personal information.</BodyText>
        <BodyText>
          We may share limited information with trusted service providers that help us operate the
          Service (such as hosting, database, and email services), or if required by law.
        </BodyText>
      </View>

      <View style={styles.compactSection}>
        <SectionTitle>Data retention</SectionTitle>
        <BodyText>
          We retain your data for as long as your account is active. If you request account deletion,
          your data will be permanently removed within a reasonable timeframe.
        </BodyText>
        <BodyText>
          While we aim to handle data securely and reliably, you acknowledge that no system is
          completely free from risk, including potential data loss or unauthorized access.
        </BodyText>
      </View>

      <View style={styles.compactSection}>
        <SectionTitle>Security</SectionTitle>
        <BodyText>
          We take reasonable administrative and technical measures to protect your information.
          However, no method of transmission over the internet or electronic storage is completely
          secure, and we cannot guarantee absolute security.
        </BodyText>
      </View>

      <View style={styles.compactSection}>
        <SectionTitle>Your rights</SectionTitle>
        <BodyText>
          You may request deletion of your account and associated data at any time by contacting us.
        </BodyText>
      </View>

      <View style={styles.compactSection}>
        <SectionTitle>Children’s privacy</SectionTitle>
        <BodyText>
          FridgeWise is not intended for children under the age of 13. We do not knowingly collect
          personal information from children.
        </BodyText>
      </View>

      <View style={styles.compactSection}>
        <SectionTitle>Changes to this policy</SectionTitle>
        <BodyText>
          We may update this Privacy Policy from time to time. Updates will be posted on this page
          with a revised “Last updated” date.
        </BodyText>
      </View>

      <View style={styles.compactSection}>
        <SectionTitle>Contact</SectionTitle>
        <BodyText>If you have any questions about this Privacy Policy, contact us at:</BodyText>
        <LinkText href="mailto:fridgewise.app@gmail.com" accessibilityLabel="Email FridgeWise support">
          fridgewise.app@gmail.com
        </LinkText>
      </View>
    </LegalPage>
  );
}

const styles = StyleSheet.create({
  introSection: { gap: 8 },
  compactSection: { gap: 8 },
  infoList: { marginTop: 8, paddingLeft: 8, gap: 12 },
  infoItem: { flexDirection: "row", alignItems: "flex-start" },
  infoBullet: { color: "#111827", fontSize: 16, lineHeight: 20, marginTop: 1, marginRight: 10 },
  infoContent: { flex: 1 },
  infoHeading: {
    color: "#0F172A",
    fontSize: 16,
    lineHeight: 20,
    fontFamily: "PlusJakartaSans_700Bold",
    fontWeight: "700",
  },
  infoDetail: {
    marginTop: 4,
    color: "#334155",
    fontSize: 13,
    lineHeight: 20,
    fontFamily: "PlusJakartaSans_500Medium",
    fontWeight: "500",
  },
  list: { marginTop: 2, gap: 4 },
});

