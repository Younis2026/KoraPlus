import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import type { LeaderboardEntry } from '@workspace/api-client-react';

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  isCurrentUser?: boolean;
}

const RANK_COLORS: Record<number, string> = {
  1: '#f0a500',
  2: '#94a3b8',
  3: '#cd7f32',
};

export function LeaderboardRow({ entry, isCurrentUser }: LeaderboardRowProps) {
  const colors = useColors();
  const rankColor = RANK_COLORS[entry.rank];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isCurrentUser ? `${colors.primary}15` : colors.card,
          borderColor: isCurrentUser ? colors.primary : colors.border,
        },
      ]}
    >
      {/* Rank */}
      <View style={styles.rankWrap}>
        {rankColor ? (
          <Text style={[styles.rank, { color: rankColor }]}>{entry.rank}</Text>
        ) : (
          <Text style={[styles.rank, { color: colors.mutedForeground }]}>{entry.rank}</Text>
        )}
      </View>

      {/* Avatar */}
      <Image
        source={{ uri: entry.user.avatar }}
        style={styles.avatar}
        contentFit="cover"
      />

      {/* Name + Accuracy */}
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
          {entry.user.name}
          {isCurrentUser && (
            <Text style={{ color: colors.primary }}> (أنت)</Text>
          )}
        </Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          {entry.accuracy}% دقة · {entry.predictions} توقع
        </Text>
      </View>

      {/* Points + Change */}
      <View style={styles.right}>
        <Text style={[styles.points, { color: colors.secondary }]}>
          {entry.points.toLocaleString('ar')}
        </Text>
        {entry.change !== 0 && (
          <View style={styles.change}>
            <MaterialIcons
              name={entry.change > 0 ? 'arrow-upward' : 'arrow-downward'}
              size={12}
              color={entry.change > 0 ? '#22c55e' : '#ef4444'}
            />
            <Text
              style={[
                styles.changeText,
                { color: entry.change > 0 ? '#22c55e' : '#ef4444' },
              ]}
            >
              {Math.abs(entry.change)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 4,
    borderWidth: 1,
    gap: 10,
  },
  rankWrap: {
    width: 28,
    alignItems: 'center',
  },
  rank: {
    fontSize: 16,
    fontFamily: 'Cairo_700Bold',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 14,
    fontFamily: 'Cairo_600SemiBold',
  },
  sub: {
    fontSize: 12,
    fontFamily: 'Cairo_400Regular',
  },
  right: {
    alignItems: 'flex-end',
    gap: 3,
  },
  points: {
    fontSize: 16,
    fontFamily: 'Cairo_700Bold',
  },
  change: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  changeText: {
    fontSize: 11,
    fontFamily: 'Cairo_600SemiBold',
  },
});
