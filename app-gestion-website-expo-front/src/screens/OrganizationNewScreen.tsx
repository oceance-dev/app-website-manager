import {
  Building2,
  FileCheck,
  FileText,
  GraduationCap,
  User,
} from "lucide-react-native";
import React, { useState } from "react";
import { CandidatesTab } from "@/src/components/organization/associationTabs/CandidatsTabs";
import { ScrollView, Styles, Text, View } from "dripsy";
import { colors, spacing } from "../theme";
import { TouchableOpacity } from "react-native";
import { DocumentRequirementsTab } from "../features/association/components/tabs/DocumentRequirementsTab";
import { AssociationTab } from "../features/association/components/tabs/AssociationTabs";

type TabType =
  | "association"
  | "document-requirements"
  | "request"
  | "members"
  | "cadets";

const TABS: { id: TabType; label: string; icon: React.ComponentType<any> }[] = [
  { id: "association", label: "Association", icon: Building2 },
  { id: "document-requirements", label: "Documents requis", icon: FileText },
  { id: "request", label: "Candidatures", icon: FileCheck },
  { id: "members", label: "Membres", icon: User },
  { id: "cadets", label: "Cadets", icon: GraduationCap },
];

export default function OrganizationScreen() {
  const [activeTab, setActiveTab] = useState<TabType>("association");

  const renderTabContent = () => {
    switch (activeTab) {
      case "association":
        return <AssociationTab />;
      case "document-requirements":
        return <DocumentRequirementsTab />;
      case "request":
        return <CandidatesTab />;
      case "members":
        return null;
      case "cadets":
        return null;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.iconContainer}>
            <Building2 color={colors.navy} size={32} />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Gestion de l'association</Text>
            <Text style={styles.headerSubtitle}>
              Gérez votre association, ses membres et les candidatures
            </Text>
          </View>
        </View>
      </View>
      {/* Tabs */}
      <View style={styles.topNavigation}>
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.navTab, isActive && styles.navTabActive]}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.7}
            >
              <Icon
                color={isActive ? colors.navy : colors.gray[600]}
                size={18}
              />
              <Text
                style={[styles.navTabText, isActive && styles.navTabTextActive]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderTabContent()}
      </ScrollView>
    </View>
  );
}

const styles = Styles.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.navyLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.navy,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.gray[600],
  },
  topNavigation: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderBottomWidth: 2,
    borderBottomColor: colors.gray[200],
    paddingHorizontal: spacing.md,
  },
  navTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginRight: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  navTabActive: {
    borderBottomColor: colors.navy,
  },
  navTabText: {
    fontSize: 14,
    color: colors.gray[600],
    marginLeft: spacing.sm,
    fontWeight: "500",
  },
  navTabTextActive: {
    color: colors.navy,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
});
