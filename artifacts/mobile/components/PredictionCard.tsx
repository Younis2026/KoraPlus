import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import type { Prediction } from '@workspace/api-client-react';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'بانتظار النتيجة', color: '#f0a500', bg: '#f0a50020' },
  won: { label: 'صحيح ✓', color: '#22c55e', bg: '#22c55e20' },
  lost: { label: 'خاطئ ✗', color: '#ef4444', bg: '#ef444420' },
  partial: { label: 'جزئي', color: '#3b82f6', bg: '#3b82f620' },
};

interface PredictionCardProps {
  prediction: Prediction;
}

export function PredictionCard({ prediction }: PredictionCardProps) {
  const colors = useColors();
  const { match, status, pointsEarned } = prediction;
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const isFinished = match.status === 'finished';

  const homeScore = prediction.homeScorePrediction;
  const awayScore = prediction.awayScorePrediction;
  const hasPredictedScore = homeScore !== null && homeScore !== undefined
    && awayScore !== null && awayScore !== undefined;

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Match teams */}
      <View style={styles.teamsRow}>
        <View style={styles.teamSide}>
          <Image source={{ uri: match.homeTeam.logo }} style={styles.logo} contentFit="contain" />
          <Text style={[styles.teamName, { color: colors.foreground }]} numberOfLines={1}>
            {match.homeTeam.name}
          </Text>
        </View>

        {/* Actual vs Predicted */}
        <View style={styles.scores}>
          {isFinished && (
            <Text style={[styles.actualScore, { color: colors.mutedForeground }]}>
              {match.homeScore} - {match.awayScore}
            </Text>
          )}
          {hasPredictedScore && (
            <View style={[styles.predictedBadge, { backgroundColor: colors.muted }]}>
              <Text style={[styles.predictedScore, { color: colors.foreground }]}>
                {homeScore} - {awayScore}
              </Text>
            </View>
          )}
          {!hasPredictedScore && !isFinished && (
            <Text style={[styles.noScore, { color: colors.mutedForeground }]}>--</Text>
          )}
        </View>

        <View style={[styles.teamSide, styles.teamRight]}>
          <Image source={{ uri: match.awayTeam.logo }} style={styles.logo} contentFit="contain" />
          <Text style={[styles.teamName, { color: colors.foreground }]} numberOfLines={1}>
            {match.awayTeam.name}
          </Text>
        </View>
      </View>

      {/* Status + Points */}
      <View style={styles.footer}>
        <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
          <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
        {pointsEarned !== null && pointsEarned !== undefined && (
          <Text style={[styles.points, { color: colors.secondary }]}>
            +{pointsEarned} نقطة
          </Text>
        )}
        <Text style={[styles.date, { color: colors.mutedForeground }]}>
          {new Date(match.scheduledAt).toLocaleDateString('ar-SA', {
            day: 'numeric',
            month: 'short',
          })}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 6,
    borderWidth: 1,
    gap: 12,
  },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamSide: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  teamRight: {
    // mirror
  },
  logo: {
    width: 36,
    height: 36,
  },
  teamName: {
    fontSize: 12,
    fontFamily: 'Cairo_600SemiBold',
    textAlign: 'center',
  },
  scores: {
    alignItems: 'center',
    gap: 4,
  },
  actualScore: {
    fontSize: 12,
    fontFamily: 'Cairo_400Regular',
  },
  predictedBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  predictedScore: {
    fontSize: 20,
    fontFamily: 'Cairo_700Bold',
  },
  noScore: {
    fontSize: 20,
    fontFamily: 'Cairo_700Bold',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Cairo_600SemiBold',
  },
  points: {
    fontSize: 14,
    fontFamily: 'Cairo_700Bold',
  },
  date: {
    fontSize: 11,
    fontFamily: 'Cairo_400Regular',
  },
});
