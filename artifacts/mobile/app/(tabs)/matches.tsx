import { Ionicons } from '@expo/vector-icons';
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
import { MatchCard } from '@/components/MatchCard';
import { useListMatches } from '@workspace/api-client-react';

const FILTERS = [
  { key: 'live', label: 'مباشر' },
  { key: 'today', label: 'اليوم' },
  { key: 'tomorrow', label: 'غداً' },
  { key: 'past', label: 'السابقة' },
] as const;

type FilterKey = (typeof FILTERS)[number]['key'];

export default function MatchesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState<FilterKey>('today');

  const { data, isLoading, refetch, isRefetching } = useListMatches({ filter: activeFilter });

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding + 12 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>المباريات</Text>
      </View>

      {/* Filter Tabs */}
      <View style={[styles.filterRow, { borderBottomColor: colors.border }]}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[
              styles.filterTab,
              activeFilter === f.key && {
                borderBottomColor: colors.primary,
                borderBottomWidth: 2,
              },
            ]}
            onPress={() => setActiveFilter(f.key)}
          >
            <Text
              style={[
                styles.filterLabel,
                {
                  color: activeFilter === f.key ? colors.primary : colors.mutedForeground,
                  fontFamily:
                    activeFilter === f.key ? 'Cairo_700Bold' : 'Cairo_400Regular',
                },
              ]}
            >
              {f.label}
              {f.key === 'live' && (data?.length ?? 0) > 0 && activeFilter !== 'live' ? (
                <Text style={{ color: colors.liveRed }}> •</Text>
              ) : null}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Match List */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MatchCard match={item} />}
          contentContainerStyle={{
            paddingTop: 8,
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
          scrollEnabled={!!(data?.length)}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="football-outline" size={44} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                {activeFilter === 'live'
                  ? 'لا توجد مباريات مباشرة حالياً'
                  : 'لا توجد مباريات في هذا القسم'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 26,
    fontFamily: 'Cairo_700Bold',
    textAlign: 'right',
  },
  filterRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 8,
  },
  filterTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingBottom: 10,
  },
  filterLabel: {
    fontSize: 14,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    textAlign: 'center',
  },
});
