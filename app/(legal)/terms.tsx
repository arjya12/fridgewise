import LegalPage from "@/components/LegalPage";
import { BodyText, LinkText, MutedText, SectionTitle } from "@/components/LegalText";
import React from "react";
import { View } from "react-native";

export default function TermsScreen() {
  return (
    <LegalPage title="Terms of Service">
      <View style={{ gap: 6 }}>
        <MutedText>Last updated: April 28, 2026</MutedText>
        <BodyText>
          These Terms of Service (“Terms”) govern your use of the FridgeWise mobile application. By
          using FridgeWise, you agree to these Terms.
        </BodyText>
      </View>

      <View style={{ gap: 8 }}>
        <SectionTitle>Use of the service</SectionTitle>
        <BodyText>
          FridgeWise is provided for personal, non-commercial use. You agree to use the Service only
          for lawful purposes and in a way that does not misuse, disrupt, or interfere with the
          Service or other users.
        </BodyText>
      </View>

      <View style={{ gap: 8 }}>
        <SectionTitle>Accounts</SectionTitle>
        <BodyText>
          To use certain features, you must create an account. You are responsible for maintaining
          the confidentiality of your account and for all activity that occurs under it.
        </BodyText>
        <BodyText>You agree to provide accurate information and keep your account details up to date.</BodyText>
      </View>

      <View style={{ gap: 8 }}>
        <SectionTitle>User data</SectionTitle>
        <BodyText>
          You are responsible for the information you add to the Service, including food items and
          related data. While we take reasonable steps to store your data reliably, you acknowledge
          that data loss, corruption, or errors may occur.
        </BodyText>
        <BodyText>We are not responsible for any loss of data.</BodyText>
      </View>

      <View style={{ gap: 8 }}>
        <SectionTitle>Food tracking and reminders</SectionTitle>
        <BodyText>
          FridgeWise provides tools to help track food and send reminders (such as expiry
          notifications). These are provided for convenience only.
        </BodyText>
        <BodyText>
          We do not guarantee the accuracy, completeness, or timing of any reminders. You are solely
          responsible for monitoring food safety, storage, and consumption.
        </BodyText>
        <BodyText>
          FridgeWise is not liable for any food-related issues, including spoilage, illness, or loss.
        </BodyText>
      </View>

      <View style={{ gap: 8 }}>
        <SectionTitle>Third-party services</SectionTitle>
        <BodyText>
          FridgeWise relies on third-party services (such as Supabase) for authentication and data
          storage.
        </BodyText>
        <BodyText>
          We are not responsible for outages, data loss, or failures caused by third-party services.
        </BodyText>
      </View>

      <View style={{ gap: 8 }}>
        <SectionTitle>Intellectual property</SectionTitle>
        <BodyText>
          All content, branding, and design of FridgeWise are owned by us or our licensors. You may
          not copy, modify, distribute, or reverse engineer any part of the Service without
          permission.
        </BodyText>
      </View>

      <View style={{ gap: 8 }}>
        <SectionTitle>Termination</SectionTitle>
        <BodyText>
          We reserve the right to suspend or terminate your access to the Service at any time if you
          violate these Terms or misuse the Service.
        </BodyText>
        <BodyText>You may stop using the Service at any time and request account deletion.</BodyText>
      </View>

      <View style={{ gap: 8 }}>
        <SectionTitle>No warranties</SectionTitle>
        <BodyText>
          The Service is provided “as is” and “as available” without warranties of any kind. We do
          not guarantee that the Service will be uninterrupted, error-free, or completely secure.
        </BodyText>
      </View>

      <View style={{ gap: 8 }}>
        <SectionTitle>Limitation of liability</SectionTitle>
        <BodyText>
          To the fullest extent permitted by law, FridgeWise will not be liable for any indirect,
          incidental, special, consequential, or punitive damages, or any loss of data, food, health,
          profits, or revenues arising from your use of the Service.
        </BodyText>
        <BodyText>Your use of the Service is at your own risk.</BodyText>
      </View>

      <View style={{ gap: 8 }}>
        <SectionTitle>Changes to these Terms</SectionTitle>
        <BodyText>
          We may update these Terms from time to time. Continued use of the Service after changes
          means you accept the updated Terms.
        </BodyText>
      </View>

      <View style={{ gap: 8 }}>
        <SectionTitle>Contact</SectionTitle>
        <BodyText>If you have any questions about these Terms, contact us at:</BodyText>
        <LinkText href="mailto:fridgewise.app@gmail.com" accessibilityLabel="Email FridgeWise support">
          fridgewise.app@gmail.com
        </LinkText>
      </View>
    </LegalPage>
  );
}

