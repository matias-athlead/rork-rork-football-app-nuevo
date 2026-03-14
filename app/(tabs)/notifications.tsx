import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, SafeAreaView, Platform } from 'react-native';
import { Image } from 'expo-image';
import Avatar from '@/src/components/Avatar';
import { useRouter, useFocusEffect } from 'expo-router';
import { Heart, MessageCircle, UserPlus, Trophy, Bell } from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { useAuth } from '@/src/hooks/useAuth';
import { useNotificationCount } from '@/src/hooks/useNotificationCount';
import { notificationService } from '@/src/services/notificationService';
import { Notification } from '@/src/types/Notification';
import { COLORS } from '@/src/utils/theme';
import * as Haptics from 'expo-haptics';

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { resetCount, refreshCount } = useNotificationCount();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const loadAndMarkRead = useCallback(async () => {
    if (!user) return;
    const loaded = await notificationService.getNotifications(user.id);
    setNotifications(loaded);
    // Mark all as read after 1.5 s so the badge resets smoothly
    setTimeout(async () => {
      await notificationService.markAllAsRead(user.id);
      resetCount();
    }, 1500);
  }, [user, resetCount]);

  // Reload and clear badge every time this tab comes into focus
  useFocusEffect(
    useCallback(() => {
      loadAndMarkRead();
    }, [loadAndMarkRead])
  );

  const handleTap = async (item: Notification) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // Mark individual notification as read immediately
    if (!item.isRead && user) {
      await notificationService.markAsRead(user.id, item.id);
      setNotifications(prev =>
        prev.map(n => n.id === item.id ? { ...n, isRead: true } : n)
      );
      refreshCount();
    }
    if (item.postId) {
      router.push(`/post/${item.postId}` as any);
    } else if (item.chatId) {
      router.push(`/chat/${item.chatId}` as any);
    } else if (item.userId) {
      router.push(`/profile/${item.userId}` as any);
    }
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const updated = notifications.map(n => ({ ...n, isRead: true }));
    setNotifications(updated);
    await notificationService.markAllAsRead(user.id);
    resetCount();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart size={16} color={COLORS.error} fill={COLORS.error} />;
      case 'comment':
        return <MessageCircle size={16} color={COLORS.skyBlue} />;
      case 'follow':
      case 'follow_request':
        return <UserPlus size={16} color={COLORS.primary} />;
      case 'message':
        return <MessageCircle size={16} color={COLORS.success} />;
      case 'ranking':
        return <Trophy size={16} color={COLORS.warning} />;
      default:
        return <Bell size={16} color={theme.textSecondary} />;
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

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const renderNotification = ({ item }: { item: Notification }) => (
    <Pressable
      onPress={() => handleTap(item)}
      style={[
        styles.notificationCard,
        { backgroundColor: item.isRead ? 'transparent' : `${COLORS.skyBlue}18` },
      ]}
    >
      {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: COLORS.primary }]} />}
      <View style={styles.notificationLeft}>
        <Pressable
          onPress={() => { if (item.userId) router.push(`/profile/${item.userId}` as any); }}
          style={styles.avatarWrapper}
        >
          <Avatar uri={item.userPhoto} username={item.username} size={46} />
          <View style={[styles.iconBadge, { backgroundColor: theme.card, borderColor: theme.background }]}>
            {getNotificationIcon(item.type)}
          </View>
        </Pressable>
        <View style={styles.notificationContent}>
          <Text style={[styles.notificationText, { color: theme.text }]} numberOfLines={2}>
            <Text style={styles.boldUsername}>{item.username}</Text>
            {` ${item.content}`}
          </Text>
          <Text style={[styles.timeText, { color: theme.textSecondary }]}>
            {getTimeAgo(item.createdAt)}
          </Text>
        </View>
      </View>
      {item.postThumbnail ? (
        <Image
          source={{ uri: item.postThumbnail }}
          style={styles.postThumbnail}
          contentFit="cover"
        />
      ) : null}
    </Pressable>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text }]}>Activity</Text>
        {unreadCount > 0 && (
          <Pressable onPress={handleMarkAllRead} hitSlop={8}>
            <Text style={[styles.markAllText, { color: COLORS.skyBlue }]}>Mark all read</Text>
          </Pressable>
        )}
      </View>

      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContainer,
          notifications.length === 0 && styles.emptyListContainer,
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Bell size={56} color={theme.textSecondary} strokeWidth={1.5} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No activity yet</Text>
            <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
              When someone likes your post, comments, or follows you, you'll see it here.
            </Text>
          </View>
        }
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
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  markAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  emptyListContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 12,
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    left: 4,
    top: '50%',
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: -3,
  },
  notificationLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrapper: {
    position: 'relative',
  },
  iconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationContent: {
    flex: 1,
    gap: 3,
  },
  notificationText: {
    fontSize: 14,
    lineHeight: 19,
  },
  boldUsername: {
    fontWeight: '700',
  },
  timeText: {
    fontSize: 12,
  },
  postThumbnail: {
    width: 52,
    height: 52,
    borderRadius: 8,
    marginLeft: 8,
  },
});
