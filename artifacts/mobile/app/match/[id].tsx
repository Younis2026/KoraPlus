import { Image } from 'expo-image';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
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
import { useGetMatch } from '@workspace/api-client-react';

const EVENT_ICONS: Record<string, string> = {
  goal: '⚽',
  yellow_card: '🟨',
  red_card: '🟥',
  substitution: '🔄',
  var: 'VAR',
  penalty: '🎯',
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  upcoming: { label: 'قادمة', color: '#94a3b8' },
  live: { label: 'مباشر', color: '#ef4444' },
  finished: { label: 'انتهت', color: '#22c55e' },
  postponed: { label: 'مؤجلة', color: '#f0a500' },
};

type TabKey = 'events' | 'stats' | 'lineups';

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>('events');

  const { data: match, isLoading, refetch, isRefetching } = useGetMatch(id ?? '');

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;
  const isLive = match?.status === 'live';
  const hasScore = match?.status === 'live' || match?.status === 'finished';
  const statusCfg = STATUS_LABELS[match?.status ?? ''] ?? { label: '--', color: '#94a3b8' };

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!match) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Ionicons name="football-outline" size={44} color={colors.mutedForeground} />
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
          المباراة غير موجودة
        </Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[{ color: colors.primary, fontFamily: 'Cairo_600SemiBold', fontSize: 14 }]}>
            العودة
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 100 : 100 }}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View
        style={[
          styles.matchHeader,
          { backgroundColor: '#080e1e', paddingTop: topPadding + 8 },
        ]}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.leagueName}>{match.league.name}</Text>
        <Text style={styles.venueName}>{match.venue}</Text>

        {/* Score / Status */}
        <View style={styles.scoreSection}>
          {/* Home */}
          <View style={styles.teamBlock}>
            <Image source={{ uri: match.homeTeam.logo }} style={styles.teamLogo} contentFit="contain" />
            <Text style={styles.teamName}>{match.homeTeam.name}</Text>
          </View>

          {/* Center */}
          <View style={styles.scoreCenter}>
            {hasScore ? (
              <>
                <Text style={[styles.bigScore, { color: isLive ? '#22c55e' : '#fff' }]}>
                  {match.homeScore ?? 0} - {match.awayScore ?? 0}
                </Text>
                {isLive && (
                  <View style={styles.liveRow}>
                    <View style={[styles.livePulse, { backgroundColor: '#ef4444' }]} />
                    <Text style={[styles.liveText, { color: '#ef4444' }]}>
                      {match.minute}'
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.upcomingTime}>
                <Text style={[styles.statusBadge, { color: statusCfg.color }]}>
                  {statusCfg.label}
                </Text>
                <Text style={styles.matchTime}>
                  {new Date(match.scheduledAt).toLocaleTimeString('ar-SA', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
                <Text style={styles.matchDate}>
                  {new Date(match.scheduledAt).toLocaleDateString('ar-SA', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                </Text>
              </View>
            )}
          </View>

          {/* Away */}
          <View style={[styles.teamBlock, styles.teamRight]}>
            <Image source={{ uri: match.awayTeam.logo }} style={styles.teamLogo} contentFit="contain" />
            <Text style={styles.teamName}>{match.awayTeam.name}</Text>
          </View>
        </View>
      </View>

      {/* Detail Tabs */}
      <View style={[styles.detailTabs, { borderBottomColor: colors.border }]}>
        {([
          { key: 'events' as TabKey, label: 'الأحداث' },
          { key: 'stats' as TabKey, label: 'الإحصائيات' },
          { key: 'lineups' as TabKey, label: 'التشكيل' },
        ] as const).map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.detailTab,
              activeTab === tab.key && {
                borderBottomWidth: 2,
                borderBottomColor: colors.primary,
              },
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              style={[
                styles.detailTabLabel,
                {
                  color: activeTab === tab.key ? colors.primary : colors.mutedForeground,
                  fontFamily: activeTab === tab.key ? 'Cairo_700Bold' : 'Cairo_400Regular',
                },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Events Tab */}
      {activeTab === 'events' && (
        <View style={styles.eventsSection}>
          {match.events.length === 0 ? (
            <View style={styles.emptyTab}>
              <Ionicons name="time-outline" size={36} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                لم تبدأ الأحداث بعد
              </Text>
            </View>
          ) : (
            match.events.map((event) => (
              <View key={event.id} style={styles.eventRow}>
                {/* Home side */}
                <View style={styles.eventHome}>
                  {event.team === 'home' && (
                    <View style={styles.eventDetail}>
                      <Text style={[styles.eventPlayer, { color: colors.foreground }]}>
                        {event.player.name}
                      </Text>
                      {event.assistPlayer && (
                        <Text style={[styles.eventAssist, { color: colors.mutedForeground }]}>
                          {event.assistPlayer.name}
                        </Text>
                      )}
                    </View>
                  )}
                </View>

                {/* Center */}
                <View style={styles.eventCenter}>
                  <Text style={styles.eventIcon}>{EVENT_ICONS[event.type] ?? '•'}</Text>
                  <Text style={[styles.eventMinute, { color: colors.mutedForeground }]}>
                    {event.minute}'
                  </Text>
                </View>

                {/* Away side */}
                <View style={styles.eventAway}>
                  {event.team === 'away' && (
                    <View style={styles.eventDetail}>
                      <Text style={[styles.eventPlayer, { color: colors.foreground }]}>
                        {event.player.name}
                      </Text>
                      {event.assistPlayer && (
                        <Text style={[styles.eventAssist, { color: colors.mutedForeground }]}>
                          {event.assistPlayer.name}
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      )}

      {/* Stats Tab */}
      {activeTab === 'stats' && (
        <View style={styles.statsSection}>
          {([
            { key: 'possession', label: 'الاستحواذ', suffix: '%' },
            { key: 'shots', label: 'التسديدات', suffix: '' },
            { key: 'shotsOnTarget', label: 'على المرمى', suffix: '' },
            { key: 'corners', label: 'الركنيات', suffix: '' },
            { key: 'fouls', label: 'الأخطاء', suffix: '' },
            { key: 'yellowCards', label: 'البطاقات الصفراء', suffix: '' },
          ] as const).map(({ key, label, suffix }) => {
            const home = (match.stats as any)[key]?.home ?? 0;
            const away = (match.stats as any)[key]?.away ?? 0;
            const total = home + away || 1;
            const homeW = (home / total) * 100;
            const awayW = (away / total) * 100;

            return (
              <View key={key} style={styles.statRow}>
                <Text style={[styles.statNum, { color: colors.foreground }]}>{home}{suffix}</Text>
                <View style={styles.statBarWrap}>
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barHome,
                        { width: `${homeW}%` as any, backgroundColor: colors.primary },
                      ]}
                    />
                    <View
                      style={[
                        styles.barAway,
                        { width: `${awayW}%` as any, backgroundColor: colors.secondary },
                      ]}
                    />
                  </View>
                </View>
                <Text style={[styles.statNum, { color: colors.foreground }]}>{away}{suffix}</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Lineups Tab */}
      {activeTab === 'lineups' && (
        <View style={styles.lineupsSection}>
          <View style={styles.lineupsRow}>
            <View style={styles.lineupTeam}>
              <Text style={[styles.lineupHeader, { color: colors.primary }]}>
                {match.homeTeam.name}
              </Text>
              {match.homeLineup.map((p) => (
                <View key={p.id} style={styles.playerRow}>
                  <Text style={[styles.playerNum, { color: colors.secondary }]}>{p.number}</Text>
                  <Text style={[styles.playerName, { color: colors.foreground }]}>{p.name}</Text>
                  <Text style={[styles.playerPos, { color: colors.mutedForeground }]}>{p.position}</Text>
                </View>
              ))}
            </View>
            <View style={[styles.lineupDivider, { backgroundColor: colors.border }]} />
            <View style={styles.lineupTeam}>
              <Text style={[styles.lineupHeader, { color: colors.secondary }]}>
                {match.awayTeam.name}
              </Text>
              {match.awayLineup.map((p) => (
                <View key={p.id} style={[styles.playerRow, { flexDirection: 'row-reverse' }]}>
                  <Text style={[styles.playerNum, { color: colors.secondary }]}>{p.number}</Text>
                  <Text style={[styles.playerName, { color: colors.foreground }]}>{p.name}</Text>
                  <Text style={[styles.playerPos, { color: colors.mutedForeground }]}>{p.position}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: 15, fontFamily: 'Cairo_400Regular', textAlign: 'center' },
  matchHeader: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  leagueName: {
    color: '#94a3b8',
    fontSize: 12,
    fontFamily: 'Cairo_400Regular',
    textAlign: 'center',
    marginBottom: 2,
  },
  venueName: {
    color: '#64748b',
    fontSize: 11,
    fontFamily: 'Cairo_400Regular',
    textAlign: 'center',
    marginBottom: 20,
  },
  scoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  teamRight: {},
  teamLogo: { width: 60, height: 60 },
  teamName: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Cairo_600SemiBold',
    textAlign: 'center',
  },
  scoreCenter: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
  },
  bigScore: {
    fontSize: 36,
    fontFamily: 'Cairo_900Black',
    letterSpacing: 2,
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  livePulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  liveText: {
    fontSize: 14,
    fontFamily: 'Cairo_700Bold',
  },
  upcomingTime: { alignItems: 'center', gap: 4 },
  statusBadge: { fontSize: 13, fontFamily: 'Cairo_600SemiBold' },
  matchTime: {
    color: '#fff',
    fontSize: 24,
    fontFamily: 'Cairo_700Bold',
  },
  matchDate: {
    color: '#94a3b8',
    fontSize: 12,
    fontFamily: 'Cairo_400Regular',
    textAlign: 'center',
  },
  detailTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 8,
  },
  detailTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingBottom: 10,
  },
  detailTabLabel: { fontSize: 14 },
  eventsSection: { paddingVertical: 8 },
  emptyTab: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 40,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  eventHome: { flex: 1, alignItems: 'flex-start' },
  eventCenter: { alignItems: 'center', width: 60, gap: 2 },
  eventAway: { flex: 1, alignItems: 'flex-end' },
  eventDetail: { alignItems: 'flex-start', gap: 2 },
  eventIcon: { fontSize: 18 },
  eventMinute: { fontSize: 11, fontFamily: 'Cairo_400Regular' },
  eventPlayer: { fontSize: 13, fontFamily: 'Cairo_600SemiBold' },
  eventAssist: { fontSize: 11, fontFamily: 'Cairo_400Regular' },
  statsSection: { padding: 16, gap: 16 },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statNum: { width: 30, fontSize: 14, fontFamily: 'Cairo_700Bold', textAlign: 'center' },
  statBarWrap: { flex: 1, gap: 4 },
  statLabel: { fontSize: 12, fontFamily: 'Cairo_400Regular', textAlign: 'center' },
  barTrack: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: '#1c2843',
  },
  barHome: { height: '100%', borderRadius: 3 },
  barAway: { height: '100%', borderRadius: 3 },
  lineupsSection: { padding: 16 },
  lineupsRow: { flexDirection: 'row' },
  lineupTeam: { flex: 1, gap: 8 },
  lineupDivider: { width: 1, marginHorizontal: 12 },
  lineupHeader: {
    fontSize: 14,
    fontFamily: 'Cairo_700Bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  playerNum: { fontSize: 12, fontFamily: 'Cairo_700Bold', width: 20, textAlign: 'center' },
  playerName: { flex: 1, fontSize: 12, fontFamily: 'Cairo_500Medium' },
  playerPos: { fontSize: 10, fontFamily: 'Cairo_400Regular' },
});
