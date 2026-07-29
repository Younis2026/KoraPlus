import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

const NOTIFICATION_TOKEN_KEY = '@maleb_push_token';
const NOTIFICATION_ENABLED_KEY = '@maleb_notifications_enabled';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export function useNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [lastNotification, setLastNotification] = useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    // Load saved state
    AsyncStorage.getItem(NOTIFICATION_ENABLED_KEY).then((val) => {
      setNotificationsEnabled(val === 'true');
    });
    AsyncStorage.getItem(NOTIFICATION_TOKEN_KEY).then((token) => {
      if (token) setExpoPushToken(token);
    });

    // Foreground notification handler
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      setLastNotification(notification);
    });

    // Response (tap) handler
    responseListener.current = Notifications.addNotificationResponseReceivedListener(() => {
      // Navigate to relevant screen when user taps notification
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  async function enableNotifications(): Promise<boolean> {
    if (Platform.OS === 'web') return false;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return false;

    try {
      const tokenData = await Notifications.getExpoPushTokenAsync();
      const token = tokenData.data;
      setExpoPushToken(token);
      setNotificationsEnabled(true);
      await AsyncStorage.setItem(NOTIFICATION_TOKEN_KEY, token);
      await AsyncStorage.setItem(NOTIFICATION_ENABLED_KEY, 'true');

      // Schedule a welcome notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'مرحباً بك في ملعب! 🏆',
          body: 'ستصلك إشعارات عند بدء المباريات المباشرة ونتائج توقعاتك.',
        },
        trigger: { seconds: 2, type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL },
      });

      return true;
    } catch (e) {
      console.warn('Could not get push token:', e);
      return false;
    }
  }

  async function disableNotifications() {
    setNotificationsEnabled(false);
    await AsyncStorage.setItem(NOTIFICATION_ENABLED_KEY, 'false');
  }

  return {
    expoPushToken,
    notificationsEnabled,
    lastNotification,
    enableNotifications,
    disableNotifications,
  };
}
