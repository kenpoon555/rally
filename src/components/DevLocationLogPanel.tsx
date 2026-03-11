import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import {
  getLocationLogLines,
  subscribeLocationLog,
  clearLocationLog,
} from '../utils/devLocationLog';

type Props = { onRawTest?: () => void };

/**
 * Shows [Location] debug lines in-app when __DEV__. Use when you can't open React Native DevTools (e.g. Metro terminal is controlled by another agent).
 */
export const DevLocationLogPanel: React.FC<Props> = ({ onRawTest }) => {
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    if (!__DEV__) return;
    setLines(getLocationLogLines());
    const unsub = subscribeLocationLog(() => {
      setLines(getLocationLogLines());
    });
    return unsub;
  }, []);

  if (!__DEV__) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Location debug</Text>
        <View style={styles.headerButtons}>
          {onRawTest && (
            <TouchableOpacity onPress={onRawTest} style={styles.clearBtn}>
              <Text style={styles.clearText}>Raw test</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={clearLocationLog} style={styles.clearBtn}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView style={styles.scroll} nestedScrollEnabled>
        {lines.length === 0 ? (
          <Text style={styles.line}>Pull to refresh or wait for auto-fetch…</Text>
        ) : (
          lines.map((line, i) => (
            <Text key={i} style={styles.line} numberOfLines={2}>
              {line}
            </Text>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    maxHeight: 160,
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderRadius: 8,
    padding: 8,
    zIndex: 9999,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  title: {
    color: '#7bed7b',
    fontSize: 11,
    fontWeight: '600',
  },
  clearBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  clearText: {
    color: '#aaa',
    fontSize: 10,
  },
  scroll: {
    maxHeight: 130,
  },
  line: {
    color: '#ddd',
    fontFamily: 'monospace',
    fontSize: 10,
    marginBottom: 2,
  },
});
