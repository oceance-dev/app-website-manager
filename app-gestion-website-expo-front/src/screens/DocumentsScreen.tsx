import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Plus, Eye, Download, Trash2 } from 'lucide-react-native';
import { Document } from '../types';
import { initialDocuments } from '../data/mockData';
import AddDocumentModal from '../components/modalsHelper/AddDocumentModal';
import { isWeb } from '../utils/responsive';

export default function DocumentsScreen() {
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  const [showAddModal, setShowAddModal] = useState(false);

  const handleDeleteDocument = (id: number) => {
    setDocuments(documents.filter(doc => doc.id !== id));
  };

  const handleAddDocument = (newDoc: Omit<Document, 'id' | 'length' | 'date'>) => {
    const document: Document = {
      id: documents.length + 1,
      nameDoc: newDoc.nameDoc,
      type: newDoc.type,
      length: '0 KB',
      date: new Date().toISOString().split('T')[0],
    };
    setDocuments([...documents, document]);
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      PDF: '#ef4444',
      DOCX: '#3b82f6',
      XLSX: '#10b981',
      PPTX: '#f59e0b',
    };
    return colors[type] || '#64748b';
  };

  const renderDocument = ({ item }: { item: Document }) => (
    <View style={styles.documentCard}>
      <View style={styles.documentInfo}>
        <Text style={styles.documentName}>{item.nameDoc}</Text>
        <View style={styles.documentMeta}>
          <View style={[styles.typeBadge, { backgroundColor: getTypeColor(item.type) + '20' }]}>
            <Text style={[styles.typeText, { color: getTypeColor(item.type) }]}>
              {item.type}
            </Text>
          </View>
          <Text style={styles.metaText}>{item.length}</Text>
          <Text style={styles.metaText}>{item.date}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton}>
          <Eye color="#64748b" size={18} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Download color="#64748b" size={18} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleDeleteDocument(item.id)}
        >
          <Trash2 color="#ef4444" size={18} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Gestion des Documents</Text>
          <Text style={styles.subtitle}>{documents.length} document(s) au total</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Plus color="#fff" size={20} />
          <Text style={styles.addButtonText}>Ajouter</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={documents}
        renderItem={renderDocument}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <AddDocumentModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddDocument}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    padding: 20,
  },
  documentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  documentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  metaText: {
    fontSize: 12,
    color: '#64748b',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
});