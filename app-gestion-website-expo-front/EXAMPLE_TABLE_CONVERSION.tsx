// EXEMPLE DE CONVERSION: Liste de cartes → Table CADEP
// Pour les tabs Candidatures, Membres et Cadets

// ====== AVANT (Cards) ======
{requests.map((request) => (
  <View key={request.id} style={styles.card}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <View>
        <Text style={styles.name}>{request.firstname} {request.lastname}</Text>
        <Text style={styles.email}>{request.email}</Text>
      </View>
      <Badge>En attente</Badge>
    </View>
    <View style={styles.actions}>
      <TouchableOpacity onPress={() => handleValidate(request.id)}>
        <CheckCircle2 />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleReject(request.id)}>
        <X />
      </TouchableOpacity>
    </View>
  </View>
))}

// ====== APRÈS (Table CADEP) ======
<View style={styles.tableContainer}>
  {/* Table Header */}
  <View style={styles.tableHeader}>
    <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Nom & Prénom</Text>
    <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Email</Text>
    <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Date</Text>
    <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Statut</Text>
    <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Actions</Text>
  </View>

  {/* Table Rows */}
  {requests.map((request) => (
    <View key={request.id} style={styles.tableRow}>
      <View style={[styles.tableCell, { flex: 2 }]}>
        <Text style={styles.tableCellText}>
          {request.firstname} {request.lastname}
        </Text>
      </View>
      <View style={[styles.tableCell, { flex: 2 }]}>
        <Text style={styles.tableCellText}>{request.email}</Text>
      </View>
      <View style={[styles.tableCell, { flex: 1 }]}>
        <Text style={styles.tableCellText}>
          {new Date(request.requestDate).toLocaleDateString('fr-FR')}
        </Text>
      </View>
      <View style={[styles.tableCell, { flex: 1 }]}>
        <Badge variant="warning" size="sm">En attente</Badge>
      </View>
      <View style={[styles.tableCell, { flex: 1.5, flexDirection: 'row', gap: 8 }]}>
        <TouchableOpacity
          style={styles.tableActionButton}
          onPress={() => handleValidate(request.id)}
        >
          <CheckCircle2 color={colors.success} size={18} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tableActionButton}
          onPress={() => handleReject(request.id)}
        >
          <X color={colors.error} size={18} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tableActionButton}
          onPress={() => handleView(request)}
        >
          <Eye color={colors.navy} size={18} />
        </TouchableOpacity>
      </View>
    </View>
  ))}
</View>

// ====== STYLES (déjà ajoutés dans OrganizationScreen.tsx) ======
const styles = StyleSheet.create({
  tableContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.card,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.muted,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableHeaderCell: {
    ...textStyles.label,
    color: colors.mutedForeground,
    textTransform: 'uppercase',
    fontSize: 12,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
  },
  tableCell: {
    justifyContent: 'center',
  },
  tableCellText: {
    ...textStyles.body,
    color: colors.foreground,
  },
  tableActionButton: {
    padding: spacing[2],
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[100],
  },
});

// ====== NOTES ======
// 1. Les styles tableContainer, tableHeader, etc. sont déjà ajoutés au fichier OrganizationScreen.tsx
// 2. Utiliser { flex: X } pour définir la largeur des colonnes
// 3. Garder la même logique métier (handlers, conditions, etc.)
// 4. Utiliser les composants Badge du design system CADEP
