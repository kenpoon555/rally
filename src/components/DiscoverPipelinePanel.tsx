import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  DiscoverPipelineReport,
  DISCOVER_PIPELINE_VERSION,
  runDiscoverPipeline,
} from '../services/discoverPipeline';
import { SportType } from '../constants/sports';
import { SHOW_DISCOVER_PIPELINE_PANEL } from '../constants/devFlags';

type Props = {
  userId?: string;
  latitude?: number;
  longitude?: number;
  sportType?: SportType;
  activitiesCount: number;
  visibleCount: number;
  discoverLoading: boolean;
  discoverError: string | null;
  authLoading: boolean;
};

const DiscoverPipelinePanel: React.FC<Props> = ({
  userId,
  latitude,
  longitude,
  sportType,
  activitiesCount,
  visibleCount,
  discoverLoading,
  discoverError,
  authLoading,
}) => {
  const [report, setReport] = useState<DiscoverPipelineReport | null>(null);
  const [running, setRunning] = useState(false);

  const run = useCallback(async () => {
    setRunning(true);
    try {
      const result = await runDiscoverPipeline({
        userId,
        latitude,
        longitude,
        sportType,
      });
      setReport(result);
    } finally {
      setRunning(false);
    }
  }, [userId, latitude, longitude, sportType]);

  useEffect(() => {
    if (!authLoading) {
      void run();
    }
  }, [authLoading, run]);

  if (!SHOW_DISCOVER_PIPELINE_PANEL) {
    return null;
  }

  return (
    <View style={styles.box}>
      <Text style={styles.title}>Discover pipeline ({DISCOVER_PIPELINE_VERSION})</Text>
      <Text style={styles.meta}>
        authLoading={String(authLoading)} • hook={activitiesCount} visible={visibleCount}
        {discoverLoading ? ' • fetching…' : ''}
      </Text>
      {discoverError ? <Text style={styles.error}>Hook error: {discoverError}</Text> : null}
      {report?.steps.map((step) => (
        <Text key={step.name} style={step.ok ? styles.stepOk : styles.stepFail}>
          {step.ok ? '✓' : '✗'} {step.name}: {step.detail}
        </Text>
      ))}
      <TouchableOpacity style={styles.button} onPress={run} disabled={running}>
        {running ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.buttonText}>Run step-by-step check</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
  },
  title: {
    color: '#9cf',
    fontWeight: '700',
    fontSize: 13,
    marginBottom: 4,
  },
  meta: {
    color: '#aaa',
    fontSize: 11,
    marginBottom: 6,
  },
  error: {
    color: '#f88',
    fontSize: 11,
    marginBottom: 4,
  },
  stepOk: {
    color: '#8f8',
    fontSize: 11,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
  stepFail: {
    color: '#f88',
    fontSize: 11,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
  button: {
    marginTop: 8,
    backgroundColor: '#3366cc',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
});

export default DiscoverPipelinePanel;
