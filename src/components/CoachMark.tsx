import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  isOnboardingFlagSet,
  OnboardingFlag,
  setOnboardingFlag,
} from '../constants/onboardingFlags';
import { PRIMARY_COLOR } from '../constants/theme';

type CoachMarkProps = {
  /** Persisted flag so the tip shows at most once. */
  flag: OnboardingFlag;
  /** Whether the contextual condition for this tip is currently met. */
  active: boolean;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
};

/**
 * Lightweight, dismissible coaching banner for the badminton host wedge (Phase 5C).
 * Renders inline (no overlay library) and remembers dismissal across sessions.
 */
const CoachMark: React.FC<CoachMarkProps> = ({
  flag,
  active,
  title,
  body,
  actionLabel,
  onAction,
}) => {
  const [dismissed, setDismissed] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    isOnboardingFlagSet(flag).then((set) => {
      if (!cancelled) {
        setDismissed(set);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [flag]);

  if (!active || dismissed !== false) {
    return null;
  }

  const dismiss = () => {
    setDismissed(true);
    void setOnboardingFlag(flag);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      <View style={styles.actions}>
        {actionLabel && onAction ? (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => {
              dismiss();
              onAction();
            }}
          >
            <Text style={styles.actionText}>{actionLabel}</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity style={styles.dismissBtn} onPress={dismiss}>
          <Text style={styles.dismissText}>Got it</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#eef5ff',
    borderWidth: 1,
    borderColor: '#cfe0ff',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0a3d91',
  },
  body: {
    marginTop: 4,
    fontSize: 13,
    color: '#33507e',
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  actionBtn: {
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  actionText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  dismissBtn: {
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  dismissText: {
    color: '#5b6b86',
    fontWeight: '600',
    fontSize: 13,
  },
});

export default CoachMark;
