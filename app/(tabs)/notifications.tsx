import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, SafeAreaView } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Heart, MessageCircle, UserPlus, Trophy } from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { useAuth } from '@/src/hooks/useAuth';
import { notificationService } from '@/src/services/notificationService';
import { Notification } from '@/src/types/Notification';
import { COLORS } from '@/src/utils/theme';

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) return;
    notificationService.getNotifications(user.id).then(setNotifications);
  }, [user]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart size={20} color={COLORS.error} fill={COLORS.error} />;
      case 'comment':
        return <MessageCircle size={20} color={COLORS.skyBlue} />;
      case 'follow':
      case 'follow_request':
        return <UserPlus size={20} color={COLORS.primary} />;
      case 'ranking':
        return <Trophy size={20} color={COLORS.warning} />;
      default:
        return <MessageCircle size={20} color={theme.textSecondary} />;
    }
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diff = Math.floor((now.getTime() - notifDate.getTime()) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <Pressable
      onPress={() => {
        if (item.postId) {
          router.push(`/post/${item.postId}` as any);
        } else if (item.userId) {
          router.push(`/profile/${item.userId}` as any);
        }
      }}
      style={[
        styles.notificationCard,
        { backgroundColor: item.isRead ? 'transparent' : `${COLORS.skyBlue}15` }
      ]}
    >
      <View style={styles.notificationLeft}>
        <View style={styles.avatarContainer}>
          {item.userPhoto ? (
            <Image source={{ uri: item.userPhoto }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.card }]} />
          )}
          <View style={styles.iconBadge}>
            {getNotificationIcon(item.type)}
          </View>
        </View>
        <View style={styles.notificationContent}>
          <Text style={[styles.notificationText, { color: theme.text }]}>
            <Text style={styles.username}>{item.username}</Text>
            {` ${item.content}`}
          </Text>
          <Text style={[styles.timeText, { color: theme.textSecondary }]}>
            {getTimeAgo(item.createdAt)}
          </Text>
        </View>
      </View>
      {item.postThumbnail && (
        <Image source={{ uri: item.postThumbnail }} style={styles.postThumbnail} />
      )}
    </Pressable>
  );

  const markAllAsRead = async () => {
    if (!user) return;
    const updated = notifications.map(n => ({ ...n, isRead: true }));
    setNotifications(updated);
    await notificationService.markAllAsRead(user.id);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.text }]}>Notifications</Text>
        <Pressable onPress={markAllAsRead}>
          <Text style={[styles.markAllText, { color: COLORS.skyBlue }]}>Mark all read</Text>
        </Pressable>
      </View>

      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  markAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  notificationCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  notificationLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  iconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationContent: {
    flex: 1,
    gap: 4,
  },
  notificationText: {
    fontSize: 14,
    lineHeight: 20,
  },
  username: {
    fontWeight: 'bold',
  },
  timeText: {
    fontSize: 12,
  },
  postThumbnail: {
    width: 56,
    height: 56,
    borderRadius: 8,
  },
});
