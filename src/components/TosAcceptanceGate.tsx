import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { FULL_LEGAL_SECTIONS } from '../constants/legal';
import { acceptLegalTerms, acknowledgeLocationPrivacy } from '../services/userService';
import { colors } from '../constants/theme';

type Props = {
  visible: boolean;
  userId: string;
  needsTos: boolean;
  needsLocationAck: boolean;
  onAccepted: () => void;
};

const TosAcceptanceGate: React.FC<Props> = ({
  visible,
  userId,
  needsTos,
  needsLocationAck,
  onAccepted,
}) => {
  const [busy, setBusy] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const handleAccept = async () => {
    if (needsTos && !agreed) {
      return;
    }
    setBusy(true);
    try {
      if (needsTos) {
        await acceptLegalTerms(userId);
      }
      if (needsLocationAck) {
        await acknowledgeLocationPrivacy(userId);
      }
      onAccepted();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <Text style={styles.title}>Before you play</Text>
        <Text style={styles.subtitle}>Review terms, waiver, and how we use location.</Text>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {FULL_LEGAL_SECTIONS.map((section) => (
            <View key={section.title} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.body}>{section.body}</Text>
            </View>
          ))}
        </ScrollView>
        {needsTos ? (
          <TouchableOpacity style={styles.checkRow} onPress={() => setAgreed((v) => !v)}>
            <Text style={styles.checkbox}>{agreed ? '☑' : '☐'}</Text>
            <Text style={styles.checkLabel}>I agree to the terms and activity waiver</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          style={[styles.button, (busy || (needsTos && !agreed)) && styles.buttonDisabled]}
          onPress={handleAccept}
          disabled={busy || (needsTos && !agreed)}
        >
          <Text style={styles.buttonText}>{busy ? 'Saving...' : 'Continue'}</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 48, paddingHorizontal: 20 },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { marginTop: 6, color: '#666', marginBottom: 12 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 16 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 6 },
  body: { fontSize: 14, color: '#444', lineHeight: 20 },
  checkRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  checkbox: { fontSize: 20, marginRight: 8 },
  checkLabel: { flex: 1, fontSize: 14 },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

export default TosAcceptanceGate;
