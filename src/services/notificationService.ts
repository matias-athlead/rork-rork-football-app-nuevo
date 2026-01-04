import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BIRTHDAY_NOTIFICATION_KEY = '@athlead_birthday_notifications_sent';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const notificationService = {
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') {
      console.log('[Notifications] Push notifications not supported on web');
      return false;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('[Notifications] Permission denied');
        return false;
      }

      console.log('[Notifications] Permission granted');

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#1E3A8A',
        });
      }

      return true;
    } catch (error) {
      console.error('[Notifications] Error requesting permissions:', error);
      return false;
    }
  },

  async scheduleBirthdayNotification(
    userId: string,
    userName: string,
    birthdate: string,
    language: string = 'en'
  ): Promise<void> {
    if (Platform.OS === 'web') {
      console.log('[Notifications] Birthday notifications not supported on web');
      return;
    }

    try {
      const birthdayDate = new Date(birthdate);
      const now = new Date();

      const thisYearBirthday = new Date(
        now.getFullYear(),
        birthdayDate.getMonth(),
        birthdayDate.getDate(),
        9,
        0,
        0
      );

      if (thisYearBirthday < now) {
        thisYearBirthday.setFullYear(now.getFullYear() + 1);
      }

      const sentNotificationsJson = await AsyncStorage.getItem(BIRTHDAY_NOTIFICATION_KEY);
      const sentNotifications = sentNotificationsJson ? JSON.parse(sentNotificationsJson) : {};

      const currentYear = now.getFullYear();
      const notificationKey = `${userId}_${currentYear}`;

      if (sentNotifications[notificationKey]) {
        console.log(`[Notifications] Birthday notification already sent for ${userId} in ${currentYear}`);
        return;
      }

      const message = language === 'es' 
        ? `¡Felicidades, ${userName}!` 
        : `Happy Birthday, ${userName}!`;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🎉 Athlead',
          body: message,
          data: { type: 'birthday', userId },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: thisYearBirthday,
        } as any,
      });

      console.log(
        `[Notifications] Birthday notification scheduled for ${userName} on ${thisYearBirthday.toLocaleDateString()}`
      );
    } catch (error) {
      console.error('[Notifications] Error scheduling birthday notification:', error);
    }
  },

  async markBirthdayNotificationAsSent(userId: string): Promise<void> {
    try {
      const sentNotificationsJson = await AsyncStorage.getItem(BIRTHDAY_NOTIFICATION_KEY);
      const sentNotifications = sentNotificationsJson ? JSON.parse(sentNotificationsJson) : {};

      const currentYear = new Date().getFullYear();
      const notificationKey = `${userId}_${currentYear}`;

      sentNotifications[notificationKey] = true;

      await AsyncStorage.setItem(BIRTHDAY_NOTIFICATION_KEY, JSON.stringify(sentNotifications));
      console.log(`[Notifications] Marked birthday notification as sent for ${userId}`);
    } catch (error) {
      console.error('[Notifications] Error marking notification as sent:', error);
    }
  },

  async cancelAllBirthdayNotifications(): Promise<void> {
    if (Platform.OS === 'web') return;

    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await AsyncStorage.removeItem(BIRTHDAY_NOTIFICATION_KEY);
      console.log('[Notifications] All birthday notifications cancelled');
    } catch (error) {
      console.error('[Notifications] Error cancelling notifications:', error);
    }
  },

  async sendLocalNotification(title: string, body: string, data?: any): Promise<void> {
    if (Platform.OS === 'web') {
      console.log(`[Notifications] Local notification: ${title} - ${body}`);
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger: null,
      });
    } catch (error) {
      console.error('[Notifications] Error sending local notification:', error);
    }
  },

  async getPushToken(): Promise<string | null> {
    if (Platform.OS === 'web') return null;

    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: '77o5peh0l2kbfdu32g0za',
      });
      console.log('[Notifications] Push token:', token.data);
      return token.data;
    } catch (error) {
      console.error('[Notifications] Error getting push token:', error);
      return null;
    }
  },
};
