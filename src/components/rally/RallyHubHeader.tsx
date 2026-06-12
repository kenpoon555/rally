import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SportIconForSurface } from '../SportIconForSurface';
import { RegularGroup } from '../../types/regularGroup';
import { RegularGroupMemberRow } from '../../services/regularGroupService';
import { colors, radius, spacing, typography } from '../../constants/theme';

type Props = {
  group: RegularGroup;
  members: RegularGroupMemberRow[];
  isHost?: boolean;
  savingName?: boolean;
  onSaveName?: (name: string) => Promise<void>;
  onInviteFriends?: () => void;
};

export const RallyHubHeader: React.FC<Props> = ({
  group,
  members,
  isHost = false,
  savingName = false,
  onSaveName,
  onInviteFriends,
}) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const cancelingRef = useRef(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(group.name);

  useEffect(() => {
    if (!editing) {
      setDraft(group.name);
    }
  }, [group.name, editing]);

  const startEditing = () => {
    setDraft(group.name);
    setEditing(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const cancelEditing = () => {
    cancelingRef.current = true;
    setDraft(group.name);
    setEditing(false);
    inputRef.current?.blur();
    setTimeout(() => {
      cancelingRef.current = false;
    }, 150);
  };

  const commitName = async () => {
    if (cancelingRef.current) {
      return;
    }
    if (!onSaveName || savingName) {
      return;
    }
    const trimmed = draft.trim();
    if (!trimmed) {
      Alert.alert('Rally name', 'Enter a name for this Rally.');
      setDraft(group.name);
      setEditing(false);
      return;
    }
    if (trimmed === group.name) {
      setEditing(false);
      return;
    }
    try {
      await onSaveName(trimmed);
      setEditing(false);
    } catch (error: unknown) {
      Alert.alert(
        'Could not rename',
        error instanceof Error ? error.message : 'Try again.'
      );
      setDraft(group.name);
    }
  };

  const canEdit = isHost && Boolean(onSaveName);

  return (
    <View style={[styles.wrap, { paddingTop: Math.max(insets.top, spacing.sm) }]}>
      <View style={styles.topRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        {onInviteFriends ? (
          <TouchableOpacity style={styles.shareBtn} onPress={onInviteFriends} hitSlop={8}>
            <Ionicons name="person-add" size={20} color={colors.primary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backSpacer} />
        )}
      </View>
      <View style={styles.row}>
        <SportIconForSurface sport={group.sport_type} surface="rallyHubHeader" />
        <View style={styles.body}>
          {editing && canEdit ? (
            <View style={styles.nameEditRow}>
              <TextInput
                ref={inputRef}
                style={styles.nameInput}
                value={draft}
                onChangeText={setDraft}
                maxLength={80}
                returnKeyType="done"
                onSubmitEditing={() => void commitName()}
                onBlur={() => void commitName()}
                editable={!savingName}
                selectTextOnFocus
              />
              {savingName ? (
                <ActivityIndicator size="small" color={colors.primary} style={styles.saveSpinner} />
              ) : (
                <TouchableOpacity onPress={cancelEditing} hitSlop={8} style={styles.cancelEdit}>
                  <Ionicons name="close" size={16} color={colors.textTertiary} />
                </TouchableOpacity>
              )}
            </View>
          ) : canEdit ? (
            <TouchableOpacity style={styles.nameRow} onPress={startEditing} activeOpacity={0.7}>
              <Text style={styles.name} numberOfLines={2}>
                {group.name}
              </Text>
              <Ionicons name="pencil" size={14} color={colors.textTertiary} style={styles.editIcon} />
            </TouchableOpacity>
          ) : (
            <Text style={styles.name} numberOfLines={2}>
              {group.name}
            </Text>
          )}
          <Text style={styles.meta}>
            {group.sport_type} · {members.length} member{members.length === 1 ? '' : 's'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    marginHorizontal: -spacing.xs,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backSpacer: {
    width: 36,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  nameEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  nameInput: {
    flex: 1,
    ...typography.headline,
    fontSize: 18,
    lineHeight: 24,
    color: colors.text,
    paddingVertical: 0,
    paddingHorizontal: spacing.sm,
    marginHorizontal: -spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  saveSpinner: {
    marginLeft: spacing.xs,
  },
  cancelEdit: {
    padding: spacing.xs,
  },
  editIcon: {
    marginTop: 4,
  },
  name: {
    ...typography.headline,
    fontSize: 18,
    lineHeight: 24,
    color: colors.text,
    flexShrink: 1,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  shareBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
