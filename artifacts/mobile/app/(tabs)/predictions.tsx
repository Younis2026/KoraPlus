import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { PredictionCard } from '@/components/PredictionCard';
import {
  useListMyPredictions,
  useListAvailablePredictions,
  useCreatePrediction,
  type PredictionMatch,
} from '@workspace/api-client-react';

type TabKey = 'mine' | 'available';

function PredictModal({
  item,
  onClose,
  colors,
}: {
  item: PredictionMatch;
  onClose: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');
  const mutation = useCreatePrediction();

  const handleSubmit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    mutation.mutate(
      {
        data: {
          matchId: item.match.id,
          homeScorePrediction: homeScore ? parseInt(homeScore, 10) : null,
          awayScorePrediction: awayScore ? parseInt(awayScore, 10) : null,
        },
      },
      { onSuccess: () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); onClose(); } },
    );
  };

  return (
    <View style={[styles.modal, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Teams */}
      <View style={styles.predictTeams}>
        <View style={styles.predictTeam}>
          <Image source={{ uri: item.match.homeTeam.logo }} style={styles.predictLogo} contentFit="contain" />
          <Text style={[styles.predictTeamName, { color: colors.foreground }]}>
            {item.match.homeTeam.name}
          </Text>
        </View>
        <Text style={[styles.predictVs, { color: colors.mutedForeground }]}>VS</Text>
        <View style={styles.predictTeam}>
          <Image source={{ uri: item.match.awayTeam.logo }} style={styles.predictLogo} contentFit="contain" />
          <Text style={[styles.predictTeamName, { color: colors.foreground }]}>
            {item.match.awayTeam.name}
          </Text>
        </View>
      </View>

      {/* Score inputs */}
      <Text style={[styles.predictLabel, { color: colors.mutedForeground }]}>
        توقع النتيجة
      </Text>
      <View style={styles.scoreInputRow}>
        <TextInput
          style={[styles.scoreInput, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border }]}
          value={homeScore}
          onChangeText={setHomeScore}
          keyboardType="number-pad"
          maxLength={2}
          placeholder="0"
          placeholderTextColor={colors.mutedForeground}
          textAlign="center"
        />
        <Text style={[styles.inputDash, { color: colors.mutedForeground }]}>-</Text>
        <TextInput
          style={[styles.scoreInput, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border }]}
          value={awayScore}
          onChangeText={setAwayScore}
          keyboardType="number-pad"
          maxLength={2}
          placeholder="0"
          placeholderTextColor={colors.mutedForeground}
          textAlign="center"
        />
      </View>

      <View style={styles.predictMeta}>
        <Text style={[styles.pointsBadge, { color: colors.secondary }]}>
          {item.pointsAvailable} نقطة محتملة
        </Text>
        <Text style={[styles.closesAt, { color: colors.mutedForeground }]}>
          تنتهي: {new Date(item.closesAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>

      <View style={styles.predictActions}>
        <TouchableOpacity
          style={[styles.cancelBtn, { backgroundColor: colors.muted }]}
          onPress={onClose}
        >
          <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>إلغاء</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.submitBtn,
            { backgroundColor: colors.primary },
            mutation.isPending && { opacity: 0.7 },
          ]}
          onPress={handleSubmit}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? (
            <ActivityIndicator size="small" color={colors.primaryForeground} />
          ) : (
            <Text style={[styles.submitText, { color: colors.primaryForeground }]}>
              إرسال التوقع
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function AvailableMatchRow({
  item,
  colors,
  onPredict,
}: {
  item: PredictionMatch;
  colors: ReturnType<typeof useColors>;
  onPredict: (item: PredictionMatch) => void;
}) {
  const match = item.match;
  const matchTime = new Date(match.scheduledAt).toLocaleTimeString('ar-SA', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={[styles.availRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.availTeams}>
        <View style={styles.availTeam}>
          <Image source={{ uri: match.homeTeam.logo }} style={styles.availLogo} contentFit="contain" />
          <Text style={[styles.availTeamName, { color: colors.foreground }]} numberOfLines={1}>
            {match.homeTeam.name}
          </Text>
        </View>
        <View style={styles.availCenter}>
          <Text style={[styles.availTime, { color: colors.mutedForeground }]}>{matchTime}</Text>
          <Text style={[styles.availLeague, { color: colors.mutedForeground }]} numberOfLines={1}>
            {match.league.name}
          </Text>
        </View>
        <View style={[styles.availTeam, { alignItems: 'flex-end' }]}>
          <Image source={{ uri: match.awayTeam.logo }} style={styles.availLogo} contentFit="contain" />
          <Text style={[styles.availTeamName, { color: colors.foreground }]} numberOfLines={1}>
            {match.awayTeam.name}
          </Text>
        </View>
      </View>
      <View style={styles.availFooter}>
        <Text style={[styles.availPoints, { color: colors.secondary }]}>
          {item.pointsAvailable} نقطة
        </Text>
        {item.hasPredicted ? (
          <View style={[styles.predictedBadge, { backgroundColor: `${colors.primary}20` }]}>
            <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
            <Text style={[styles.predictedText, { color: colors.primary }]}>تم التوقع</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.predictBtn, { backgroundColor: colors.primary }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onPredict(item);
            }}
          >
            <Text style={[styles.predictBtnText, { color: colors.primaryForeground }]}>
              توقع الآن
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function PredictionsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabKey>('mine');
  const [selectedMatch, setSelectedMatch] = useState<PredictionMatch | null>(null);

  const myPredictions = useListMyPredictions({ status: 'all' });
  const available = useListAvailablePredictions();

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;
  const isLoading = activeTab === 'mine' ? myPredictions.isLoading : available.isLoading;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding + 12 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>التوقعات</Text>
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
        {([
          { key: 'mine' as TabKey, label: 'توقعاتي' },
          { key: 'available' as TabKey, label: 'متاحة' },
        ] as const).map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && {
                borderBottomWidth: 2,
                borderBottomColor: colors.primary,
              },
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              style={[
                styles.tabLabel,
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

      {/* Prediction modal overlay */}
      {selectedMatch && (
        <View style={[styles.overlay, { backgroundColor: `${colors.background}cc` }]}>
          <PredictModal
            item={selectedMatch}
            colors={colors}
            onClose={() => setSelectedMatch(null)}
          />
        </View>
      )}

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : activeTab === 'mine' ? (
        <FlatList
          data={myPredictions.data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PredictionCard prediction={item} />}
          contentContainerStyle={{
            paddingTop: 8,
            paddingBottom: Platform.OS === 'web' ? 100 : 100,
            flexGrow: 1,
          }}
          refreshControl={
            <RefreshControl
              refreshing={myPredictions.isRefetching}
              onRefresh={myPredictions.refetch}
              tintColor={colors.primary}
            />
          }
          scrollEnabled={!!(myPredictions.data?.length)}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="checkmark-circle-outline" size={44} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                لم تقم بأي توقع بعد
              </Text>
              <TouchableOpacity onPress={() => setActiveTab('available')}>
                <Text style={[styles.emptyAction, { color: colors.primary }]}>
                  ابدأ التوقع الآن ←
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      ) : (
        <FlatList
          data={available.data ?? []}
          keyExtractor={(item) => item.match.id}
          renderItem={({ item }) => (
            <AvailableMatchRow
              item={item}
              colors={colors}
              onPredict={setSelectedMatch}
            />
          )}
          contentContainerStyle={{
            paddingTop: 8,
            paddingBottom: Platform.OS === 'web' ? 100 : 100,
            flexGrow: 1,
          }}
          refreshControl={
            <RefreshControl
              refreshing={available.isRefetching}
              onRefresh={available.refetch}
              tintColor={colors.primary}
            />
          }
          scrollEnabled={!!(available.data?.length)}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="time-outline" size={44} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                لا توجد مباريات متاحة للتوقع حالياً
              </Text>
            </View>
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
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingBottom: 10,
  },
  tabLabel: { fontSize: 15 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 60,
  },
  emptyText: { fontSize: 15, fontFamily: 'Cairo_400Regular', textAlign: 'center' },
  emptyAction: { fontSize: 14, fontFamily: 'Cairo_600SemiBold' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: 20,
  },
  modal: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 16,
  },
  predictTeams: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  predictTeam: { flex: 1, alignItems: 'center', gap: 6 },
  predictLogo: { width: 48, height: 48 },
  predictTeamName: { fontSize: 13, fontFamily: 'Cairo_600SemiBold', textAlign: 'center' },
  predictVs: { fontSize: 16, fontFamily: 'Cairo_700Bold', marginHorizontal: 8 },
  predictLabel: { fontSize: 14, fontFamily: 'Cairo_400Regular', textAlign: 'center' },
  scoreInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  scoreInput: {
    width: 64,
    height: 64,
    borderRadius: 12,
    fontSize: 28,
    fontFamily: 'Cairo_700Bold',
    borderWidth: 1,
  },
  inputDash: { fontSize: 28, fontFamily: 'Cairo_700Bold' },
  predictMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsBadge: { fontSize: 14, fontFamily: 'Cairo_700Bold' },
  closesAt: { fontSize: 12, fontFamily: 'Cairo_400Regular' },
  predictActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  cancelText: { fontSize: 15, fontFamily: 'Cairo_600SemiBold' },
  submitBtn: {
    flex: 2,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  submitText: { fontSize: 15, fontFamily: 'Cairo_700Bold' },
  availRow: {
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 14,
    borderWidth: 1,
    gap: 12,
  },
  availTeams: { flexDirection: 'row', alignItems: 'center' },
  availTeam: { flex: 1, alignItems: 'flex-start', gap: 4 },
  availCenter: { flex: 1, alignItems: 'center', gap: 4 },
  availLogo: { width: 38, height: 38 },
  availTeamName: { fontSize: 12, fontFamily: 'Cairo_600SemiBold' },
  availTime: { fontSize: 14, fontFamily: 'Cairo_700Bold' },
  availLeague: { fontSize: 11, fontFamily: 'Cairo_400Regular', textAlign: 'center' },
  availFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  availPoints: { fontSize: 14, fontFamily: 'Cairo_700Bold' },
  predictedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  predictedText: { fontSize: 12, fontFamily: 'Cairo_600SemiBold' },
  predictBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  predictBtnText: { fontSize: 13, fontFamily: 'Cairo_700Bold' },
});
