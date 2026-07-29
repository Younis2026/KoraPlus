import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import type { Match } from '@workspace/api-client-react';

const STATUS_LABELS: Record<string, string> = {
  upcoming: 'قادمة',
  live: 'مباشر',
  finished: 'انتهت',
  postponed: 'مؤجلة',
};

interface MatchCardProps {
  match: Match;
  compact?: boolean;
}

export function MatchCard({ match, compact }: MatchCardProps) {
  const colors = useColors();
  const router = useRouter();
  const isLive = match.status === 'live';
  const isFinished = match.status === 'finished';
  const hasScore = isFinished || isLive;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/match/${match.id}`);
  };

  const timeLabel = hasScore
    ? `${match.homeScore ?? 0} - ${match.awayScore ?? 0}`
    : new Date(match.scheduledAt).toLocaleTimeString('ar-SA', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: colors.card, borderColor: colors.border },
        compact && styles.compact,
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      {/* Header: League + Status */}
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: isLive ? '#ef444420' : colors.muted }]}>
          {isLive && (
            <View style={[styles.liveDot, { backgroundColor: colors.liveRed }]} />
          )}
          <Text
            style={[
              styles.badgeText,
              { color: isLive ? colors.liveRed : colors.mutedForeground },
            ]}
          >
            {isLive && match.minute ? `${match.minute}'` : STATUS_LABELS[match.status]}
          </Text>
        </View>
        <Text style={[styles.league, { color: colors.mutedForeground }]} numberOfLines={1}>
          {match.league.name}
        </Text>
      </View>

      {/* Teams and Score */}
      <View style={styles.matchRow}>
        {/* Home */}
        <View style={styles.team}>
          <Image
            source={{ uri: match.homeTeam.logo }}
            style={compact ? styles.logoSmall : styles.logo}
            contentFit="contain"
          />
          <Text
            style={[styles.teamName, { color: colors.foreground }]}
            numberOfLines={2}
          >
            {match.homeTeam.name}
          </Text>
        </View>

        {/* Score / Time */}
        <View style={[styles.scoreWrap, { backgroundColor: colors.muted }]}>
          <Text
            style={[
              styles.score,
              { color: isLive ? colors.primary : colors.foreground },
            ]}
          >
            {timeLabel}
          </Text>
          {isLive && (
            <Text style={[styles.vs, { color: colors.mutedForeground }]}>مباشر</Text>
          )}
        </View>

        {/* Away */}
        <View style={styles.team}>
          <Image
            source={{ uri: match.awayTeam.logo }}
            style={compact ? styles.logoSmall : styles.logo}
            contentFit="contain"
          />
          <Text
            style={[styles.teamName, { color: colors.foreground }]}
            numberOfLines={2}
          >
            {match.awayTeam.name}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    borderWidth: 1,
  },
  compact: {
    marginHorizontal: 0,
    marginVertical: 0,
    padding: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: 'Cairo_600SemiBold',
  },
  league: {
    fontSize: 12,
    fontFamily: 'Cairo_400Regular',
    maxWidth: 160,
    textAlign: 'right',
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  team: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  logo: {
    width: 44,
    height: 44,
  },
  logoSmall: {
    width: 34,
    height: 34,
  },
  teamName: {
    fontSize: 13,
    fontFamily: 'Cairo_600SemiBold',
    textAlign: 'center',
    lineHeight: 18,
  },
  scoreWrap: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 72,
  },
  score: {
    fontSize: 18,
    fontFamily: 'Cairo_700Bold',
    letterSpacing: 1,
  },
  vs: {
    fontSize: 10,
    fontFamily: 'Cairo_400Regular',
    marginTop: 2,
  },
});
