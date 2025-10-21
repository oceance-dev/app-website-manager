import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { X } from 'lucide-react-native';

interface AddDocumentModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (doc: { nameDoc: string; type: 'PDF' | 'DOCX' | 'XLSX' | 'PPTX' }) => void;
}

export default function AddDocumentModal({ visible, onClose, onAdd }: AddDocumentModalProps) {
  const [nameDoc, setNom] = useState('');
  const [type, setType] = useState<'PDF' | 'DOCX' | 'XLSX' | 'PPTX'>('PDF');

  const types: Array<'PDF' | 'DOCX' | 'XLSX' | 'PPTX'> = ['PDF', 'DOCX', 'XLSX', 'PPTX'];

  const handleSubmit = () => {
    if (nameDoc.trim()) {
      onAdd({ nameDoc, type });
      setNom('');
      setType('PDF');
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Ajouter un document</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X color="#64748b" size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nom du document</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Rapport_Q1.pdf"
                value={nameDoc}
                onChangeText={setNom}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Type de fichier</Text>
              <View style={styles.typeSelector}>
                {types.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.typeButton,
                      type === t && styles.typeButtonActive
                    ]}
                    onPress={() => setType(t)}
                  >
                    <Text style={[
                      styles.typeButtonText,
                      type === t && styles.typeButtonTextActive
                    ]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.submitButton, !nameDoc.trim() && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={!nameDoc.trim()}
            >
              <Text style={styles.submitButtonText}>Ajouter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1e293b',
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#fff',
  },
  typeButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
  },
  submitButton: {
    backgroundColor: '#2563eb',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  buttonDisabled: {
    backgroundColor: '#cbd5e1',
  },
});