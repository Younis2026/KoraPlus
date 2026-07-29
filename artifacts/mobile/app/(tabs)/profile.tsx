import { Image } from 'expo-image';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useNotifications } from '@/hooks/useNotifications';
import { useGetProfile, useGetProfileStats, useGetAchievements } from '@workspace/api-client-react';

const LEVEL_COLORS: Record<string, string> = {
  bronze: '#cd7f32',
  silver: '#94a3b8',
  gold: '#f0a500',
  platinum: '#22d3ee',
  diamond: '#a78bfa',
};

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { notificationsEnabled, enableNotifications, disableNotifications } = useNotifications();

  const profile = useGetProfile();
  const stats = useGetProfileStats();
  const achievements = useGetAchievements();

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;
  const isLoading = profile.isLoading;

  async function handleToggleNotifications(value: boolean) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (value) {
      await enableNotifications();
    } else {
      await disableNotifications();
    }
  }

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const user = profile.data;
  const userStats = stats.data;
  const levelColor = LEVEL_COLORS[user?.level?.toLowerCase() ?? ''] ?? colors.secondary;

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 100 : 100 }}
      refreshControl={
        <RefreshControl
          refreshing={profile.isRefetching}
          onRefresh={profile.refetch}
          tintColor={colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Header */}
      <View style={[styles.profileHeader, { paddingTop: topPadding + 12 }]}>
        <View style={styles.avatarWrap}>
          <Image
            source={{ uri: user?.avatar ?? 'https://ui-avatars.com/api/?name=User&background=22c55e&color=fff' }}
            style={[styles.avatar, { borderColor: levelColor }]}
            contentFit="cover"
          />
          {user?.level && (
            <View style={[styles.levelBadge, { backgroundColor: levelColor }]}>
              <Text style={styles.levelText}>{user.level}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.userName, { color: colors.foreground }]}>
          {user?.name ?? 'المستخدم'}
        </Text>
        <Text style={[styles.userHandle, { color: colors.mutedForeground }]}>
          @{user?.username ?? 'user'}
        </Text>
        <View style={styles.badgesRow}>
          <View style={[styles.badgeChip, { backgroundColor: colors.muted }]}>
            <Ionicons name="medal-outline" size={13} color={colors.secondary} />
            <Text style={[styles.badgeChipText, { color: colors.foreground }]}>
              {user?.badgeCount ?? 0} وسام
            </Text>
          </View>
          <View style={[styles.badgeChip, { backgroundColor: colors.muted }]}>
            <Ionicons name="earth-outline" size={13} color={colors.mutedForeground} />
            <Text style={[styles.badgeChipText, { color: colors.foreground }]}>
              {user?.country ?? '--'}
            </Text>
          </View>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {[
          { label: 'النقاط الكلية', value: (userStats?.totalPoints ?? user?.totalPoints ?? 0).toLocaleString('ar'), icon: 'star', color: colors.secondary },
          { label: 'الترتيب العالمي', value: `#${userStats?.globalRank ?? user?.globalRank ?? '--'}`, icon: 'trophy', color: '#f0a500' },
          { label: 'دقة التوقعات', value: `${userStats?.accuracy ?? user?.accuracy ?? 0}%`, icon: 'analytics', color: colors.primary },
          { label: 'أطول سلسلة', value: `${userStats?.bestStreak ?? 0}`, icon: 'flame', color: '#f97316' },
        ].map((stat) => (
          <View
            key={stat.label}
            style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Ionicons name={stat.icon as any} size={22} color={stat.color} />
            <Text style={[styles.statValue, { color: colors.foreground }]}>
              {stat.value}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
              {stat.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Weekly/Monthly points */}
      {userStats && (
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>النقاط</Text>
          <View style={styles.pointsRow}>
            <View style={styles.pointsItem}>
              <Text style={[styles.pointsValue, { color: colors.primary }]}>
                {userStats.weeklyPoints.toLocaleString('ar')}
              </Text>
              <Text style={[styles.pointsLabel, { color: colors.mutedForeground }]}>هذا الأسبوع</Text>
            </View>
            <View style={[styles.pointsDivider, { backgroundColor: colors.border }]} />
            <View style={styles.pointsItem}>
              <Text style={[styles.pointsValue, { color: colors.secondary }]}>
                {userStats.monthlyPoints.toLocaleString('ar')}
              </Text>
              <Text style={[styles.pointsLabel, { color: colors.mutedForeground }]}>هذا الشهر</Text>
            </View>
            <View style={[styles.pointsDivider, { backgroundColor: colors.border }]} />
            <View style={styles.pointsItem}>
              <Text style={[styles.pointsValue, { color: colors.foreground }]}>
                {userStats.wonPredictions}/{userStats.totalPredictions}
              </Text>
              <Text style={[styles.pointsLabel, { color: colors.mutedForeground }]}>صحيح/إجمالي</Text>
            </View>
          </View>
        </View>
      )}

      {/* Achievements */}
      {(achievements.data?.length ?? 0) > 0 && (
        <View style={styles.achievSection}>
          <Text style={[styles.achievTitle, { color: colors.foreground }]}>الإنجازات</Text>
          <View style={styles.achievGrid}>
            {achievements.data!.slice(0, 6).map((ach) => {
              const RARITY_COLORS: Record<string, string> = {
                common: '#94a3b8',
                rare: '#3b82f6',
                epic: '#a78bfa',
                legendary: '#f0a500',
              };
              const rarityColor = RARITY_COLORS[ach.rarity] ?? '#94a3b8';
              return (
                <View
                  key={ach.id}
                  style={[
                    styles.achievCard,
                    {
                      backgroundColor: ach.isUnlocked ? `${rarityColor}20` : colors.muted,
                      borderColor: ach.isUnlocked ? rarityColor : colors.border,
                      opacity: ach.isUnlocked ? 1 : 0.5,
                    },
                  ]}
                >
                  <Text style={[styles.achievIcon, { opacity: ach.isUnlocked ? 1 : 0.4 }]}>
                    {ach.icon}
                  </Text>
                  <Text
                    style={[styles.achievName, { color: ach.isUnlocked ? colors.foreground : colors.mutedForeground }]}
                    numberOfLines={2}
                  >
                    {ach.title}
                  </Text>
                  {!ach.isUnlocked && ach.target > 0 && (
                    <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            backgroundColor: rarityColor,
                            width: `${Math.min((ach.progress / ach.target) * 100, 100)}%`,
                          },
                        ]}
                      />
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Notifications Setting */}
      <View style={[styles.settingsSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.settingsTitle, { color: colors.foreground }]}>الإعدادات</Text>
        <View style={styles.settingsRow}>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleToggleNotifications}
            trackColor={{ false: colors.border, true: `${colors.primary}80` }}
            thumbColor={notificationsEnabled ? colors.primary : colors.mutedForeground}
          />
          <View style={styles.settingsText}>
            <Text style={[styles.settingsLabel, { color: colors.foreground }]}>
              إشعارات المباريات
            </Text>
            <Text style={[styles.settingsSub, { color: colors.mutedForeground }]}>
              أحداث مباشرة ونتائج التوقعات
            </Text>
          </View>
          <Ionicons name="notifications-outline" size={22} color={colors.mutedForeground} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 8,
  },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
  },
  levelBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  levelText: {
    fontSize: 10,
    fontFamily: 'Cairo_700Bold',
    color: '#fff',
    textTransform: 'uppercase',
  },
  userName: {
    fontSize: 22,
    fontFamily: 'Cairo_700Bold',
  },
  userHandle: {
    fontSize: 14,
    fontFamily: 'Cairo_400Regular',
    marginTop: -4,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  badgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeChipText: {
    fontSize: 12,
    fontFamily: 'Cairo_500Medium',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
  },
  statValue: {
    fontSize: 22,
    fontFamily: 'Cairo_700Bold',
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Cairo_400Regular',
    textAlign: 'center',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Cairo_700Bold',
    marginBottom: 12,
    textAlign: 'right',
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  pointsDivider: {
    width: 1,
    height: 40,
  },
  pointsValue: {
    fontSize: 20,
    fontFamily: 'Cairo_700Bold',
  },
  pointsLabel: {
    fontSize: 11,
    fontFamily: 'Cairo_400Regular',
    textAlign: 'center',
  },
  achievSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  achievTitle: {
    fontSize: 18,
    fontFamily: 'Cairo_700Bold',
    marginBottom: 12,
    textAlign: 'right',
  },
  achievGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  achievCard: {
    flex: 1,
    minWidth: '30%',
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    alignItems: 'center',
    gap: 4,
  },
  achievIcon: {
    fontSize: 24,
  },
  achievName: {
    fontSize: 11,
    fontFamily: 'Cairo_500Medium',
    textAlign: 'center',
    lineHeight: 16,
  },
  progressBar: {
    width: '100%',
    height: 3,
    borderRadius: 2,
    marginTop: 2,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  settingsSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  settingsTitle: {
    fontSize: 16,
    fontFamily: 'Cairo_700Bold',
    textAlign: 'right',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsText: {
    flex: 1,
    gap: 2,
  },
  settingsLabel: {
    fontSize: 14,
    fontFamily: 'Cairo_600SemiBold',
    textAlign: 'right',
  },
  settingsSub: {
    fontSize: 12,
    fontFamily: 'Cairo_400Regular',
    textAlign: 'right',
  },
});
