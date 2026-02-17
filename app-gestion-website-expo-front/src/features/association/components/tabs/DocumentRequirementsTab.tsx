import React, { useMemo, useState } from "react";
import { useDocumentRequirements } from "../../hooks/useDocumentRequirements";
import { isWeb } from "@/src/utils/responsive";
import { Alert, TouchableOpacity } from "react-native";
import { LoadingSpinner } from "@/src/components/ui/LoadingSpinner";
import { ScrollView, Styles, Text, TextInput, View } from "dripsy";
import {
  borderRadius,
  colors,
  shadows,
  spacing,
  textStyles,
} from "@/src/theme";
import { Edit3, FileText, Plus, Search, Trash2 } from "lucide-react-native";
import { Button } from "@/src/components/ui";
import { Modal } from "@/src/components/ui/Modal";

export const DocumentRequirementsTab: React.FC = () => {
  const {
    requirements,
    loadingRequirements,
    availableDocumentTypes,
    loadingTypes,
    availableDocuments,
    loadingTemplates,
    createRequirement,
    updateRequirement,
    deleteRequirement,
    createCustomType,
  } = useDocumentRequirements();

  const [showRequirementModal, setShowRequirementModal] = useState(false);
  const [selectedRequirementId, setSelectedRequirementId] = useState<
    number | null
  >(null);
  const [searchTypeQuery, setSearchTypeQuery] = useState("");

  //From useState
  const [formDocumentTypeId, setFormDocumentTypeId] = useState<number | null>(
    null,
  );
  const [formCustomName, setFormCustomName] = useState("");
  const [formCustomInstructions, setFormCustomInstructions] = useState("");
  const [formIsRequired, setFormIsRequired] = useState(true);
  const [formRequiredFor, setFormRequiredFor] = useState<
    "all" | "cadets" | "candidates" | "staff"
  >("all");
  const [formRequiredAt, setFormRequiredAt] = useState<
    "registration" | "approval" | "anytime"
  >("registration");
  const [formCustomValidityDays, setFormCustomValidityDays] =
    useState<string>("");
  const [formTemplateDocumentId, setFormTemplateDocumentId] = useState<
    number | null
  >(null);
  const [savingRequirement, setSavingRequirement] = useState(false);

  const editingRequirement = useMemo(
    () => requirements.find((r) => r.id === selectedRequirementId) || null,
    [requirements, selectedRequirementId],
  );

  const resetForm = () => {
    setFormDocumentTypeId(null);
    setFormCustomName("");
    setFormCustomInstructions("");
    setFormIsRequired(true);
    setFormRequiredFor("all");
    setFormRequiredAt("registration");
    setFormCustomValidityDays("");
    setFormTemplateDocumentId(null);
  };

  const openCreateModal = () => {
    setSelectedRequirementId(null);
    resetForm();
    setShowRequirementModal(true);
  };

  const openEditModal = (id: number) => {
    const req = requirements.find((r) => r.id === id);
    if (!req) return;

    setSelectedRequirementId(id);
    setFormDocumentTypeId(req.documentTypeId);
    setFormCustomName(
      req.customName ||
        req.documentType?.displayName ||
        req.documentType?.name ||
        "",
    );
    setFormCustomInstructions(
      req.customInstructions || req.documentType?.description || "",
    );
    setFormIsRequired(req.isRequired);
    setFormRequiredFor(req.requiredFor);
    setFormRequiredAt(req.requiredAt);
    setFormCustomValidityDays(
      req.customValidityDays ? String(req.customValidityDays) : "",
    );
    setFormTemplateDocumentId(req.templateDocumentId || null);

    setShowRequirementModal(true);
  };

  const handleDeleteRequirement = async (id: number) => {
    const message = "Voulez-vous vraiment supprimer ce document requis ?";

    if (isWeb) {
      if (!confirm(message)) return;
    } else {
      const result = await new Promise<boolean>((resolve) => {
        Alert.alert("Supprimer", message, [
          { text: "Annuler", style: "cancel", onPress: () => resolve(false) },
          {
            text: "Supprimer",
            style: "destructive",
            onPress: () => resolve(true),
          },
        ]);
      });
      if (!result) return;
    }
    await deleteRequirement(id);
  };

  const handleSaveRequirement = async () => {
    if (!formDocumentTypeId) {
      Alert.alert("Erreur", "Veuillez sélectionner un type de document");
      return;
    }
    setSavingRequirement(true);
    const payload = {
      documentTypeId: formDocumentTypeId,
      customName: formCustomName || undefined,
      customInstructions: formCustomInstructions || undefined,
      isRequired: formIsRequired,
      requiredFor: formRequiredFor,
      requiredAt: formRequiredAt,
      templateDocumentId: formTemplateDocumentId || undefined,
      customValidityDays: formCustomValidityDays
        ? Number(formCustomValidityDays)
        : undefined,
    };

    let ok = false;

    if (editingRequirement) {
      ok = await updateRequirement(editingRequirement.id, payload);
    } else {
      ok = await createRequirement(payload);
    }

    setSavingRequirement(false);
    if (ok) {
      setShowRequirementModal(false);
      setSelectedRequirementId(null);
      resetForm();
    }
  };

  const filteredTypes = useMemo(
    () =>
      availableDocumentTypes.filter((t) => {
        if (!searchTypeQuery) return true;
        const q = searchTypeQuery.toLowerCase();
        return (
          t.displayName?.toLowerCase().includes(q) ||
          t.name?.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q)
        );
      }),
    [availableDocumentTypes, searchTypeQuery],
  );

  if (loadingRequirements && requirements.length === 0) {
    return <LoadingSpinner message="Chargement des données requis..." />;
  }

  return (
    <View style={styles.pageContent}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Documents requis</Text>
          <Text style={styles.subtitle}>
            Gérez les documents nécessaires pour les inscriptions et validations
          </Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={openCreateModal}>
          <Plus color={colors.navy} size={20} />
          <Text style={styles.addButtonText}>Ajouter</Text>
        </TouchableOpacity>
      </View>

      {/* Liste des documents requis */}
      {requirements.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FileText color={colors.gray[400]} size={48} />
          <Text style={styles.emptyTitle}>Aucun document requis</Text>
          <Text style={styles.emptyText}>
            Utilisez le bouton “Ajouter” pour créer vos premières exigences de
            documents.
          </Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          {requirements.map((req) => (
            <View key={req.id} style={styles.requirementCard}>
              <View style={styles.requirementMain}>
                <View style={styles.iconCircle}>
                  <FileText color={colors.navy} size={22} />
                </View>
                <View style={styles.requirementInfo}>
                  <Text style={styles.requirementName}>
                    {req.customName ||
                      req.documentType?.displayName ||
                      req.documentType?.name}
                  </Text>
                  <Text style={styles.requirementDescription} numberOfLines={2}>
                    {req.customInstructions ||
                      req.documentType?.description ||
                      "Aucune description"}
                  </Text>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaTag}>
                      {req.isRequired ? "Obligatoire" : "Optionnel"}
                    </Text>
                    <Text style={styles.metaDot}>•</Text>
                    <Text style={styles.metaTag}>
                      Pour&nbsp;
                      {req.requiredFor === "all"
                        ? "tous"
                        : req.requiredFor === "cadets"
                          ? "cadets"
                          : req.requiredFor === "candidates"
                            ? "candidats"
                            : "staff"}
                    </Text>
                    <Text style={styles.metaDot}>•</Text>
                    <Text style={styles.metaTag}>
                      Quand&nbsp;
                      {req.requiredAt === "registration"
                        ? "inscription"
                        : req.requiredAt === "approval"
                          ? "approbation"
                          : "tout moment"}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.actionEdit]}
                  onPress={() => openEditModal(req.id)}
                >
                  <Edit3 color={colors.success} size={18} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.actionDelete]}
                  onPress={() => handleDeleteRequirement(req.id)}
                >
                  <Trash2 color={colors.error} size={18} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
      {/* Modal création / édition */}
      <Modal
        visible={showRequirementModal}
        onClose={() => {
          setShowRequirementModal(false);
          setSelectedRequirementId(null);
          resetForm();
        }}
        title={
          editingRequirement
            ? "Modifier un document requis"
            : "Nouveau document requis"
        }
        subtitle="Configurez les paramètres du document"
        actions={
          <>
            <Button
              variant="outline"
              onPress={() => {
                setShowRequirementModal(false);
                setSelectedRequirementId(null);
                resetForm();
              }}
            >
              Annuler
            </Button>
            <Button
              variant="default"
              onPress={handleSaveRequirement}
              disabled={savingRequirement}
            >
              {savingRequirement
                ? "Enregistrement..."
                : editingRequirement
                  ? "Modifier"
                  : "Ajouter"}
            </Button>
          </>
        }
      >
        <ScrollView style={styles.modalContent} nestedScrollEnabled>
          {/* Type de document */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Type de document</Text>
            <View style={styles.searchRow}>
              <Search color={colors.gray[400]} size={16} />
              <TextInput
                style={styles.searchInput}
                value={searchTypeQuery}
                onChangeText={setSearchTypeQuery}
                placeholder="Rechercher un type..."
                placeholderTextColor={colors.gray[400]}
              />
            </View>

            {loadingTypes ? (
              <LoadingSpinner
                message="Chargement des types..."
                fullscreen={false}
              />
            ) : (
              <View style={styles.typeList}>
                {filteredTypes.map((type) => {
                  const isSelected = formDocumentTypeId === type.id;
                  return (
                    <TouchableOpacity
                      key={type.id}
                      style={[
                        styles.typeItem,
                        isSelected && styles.typeItemSelected,
                      ]}
                      onPress={() => {
                        setFormDocumentTypeId(type.id);
                        if (!formCustomName) {
                          setFormCustomName(type.displayName || type.name);
                        }
                        if (!formCustomInstructions && type.description) {
                          setFormCustomInstructions(type.description);
                        }
                      }}
                    >
                      <View style={styles.typeIcon}>
                        <FileText
                          color={isSelected ? colors.white : colors.navy}
                          size={18}
                        />
                      </View>
                      <View style={styles.typeInfo}>
                        <Text
                          style={[
                            styles.typeName,
                            isSelected && styles.typeNameSelected,
                          ]}
                        >
                          {type.displayName || type.name}
                        </Text>
                        {type.description ? (
                          <Text
                            style={styles.typeDescription}
                            numberOfLines={2}
                          >
                            {type.description}
                          </Text>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Nom personnalisé */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Nom affiché</Text>
            <TextInput
              style={styles.input}
              value={formCustomName}
              onChangeText={setFormCustomName}
              placeholder="Nom du document (visible par les utilisateurs)"
              placeholderTextColor={colors.gray[400]}
            />
          </View>

          {/* Instructions */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Instructions</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={formCustomInstructions}
              onChangeText={setFormCustomInstructions}
              placeholder="Instructions pour le document (format, taille, etc.)"
              placeholderTextColor={colors.gray[400]}
              multiline
            />
          </View>

          {/* Obligatoire */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Obligatoire</Text>
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setFormIsRequired(!formIsRequired)}
            >
              <View
                style={[
                  styles.checkbox,
                  formIsRequired && styles.checkboxChecked,
                ]}
              />
              <Text style={styles.checkboxLabel}>
                Document obligatoire pour valider le dossier
              </Text>
            </TouchableOpacity>
          </View>

          {/* Pour qui / Quand */}
          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.formLabel}>Pour qui</Text>
              <TouchableOpacity
                style={styles.select}
                onPress={() => {
                  const options: (typeof formRequiredFor)[] = [
                    "all",
                    "cadets",
                    "candidates",
                    "staff",
                  ];
                  const currentIndex = options.indexOf(formRequiredFor);
                  const nextIndex = (currentIndex + 1) % options.length;
                  setFormRequiredFor(options[nextIndex]);
                }}
              >
                <Text style={styles.selectText}>
                  {formRequiredFor === "all"
                    ? "Tous"
                    : formRequiredFor === "cadets"
                      ? "Cadets"
                      : formRequiredFor === "candidates"
                        ? "Candidats"
                        : "Staff"}
                </Text>
                <Text style={styles.selectHint}>Touchez pour changer</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.formLabel}>Quand</Text>
              <TouchableOpacity
                style={styles.select}
                onPress={() => {
                  const options: (typeof formRequiredAt)[] = [
                    "registration",
                    "approval",
                    "anytime",
                  ];
                  const currentIndex = options.indexOf(formRequiredAt);
                  const nextIndex = (currentIndex + 1) % options.length;
                  setFormRequiredAt(options[nextIndex]);
                }}
              >
                <Text style={styles.selectText}>
                  {formRequiredAt === "registration"
                    ? "À l’inscription"
                    : formRequiredAt === "approval"
                      ? "À l’approbation"
                      : "À tout moment"}
                </Text>
                <Text style={styles.selectHint}>Touchez pour changer</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Validité */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Validité (jours, optionnel)</Text>
            <TextInput
              style={styles.input}
              value={formCustomValidityDays}
              onChangeText={setFormCustomValidityDays}
              placeholder="Ex: 365"
              placeholderTextColor={colors.gray[400]}
              keyboardType="numeric"
            />
          </View>

          {/* Doc modèle (pour l’instant simple affichage des dispos) */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Document modèle (optionnel)</Text>
            {loadingTemplates ? (
              <LoadingSpinner
                message="Chargement des documents..."
                fullscreen={false}
              />
            ) : availableDocuments.length === 0 ? (
              <Text style={styles.hint}>
                Aucun document disponible. Tu pourras brancher ici ton upload de
                modèle.
              </Text>
            ) : (
              <View style={styles.typeList}>
                {availableDocuments.map((doc) => {
                  const isSelected = formTemplateDocumentId === doc.id;
                  return (
                    <TouchableOpacity
                      key={doc.id}
                      style={[
                        styles.typeItem,
                        isSelected && styles.typeItemSelected,
                      ]}
                      onPress={() =>
                        setFormTemplateDocumentId(isSelected ? null : doc.id)
                      }
                    >
                      <View style={styles.typeIcon}>
                        <FileText
                          color={isSelected ? colors.white : colors.navy}
                          size={18}
                        />
                      </View>
                      <View style={styles.typeInfo}>
                        <Text
                          style={[
                            styles.typeName,
                            isSelected && styles.typeNameSelected,
                          ]}
                        >
                          {doc.name}
                        </Text>
                        {doc.description ? (
                          <Text
                            style={styles.typeDescription}
                            numberOfLines={2}
                          >
                            {doc.description}
                          </Text>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
      </Modal>
    </View>
  );
};

const styles = Styles.create({
  pageContent: { flex: 1, gap: spacing.lg },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  title: {
    ...textStyles.h3,
    color: colors.navy,
  },
  subtitle: {
    ...textStyles.body,
    color: colors.gray[600],
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.navyLight,
    gap: spacing.xs,
  },
  addButtonText: {
    ...textStyles.button,
    color: colors.navy,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: spacing.xl * 1.5,
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    ...textStyles.h4,
    color: colors.navy,
    marginTop: spacing.md,
  },
  emptyText: {
    ...textStyles.body,
    color: colors.gray[600],
    textAlign: "center",
    marginTop: spacing.sm,
  },
  listContainer: {
    gap: spacing.md,
  },
  requirementCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    ...shadows.sm,
  },
  requirementMain: {
    flexDirection: "row",
    flex: 1,
    gap: spacing.md,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.navyLight,
    alignItems: "center",
    justifyContent: "center",
  },
  requirementInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  requirementName: {
    ...textStyles.bodyBold,
    color: colors.navy,
  },
  requirementDescription: {
    ...textStyles.body,
    fontSize: 13,
    color: colors.gray[600],
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  metaTag: {
    fontSize: 11,
    color: colors.gray[600],
  },
  metaDot: {
    fontSize: 11,
    color: colors.gray[400],
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.xs,
    marginLeft: spacing.md,
  },
  actionButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.full,
  },
  actionEdit: {
    backgroundColor: colors.successLight,
  },
  actionDelete: {
    backgroundColor: colors.errorLight,
  },
  modalContent: {
    maxHeight: 520,
  },
  formGroup: {
    marginBottom: spacing.md,
  },
  formLabel: {
    ...textStyles.caption,
    color: colors.gray[600],
    marginBottom: spacing.xs,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[50],
    paddingHorizontal: spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    fontSize: 14,
    color: colors.navy,
  },
  typeList: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  typeItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[200],
    gap: spacing.sm,
  },
  typeItemSelected: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  typeIcon: {
    marginTop: spacing.xs,
  },
  typeInfo: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  typeName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.navy,
  },
  typeNameSelected: {
    color: colors.white,
  },
  typeDescription: {
    fontSize: 12,
    color: colors.gray[600],
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
    color: colors.navy,
    backgroundColor: colors.gray[50],
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.gray400,
    backgroundColor: colors.white,
  },
  checkboxChecked: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  checkboxLabel: {
    fontSize: 13,
    color: colors.gray700,
  },
  formRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  select: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.gray50,
  },
  selectText: {
    fontSize: 14,
    color: colors.navy,
    fontWeight: "600",
  },
  selectHint: {
    fontSize: 11,
    color: colors.gray500,
    marginTop: 2,
  },
  hint: {
    fontSize: 12,
    color: colors.gray600,
  },
});
