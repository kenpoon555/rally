import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { colors, spacing } from '../../constants/theme';

const CoachProfileScreen: React.FC = () => {
  const { user } = useAuth();
  const sport = user?.preferred_sports?.[0] ?? 'Basketball';

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Sport</Text>
        <Text style={styles.value}>{sport}</Text>
        <Text style={styles.label}>Area</Text>
        <Text style={styles.value}>Los Angeles metro</Text>
        <Text style={styles.hint}>Edit coach details in Profile settings.</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  label: { fontSize: 13, color: colors.textSecondary, marginTop: spacing.md },
  value: { fontSize: 17, fontWeight: '600', color: colors.text, marginTop: 4 },
  hint: { marginTop: spacing.lg, color: colors.textTertiary, fontSize: 13 },
});

export default CoachProfileScreen;
