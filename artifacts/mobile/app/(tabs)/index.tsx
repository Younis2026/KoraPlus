import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { MatchCard } from '@/components/MatchCard';
import {
  useGetHomeSummary,
  type LeaderboardEntry,
  type NewsArticle,
} from '@workspace/api-client-react';

function NewsCard({ article, colors }: { article: NewsArticle; colors: ReturnType<typeof useColors> }) {
  const CATEGORY_LABELS: Record<string, string> = {
    breaking: 'عاجل',
    transfers: 'انتقالات',
    injuries: 'إصابات',
    press_conference: 'مؤتمر صحفي',
    analysis: 'تحليل',
    video_highlights: 'فيديو',
  };

  return (
    <View
      style={[
        styles.newsCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <Image
        source={{ uri: article.imageUrl }}
        style={styles.newsImage}
        contentFit="cover"
      />
      <View style={styles.newsBody}>
        {article.isBreaking && (
          <View style={[styles.breakingBadge, { backgroundColor: '#ef444420' }]}>
            <Text style={[styles.breakingText, { color: '#ef4444' }]}>عاجل</Text>
          </View>
        )}
        <Text style={[styles.newsTitle, { color: colors.foreground }]} numberOfLines={2}>
          {article.title}
        </Text>
        <Text style={[styles.newsMeta, { color: colors.mutedForeground }]}>
          {CATEGORY_LABELS[article.category] ?? article.category} · {article.readTimeMinutes} دقيقة
        </Text>
      </View>
    </View>
  );
}

function LeaderboardPreview({
  entries,
  colors,
}: {
  entries: LeaderboardEntry[];
  colors: ReturnType<typeof useColors>;
}) {
  const RANK_COLORS = ['#f0a500', '#94a3b8', '#cd7f32'];

  return (
    <View style={[styles.leaderPreview, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {entries.slice(0, 3).map((entry, index) => (
        <View key={entry.user.id} style={styles.leaderRow}>
          <Text style={[styles.leaderRank, { color: RANK_COLORS[index] ?? colors.mutedForeground }]}>
            {index + 1}
          </Text>
          <Image
            source={{ uri: entry.user.avatar }}
            style={styles.leaderAvatar}
            contentFit="cover"
          />
          <Text style={[styles.leaderName, { color: colors.foreground }]} numberOfLines={1}>
            {entry.user.name}
          </Text>
          <Text style={[styles.leaderPoints, { color: colors.secondary }]}>
            {entry.points.toLocaleString('ar')}
          </Text>
        </View>
      ))}
    </View>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = useGetHomeSummary();

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 100 : 100 }}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor={colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Header */}
      <LinearGradient
        colors={['#080e1e', '#0d1529']}
        style={[styles.hero, { paddingTop: topPadding + 16 }]}
      >
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroGreeting}>أهلاً بك 👋</Text>
            <Text style={styles.heroTitle}>ملعب</Text>
          </View>
          <TouchableOpacity
            style={[styles.notifBtn, { backgroundColor: '#ffffff15' }]}
            onPress={() => router.push('/profile')}
          >
            <Ionicons name="notifications-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: '#ffffff10' }]}>
            <Text style={styles.statValue}>{data?.userPoints ?? 0}</Text>
            <Text style={styles.statLabel}>نقاطك</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#22c55e20', borderColor: '#22c55e30', borderWidth: 1 }]}>
            <Text style={[styles.statValue, { color: '#22c55e' }]}>
              {data?.liveMatchCount ?? 0}
            </Text>
            <Text style={[styles.statLabel, { color: '#22c55e' }]}>مباشر الآن</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#ffffff10' }]}>
            <Text style={styles.statValue}>
              #{data?.userRank ?? '--'}
            </Text>
            <Text style={styles.statLabel}>ترتيبك</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Today's Matches */}
      {(data?.todayMatches?.length ?? 0) > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TouchableOpacity onPress={() => router.push('/matches')}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>عرض الكل</Text>
            </TouchableOpacity>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              مباريات اليوم
            </Text>
          </View>
          {data!.todayMatches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </View>
      )}

      {/* Leaderboard Preview */}
      {(data?.topLeaderboard?.length ?? 0) > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TouchableOpacity onPress={() => router.push('/leaderboard')}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>عرض الكل</Text>
            </TouchableOpacity>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              أفضل المتوقعين
            </Text>
          </View>
          <View style={{ paddingHorizontal: 16 }}>
            <LeaderboardPreview entries={data!.topLeaderboard} colors={colors} />
          </View>
        </View>
      )}

      {/* Breaking News */}
      {(data?.breakingNews?.length ?? 0) > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              آخر الأخبار
            </Text>
          </View>
          <FlatList
            data={data!.breakingNews}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <NewsCard article={item} colors={colors} />}
            scrollEnabled={!!(data?.breakingNews?.length)}
          />
        </View>
      )}

      {/* Empty state */}
      {!data?.todayMatches?.length && !data?.breakingNews?.length && (
        <View style={styles.emptyState}>
          <Ionicons name="football-outline" size={48} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            لا توجد بيانات متاحة حالياً
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  heroGreeting: {
    fontSize: 13,
    color: '#94a3b8',
    fontFamily: 'Cairo_400Regular',
  },
  heroTitle: {
    fontSize: 28,
    color: '#ffffff',
    fontFamily: 'Cairo_700Bold',
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 22,
    fontFamily: 'Cairo_700Bold',
    color: '#ffffff',
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Cairo_400Regular',
    color: '#94a3b8',
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Cairo_700Bold',
  },
  seeAll: {
    fontSize: 13,
    fontFamily: 'Cairo_500Medium',
  },
  newsCard: {
    width: 220,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
  },
  newsImage: {
    width: '100%',
    height: 120,
  },
  newsBody: {
    padding: 10,
    gap: 6,
  },
  breakingBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  breakingText: {
    fontSize: 11,
    fontFamily: 'Cairo_700Bold',
  },
  newsTitle: {
    fontSize: 13,
    fontFamily: 'Cairo_600SemiBold',
    lineHeight: 20,
    textAlign: 'right',
  },
  newsMeta: {
    fontSize: 11,
    fontFamily: 'Cairo_400Regular',
  },
  leaderPreview: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  leaderRank: {
    width: 24,
    fontSize: 16,
    fontFamily: 'Cairo_700Bold',
    textAlign: 'center',
  },
  leaderAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  leaderName: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Cairo_600SemiBold',
    textAlign: 'right',
  },
  leaderPoints: {
    fontSize: 14,
    fontFamily: 'Cairo_700Bold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: 'Cairo_400Regular',
  },
});
