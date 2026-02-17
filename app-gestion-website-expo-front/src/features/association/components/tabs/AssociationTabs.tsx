import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Edit2,
  Save,
  X,
  Users,
  FileText,
  FileCheck,
} from "lucide-react-native";
import {
  colors,
  spacing,
  borderRadius,
  textStyles,
  shadows,
} from "../../../../theme";
import { useOrganizationInfo } from "../../hooks/useOrganizationInfo";
import { useOrganizationStats } from "../../hooks/useOrganizationStats";
import { LoadingSpinner } from "../../../../components/ui/LoadingSpinner";
import { Styles } from "dripsy";

export const AssociationTab: React.FC = () => {
  const {
    orgInfo,
    editedInfo,
    setEditedInfo,
    departmentInfo,
    loading,
    isEditing,
    startEditing,
    cancelEditing,
    saveEditing,
    handlePostalCodeChange,
  } = useOrganizationInfo();

  const { stats } = useOrganizationStats();

  if (loading && !orgInfo.name) {
    return (
      <LoadingSpinner message="Chargement des informations de l'association..." />
    );
  }

  return (
    <View style={styles.pageContent}>
      {/* Carte infos association */}
      <View style={styles.infoCard}>
        <View style={styles.infoCardHeader}>
          <View style={styles.infoCardHeaderLeft}>
            <View style={styles.iconContainer}>
              <Building2 color={colors.navy} size={26} />
            </View>
            <View>
              <Text style={styles.infoCardTitle}>
                Informations de l'association
              </Text>
              <Text style={styles.infoCardSubtitle}>
                Détails et paramètres de votre association
              </Text>
            </View>
          </View>

          {!isEditing ? (
            <TouchableOpacity
              style={styles.modifyButton}
              onPress={startEditing}
            >
              <Edit2 color={colors.navy} size={18} />
              <Text style={styles.modifyButtonText}>Modifier</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.editActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={cancelEditing}
              >
                <X color={colors.gray[600]} size={18} />
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={saveEditing}>
                <Save color={colors.white} size={18} />
                <Text style={styles.saveButtonText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Grid d'infos */}
        <View style={styles.infoGrid}>
          {/* Colonne 1 */}
          <View style={styles.infoColumn}>
            {/* Nom */}
            <View style={styles.infoField}>
              <Text style={styles.infoFieldLabel}>Nom</Text>
              {isEditing ? (
                <TextInput
                  style={styles.infoFieldInput}
                  value={editedInfo.name}
                  onChangeText={(text) =>
                    setEditedInfo({ ...editedInfo, name: text })
                  }
                  placeholder="Nom de l'association"
                  placeholderTextColor={colors.gray[400]}
                />
              ) : (
                <Text style={styles.infoFieldValue}>
                  {orgInfo.name || "Non renseigné"}
                </Text>
              )}
            </View>

            {/* Adresse */}
            <View style={styles.infoField}>
              <Text style={styles.infoFieldLabel}>Adresse</Text>
              {isEditing ? (
                <TextInput
                  style={[
                    styles.infoFieldInput,
                    styles.infoFieldInputMultiline,
                  ]}
                  value={editedInfo.address}
                  onChangeText={(text) =>
                    setEditedInfo({ ...editedInfo, address: text })
                  }
                  placeholder="Adresse"
                  placeholderTextColor={colors.gray[400]}
                  multiline
                />
              ) : (
                <Text style={styles.infoFieldValue}>
                  {orgInfo.address
                    ? `${orgInfo.address}\n${orgInfo.postalCode} ${orgInfo.city}`
                    : "Non renseignée"}
                </Text>
              )}
            </View>

            {/* Département (info dérivée) */}
            {departmentInfo && (
              <View style={styles.infoField}>
                <Text style={styles.infoFieldLabel}>Département</Text>
                <Text style={styles.infoFieldValue}>
                  {departmentInfo.code} - {departmentInfo.name}
                </Text>
              </View>
            )}
          </View>

          {/* Colonne 2 */}
          <View style={styles.infoColumn}>
            {/* Email */}
            <View style={styles.infoField}>
              <Text style={styles.infoFieldLabel}>Email</Text>
              <View style={styles.infoFieldValueRow}>
                <Mail color={colors.gray[600]} size={16} />
                {isEditing ? (
                  <TextInput
                    style={[styles.infoFieldInput, styles.infoFieldInputInline]}
                    value={editedInfo.email}
                    onChangeText={(text) =>
                      setEditedInfo({ ...editedInfo, email: text })
                    }
                    placeholder="Email"
                    placeholderTextColor={colors.gray[400]}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                ) : (
                  <Text
                    style={[styles.infoFieldValue, styles.infoFieldValueInline]}
                  >
                    {orgInfo.email || "Non renseigné"}
                  </Text>
                )}
              </View>
            </View>

            {/* Téléphone */}
            <View style={styles.infoField}>
              <Text style={styles.infoFieldLabel}>Téléphone</Text>
              <View style={styles.infoFieldValueRow}>
                <Phone color={colors.gray[600]} size={16} />
                {isEditing ? (
                  <TextInput
                    style={[styles.infoFieldInput, styles.infoFieldInputInline]}
                    value={editedInfo.phone}
                    onChangeText={(text) =>
                      setEditedInfo({ ...editedInfo, phone: text })
                    }
                    placeholder="Téléphone"
                    placeholderTextColor={colors.gray[400]}
                    keyboardType="phone-pad"
                  />
                ) : (
                  <Text
                    style={[styles.infoFieldValue, styles.infoFieldValueInline]}
                  >
                    {orgInfo.phone || "Non renseigné"}
                  </Text>
                )}
              </View>
            </View>

            {/* Code postal / ville */}
            <View style={styles.infoField}>
              <Text style={styles.infoFieldLabel}>Code postal & ville</Text>
              {isEditing ? (
                <View style={styles.postalRow}>
                  <TextInput
                    style={[styles.infoFieldInput, styles.postalInput]}
                    value={editedInfo.postalCode}
                    onChangeText={handlePostalCodeChange}
                    placeholder="Code postal"
                    placeholderTextColor={colors.gray[400]}
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={[styles.infoFieldInput, styles.cityInput]}
                    value={editedInfo.city}
                    onChangeText={(text) =>
                      setEditedInfo({ ...editedInfo, city: text })
                    }
                    placeholder="Ville"
                    placeholderTextColor={colors.gray[400]}
                  />
                </View>
              ) : (
                <View style={styles.infoFieldValueRow}>
                  <MapPin color={colors.gray[600]} size={16} />
                  <Text
                    style={[styles.infoFieldValue, styles.infoFieldValueInline]}
                  >
                    {orgInfo.postalCode || "----"} {orgInfo.city || ""}
                  </Text>
                </View>
              )}
            </View>

            {/* SIRET */}
            <View style={styles.infoField}>
              <Text style={styles.infoFieldLabel}>SIRET</Text>
              <Text style={styles.infoFieldValue}>
                {orgInfo.siret || "Non renseigné"}
              </Text>
            </View>

            {/* Président (info read-only dérivée) */}
            {orgInfo.president && (
              <View style={styles.infoField}>
                <Text style={styles.infoFieldLabel}>Responsable</Text>
                <Text style={styles.infoFieldValue}>{orgInfo.president}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Stats association */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View
            style={[
              styles.statIconCircle,
              { backgroundColor: colors.navyLight },
            ]}
          >
            <Users color={colors.navy} size={24} />
          </View>
          <View style={styles.statContent}>
            <Text style={styles.statNumber}>{stats.activeUsers}</Text>
            <Text style={styles.statLabel}>Membres actifs</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <View
            style={[
              styles.statIconCircle,
              { backgroundColor: colors.successLight },
            ]}
          >
            <FileText color={colors.success} size={24} />
          </View>
          <View style={styles.statContent}>
            <Text style={styles.statNumber}>{stats.documentsCount}</Text>
            <Text style={styles.statLabel}>Documents</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <View
            style={[
              styles.statIconCircle,
              { backgroundColor: colors.warningLight },
            ]}
          >
            <FileCheck color={colors.warning} size={24} />
          </View>
          <View style={styles.statContent}>
            <Text style={styles.statNumber}>{stats.foldersCount}</Text>
            <Text style={styles.statLabel}>Dossiers</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = Styles.create({
  pageContent: {
    flex: 1,
    gap: spacing.xl,
  },
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.md,
  },
  infoCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  infoCardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.navyLight,
    alignItems: "center",
    justifyContent: "center",
  },
  infoCardTitle: {
    ...textStyles.h3,
    color: colors.navy,
  },
  infoCardSubtitle: {
    ...textStyles.body,
    color: colors.gray[600],
  },
  modifyButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray[100],
    gap: spacing.xs,
  },
  modifyButtonText: {
    ...textStyles.button,
    color: colors.navy,
  },
  editActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray[100],
    gap: spacing.xs,
  },
  cancelButtonText: {
    ...textStyles.button,
    color: colors.gray[700],
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.navy,
    gap: spacing.xs,
  },
  saveButtonText: {
    ...textStyles.button,
    color: colors.white,
  },
  infoGrid: {
    flexDirection: "row",
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  infoColumn: {
    flex: 1,
    gap: spacing.md,
  },
  infoField: {
    gap: spacing.xs,
  },
  infoFieldLabel: {
    ...textStyles.caption,
    color: colors.gray[600],
  },
  infoFieldInput: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
    color: colors.navy,
    backgroundColor: colors.gray[50],
  },
  infoFieldInputMultiline: {
    minHeight: 60,
    textAlignVertical: "top",
  },
  infoFieldValue: {
    ...textStyles.body,
    color: colors.navy,
  },
  infoFieldValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  infoFieldInputInline: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  infoFieldValueInline: {
    marginLeft: spacing.sm,
  },
  postalRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  postalInput: {
    flex: 0.7,
  },
  cityInput: {
    flex: 1.3,
  },
  statsContainer: {
    flexDirection: "row",
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  statIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  statContent: {
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.navy,
  },
  statLabel: {
    fontSize: 13,
    color: colors.gray[600],
  },
});
