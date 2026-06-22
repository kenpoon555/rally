import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PRODUCT_COPY } from '../../constants/productCopy';
import { submitProductFeedback } from '../../services/feedbackService';
import { Button, KeyboardSafeView, keyboardAwareScrollProps } from '../../components/ui';
import { colors, spacing, typography } from '../../constants/theme';

type MainStackParamList = {
  BetaFeedback: { screen?: string; activityId?: string } | undefined;
};

type Props = NativeStackScreenProps<MainStackParamList, 'BetaFeedback'>;

const BetaFeedbackScreen: React.FC<Props> = ({ navigation, route }) => {
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    const trimmed = body.trim();
    if (!trimmed) {
      Alert.alert('Add a note', 'Write at least a few words so we can act on it.');
      return;
    }
    setSending(true);
    try {
      await submitProductFeedback(trimmed, route.params?.screen ?? 'BetaFeedback', route.params?.activityId);
      Alert.alert(PRODUCT_COPY.feedbackThanks, undefined, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: unknown) {
      Alert.alert('Could not send', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardSafeView style={styles.flex}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        {...keyboardAwareScrollProps}
      >
        <Text style={styles.title}>{PRODUCT_COPY.feedbackTitle}</Text>
        <Text style={styles.hint}>{PRODUCT_COPY.feedbackHint}</Text>
        <TextInput
          style={styles.input}
          value={body}
          onChangeText={setBody}
          placeholder={PRODUCT_COPY.feedbackPlaceholder}
          placeholderTextColor={colors.textSecondary}
          multiline
          textAlignVertical="top"
          maxLength={4000}
          editable={!sending}
        />
        <Text style={styles.counter}>{body.length}/4000</Text>
        <Button
          title={sending ? 'Sending…' : PRODUCT_COPY.feedbackSubmit}
          onPress={() => void handleSubmit()}
          disabled={sending}
          loading={sending}
        />
      </ScrollView>
    </KeyboardSafeView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  title: { ...typography.h2, color: colors.text, marginBottom: spacing.sm },
  hint: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  input: {
    minHeight: 160,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  counter: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
});

export default BetaFeedbackScreen;
