import { Image } from 'expo-image';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { LeaderboardRow } from '@/components/LeaderboardRow';
import { useGetLeaderboard } from '@workspace/api-client-react';

const TYPES = [
  { key: 'global', label: 'الكل' },
  { key: 'weekly', label: 'أسبوعي' },
  { key: 'monthly', label: 'شهري' },
] as const;

type LeaderboardType = (typeof TYPES)[number]['key'];

function Podium({
  entries,
  colors,
}: {
  entries: Array<{ rank: number; user: { id: string; name: string; avatar: string; country: string }; points: number; accuracy: number; predictions: number; change: number }>;
  colors: ReturnType<typeof useColors>;
}) {
  const top3 = entries.slice(0, 3);
  const rankColors = ['#f0a500', '#94a3b8', '#cd7f32'];
  const podiumHeights = [120, 90, 75];
  // Display order: 2nd, 1st, 3rd
  const displayOrder = [top3[1], top3[0], top3[2]].filter(Boolean);

  if (displayOrder.length < 1) return null;

  return (
    <View style={styles.podium}>
      {displayOrder.map((entry, displayIdx) => {
        if (!entry) return null;
        const realIdx = top3.indexOf(entry);
        const height = podiumHeights[realIdx] ?? 75;
        const color = rankColors[realIdx] ?? '#666';

        return (
          <View key={entry.user.id} style={styles.podiumItem}>
            {/* Crown for #1 */}
            {realIdx === 0 && (
              <Ionicons name="trophy" size={20} color="#f0a500" style={styles.crown} />
            )}
            <Image
              source={{ uri: entry.user.avatar }}
              style={[styles.podiumAvatar, { borderColor: color }]}
              contentFit="cover"
            />
            <Text style={[styles.podiumName, { color: colors.foreground }]} numberOfLines={1}>
              {entry.user.name.split(' ')[0]}
            </Text>
            <Text style={[styles.podiumPoints, { color: colors.secondary }]}>
              {entry.points.toLocaleString('ar')}
            </Text>
            <View
              style={[
                styles.podiumBlock,
                { height, backgroundColor: `${color}25`, borderTopColor: color, borderTopWidth: 2 },
              ]}
            >
              <Text style={[styles.podiumRank, { color }]}>{entry.rank}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

export default function LeaderboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [activeType, setActiveType] = useState<LeaderboardType>('global');

  const { data, isLoading, refetch, isRefetching } = useGetLeaderboard({ type: activeType });

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;
  const entries = data?.entries ?? [];
  const userEntry = data?.userEntry;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding + 12 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>الترتيب</Text>
      </View>

      {/* Type Selector */}
      <View style={[styles.typeRow, { backgroundColor: colors.muted }]}>
        {TYPES.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[
              styles.typeBtn,
              activeType === t.key && { backgroundColor: colors.card },
            ]}
            onPress={() => setActiveType(t.key)}
          >
            <Text
              style={[
                styles.typeLabel,
                {
                  color: activeType === t.key ? colors.primary : colors.mutedForeground,
                  fontFamily: activeType === t.key ? 'Cairo_700Bold' : 'Cairo_400Regular',
                },
              ]}
            >
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={entries.slice(3)}
          keyExtractor={(item) => item.user.id}
          renderItem={({ item }) => (
            <LeaderboardRow
              entry={item}
              isCurrentUser={userEntry?.user.id === item.user.id}
            />
          )}
          ListHeaderComponent={
            <>
              {/* Podium */}
              {entries.length >= 1 && (
                <Podium entries={entries} colors={colors} />
              )}

              {/* User rank (if not in top list) */}
              {userEntry && userEntry.rank > 3 && (
                <View style={styles.myRankWrap}>
                  <Text style={[styles.myRankLabel, { color: colors.mutedForeground }]}>
                    ترتيبك الحالي
                  </Text>
                  <LeaderboardRow entry={userEntry} isCurrentUser />
                </View>
              )}

              {/* Rest of table header */}
              {entries.length > 3 && (
                <View style={[styles.tableHeader, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.tableHeaderText, { color: colors.mutedForeground }]}>
                    المتنافسون
                  </Text>
                </View>
              )}
            </>
          }
          contentContainerStyle={{
            paddingBottom: Platform.OS === 'web' ? 100 : 100,
            flexGrow: 1,
          }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          scrollEnabled={!!entries.length}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            !entries.length ? (
              <View style={styles.empty}>
                <MaterialIcons name="leaderboard" size={44} color={colors.mutedForeground} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  لا توجد بيانات بعد
                </Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 12 },
  title: { fontSize: 26, fontFamily: 'Cairo_700Bold', textAlign: 'right' },
  typeRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 4,
  },
  typeBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
  },
  typeLabel: { fontSize: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  podium: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 8,
  },
  podiumItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  crown: { marginBottom: 2 },
  podiumAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
  },
  podiumName: {
    fontSize: 12,
    fontFamily: 'Cairo_600SemiBold',
    textAlign: 'center',
  },
  podiumPoints: {
    fontSize: 13,
    fontFamily: 'Cairo_700Bold',
  },
  podiumBlock: {
    width: '100%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 8,
  },
  podiumRank: {
    fontSize: 20,
    fontFamily: 'Cairo_700Bold',
  },
  myRankWrap: {
    marginTop: 4,
    marginBottom: 4,
  },
  myRankLabel: {
    fontSize: 12,
    fontFamily: 'Cairo_400Regular',
    textAlign: 'right',
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  tableHeader: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
    marginBottom: 4,
  },
  tableHeaderText: {
    fontSize: 13,
    fontFamily: 'Cairo_600SemiBold',
    textAlign: 'right',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: 'Cairo_400Regular',
  },
});
