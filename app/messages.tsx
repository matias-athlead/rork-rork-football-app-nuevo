import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, SafeAreaView, TextInput, Modal, Alert, Platform } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ArrowLeft, Search, Plus, X, Users, Camera, Play } from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { MOCK_USERS } from '@/src/services/mockData';
import { COLORS } from '@/src/utils/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';

interface GroupChat {
  id: string;
  name: string;
  photo: string;
  members: string[];
  createdAt: string;
  lastMessage?: string;
  lastMessageTime?: string;
}

interface SharedPost {
  id: string;
  userId: string;
  username: string;
  userPhoto: string;
  videoUrl: string;
  thumbnailUrl: string;
  caption: string;
}

interface ChatPreview {
  id: string;
  type: 'direct' | 'group';
  name: string;
  photo: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  sharedPost?: SharedPost;
}

const GROUPS_KEY = '@athlead_groups';

export default function MessagesScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [groups, setGroups] = useState<GroupChat[]>([]);
  const [groupPhoto, setGroupPhoto] = useState<string | null>(null);
  const [chatPreviews, setChatPreviews] = useState<Record<string, { lastMessage: string; sharedPost?: SharedPost }>>({});

  useEffect(() => {
    loadGroups();
    loadChatPreviews();
  }, []);

  const loadGroups = async () => {
    try {
      const stored = await AsyncStorage.getItem(GROUPS_KEY);
      if (stored) {
        setGroups(JSON.parse(stored));
      }
    } catch (error) {
      console.log('Error loading groups:', error);
    }
  };

  const loadChatPreviews = async () => {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const messageKeys = allKeys.filter(key => key.startsWith('@chat_messages_'));
      const previews: Record<string, { lastMessage: string; sharedPost?: SharedPost }> = {};
      
      for (const key of messageKeys) {
        const chatId = key.replace('@chat_messages_', '');
        const messagesData = await AsyncStorage.getItem(key);
        if (messagesData) {
          const messages = JSON.parse(messagesData);
          if (messages.length > 0) {
            const lastMsg = messages[messages.length - 1];
            previews[chatId] = {
              lastMessage: lastMsg.text || (lastMsg.postData ? 'Shared a post' : 'Sent a photo'),
              sharedPost: lastMsg.postData,
            };
          }
        }
      }
      setChatPreviews(previews);
    } catch (error) {
      console.log('Error loading chat previews:', error);
    }
  };

  const saveGroups = async (updatedGroups: GroupChat[]) => {
    try {
      await AsyncStorage.setItem(GROUPS_KEY, JSON.stringify(updatedGroups));
    } catch (error) {
      console.log('Error saving groups:', error);
    }
  };

  const directChats: ChatPreview[] = MOCK_USERS.slice(0, 15).map((user, index) => {
    const preview = chatPreviews[user.id];
    return {
      id: user.id,
      type: 'direct' as const,
      name: user.username,
      photo: user.profilePhoto,
      lastMessage: preview?.lastMessage || 'Hey! How are you doing?',
      timestamp: `${index + 1}h ago`,
      unread: index % 3 === 0,
      sharedPost: preview?.sharedPost,
    };
  });

  const groupChats: ChatPreview[] = groups.map((group) => ({
    id: `group_${group.id}`,
    type: 'group' as const,
    name: group.name,
    photo: group.photo,
    lastMessage: group.lastMessage || 'Group created',
    timestamp: group.lastMessageTime || 'Just now',
    unread: false,
  }));

  const filteredChats = useMemo(() => {
    const allChats = [...groupChats, ...directChats];
    if (!searchQuery.trim()) return allChats;
    const query = searchQuery.toLowerCase();
    return allChats.filter(chat => 
      chat.name.toLowerCase().includes(query) ||
      chat.lastMessage.toLowerCase().includes(query)
    );
  }, [searchQuery, groupChats, directChats]);

  const handlePickGroupPhoto = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Please grant permission to access photos');
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setGroupPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.log('Error picking group photo:', error);
    }
  };

  const handleToggleUser = (userId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }
    if (selectedUsers.length < 2) {
      Alert.alert('Error', 'Please select at least 2 members');
      return;
    }
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const newGroup: GroupChat = {
      id: Date.now().toString(),
      name: groupName.trim(),
      photo: groupPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(groupName)}&background=60A5FA&color=fff&size=200`,
      members: selectedUsers,
      createdAt: new Date().toISOString(),
      lastMessage: 'Group created',
      lastMessageTime: 'Just now',
    };

    const updatedGroups = [newGroup, ...groups];
    setGroups(updatedGroups);
    await saveGroups(updatedGroups);

    Alert.alert('Success', `Group "${groupName}" created!`, [
      {
        text: 'Open Chat',
        onPress: () => router.push(`/chat/group_${newGroup.id}` as any),
      },
      { text: 'OK' },
    ]);
    
    setShowCreateGroup(false);
    setGroupName('');
    setSelectedUsers([]);
    setGroupPhoto(null);
  };

  const renderChat = ({ item }: { item: ChatPreview }) => (
    <Pressable
      onPress={() => router.push(`/chat/${item.id}` as any)}
      style={[
        styles.chatItem,
        { backgroundColor: item.unread ? `${COLORS.skyBlue}10` : 'transparent' },
      ]}
    >
      <View style={styles.avatarContainer}>
        <Image source={{ uri: item.photo }} style={styles.avatar} />
        {item.type === 'group' && (
          <View style={styles.groupBadge}>
            <Users size={10} color={COLORS.white} />
          </View>
        )}
      </View>
      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={[styles.username, { color: theme.text }]}>{item.name}</Text>
          <Text style={[styles.timestamp, { color: theme.textSecondary }]}>
            {item.timestamp}
          </Text>
        </View>
        {item.sharedPost ? (
          <View style={styles.sharedPostPreview}>
            <View style={styles.sharedPostThumbnailContainer}>
              <Image source={{ uri: item.sharedPost.thumbnailUrl }} style={styles.sharedPostThumbnail} />
              <View style={styles.playIconSmall}>
                <Play size={8} color={COLORS.white} fill={COLORS.white} />
              </View>
            </View>
            <View style={styles.sharedPostInfo}>
              <Text style={[styles.sharedPostLabel, { color: COLORS.skyBlue }]}>Shared post</Text>
              <Text style={[styles.sharedPostCaption, { color: theme.textSecondary }]} numberOfLines={1}>
                {item.sharedPost.caption || `Video by @${item.sharedPost.username}`}
              </Text>
            </View>
          </View>
        ) : (
          <Text
            style={[styles.lastMessage, { color: item.unread ? theme.text : theme.textSecondary }]}
            numberOfLines={1}
          >
            {item.lastMessage}
          </Text>
        )}
      </View>
      {item.unread && <View style={styles.unreadBadge} />}
    </Pressable>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.push('/(tabs)')} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Messages</Text>
        <View style={styles.headerActions}>
          <Pressable onPress={() => setShowCreateGroup(true)} style={styles.headerAction}>
            <Plus size={24} color={theme.text} />
          </Pressable>
        </View>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: theme.background }]}>
        <View style={[styles.searchBar, { backgroundColor: theme.inputBackground }]}>
          <Search size={20} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search messages..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <X size={18} color={theme.textSecondary} />
            </Pressable>
          )}
        </View>
      </View>

      <FlatList
        data={filteredChats}
        renderItem={renderChat}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No messages found
            </Text>
          </View>
        }
      />

      <Modal
        visible={showCreateGroup}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateGroup(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Create Group</Text>
              <Pressable onPress={() => setShowCreateGroup(false)}>
                <X size={24} color={theme.text} />
              </Pressable>
            </View>

            <View style={styles.modalForm}>
              <Pressable onPress={handlePickGroupPhoto} style={styles.groupPhotoSection}>
                {groupPhoto ? (
                  <Image source={{ uri: groupPhoto }} style={styles.groupPhotoPreview} />
                ) : (
                  <View style={[styles.groupPhotoPlaceholder, { backgroundColor: theme.inputBackground }]}>
                    <Camera size={32} color={theme.textSecondary} />
                    <Text style={[styles.groupPhotoText, { color: theme.textSecondary }]}>Add Photo</Text>
                  </View>
                )}
              </Pressable>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>Group Name</Text>
                <TextInput
                  style={[styles.modalInput, { color: theme.text, backgroundColor: theme.inputBackground, borderColor: theme.border }]}
                  placeholder="Enter group name"
                  placeholderTextColor={theme.textSecondary}
                  value={groupName}
                  onChangeText={setGroupName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>Select Members ({selectedUsers.length})</Text>
                <FlatList
                  data={MOCK_USERS.slice(0, 10)}
                  style={styles.usersList}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => {
                    const isSelected = selectedUsers.includes(item.id);
                    return (
                      <Pressable
                        onPress={() => handleToggleUser(item.id)}
                        style={[styles.userItem, { backgroundColor: isSelected ? `${COLORS.skyBlue}20` : theme.card }]}
                      >
                        <Image source={{ uri: item.profilePhoto }} style={styles.userAvatar} />
                        <Text style={[styles.userName, { color: theme.text }]}>{item.username}</Text>
                        <View style={[styles.userCheckbox, { borderColor: theme.border, backgroundColor: isSelected ? COLORS.skyBlue : 'transparent' }]}>
                          {isSelected && <Text style={styles.checkmark}>✓</Text>}
                        </View>
                      </Pressable>
                    );
                  }}
                />
              </View>

              <Pressable
                onPress={handleCreateGroup}
                style={[styles.createGroupBtn, { backgroundColor: COLORS.skyBlue }]}
              >
                <Users size={20} color={COLORS.white} />
                <Text style={styles.createGroupText}>Create Group</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingVertical: 16,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  groupBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.skyBlue,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  sharedPostPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  sharedPostThumbnailContainer: {
    position: 'relative',
  },
  sharedPostThumbnail: {
    width: 36,
    height: 48,
    borderRadius: 4,
  },
  playIconSmall: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -6 }, { translateY: -6 }],
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 6,
    width: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sharedPostInfo: {
    flex: 1,
  },
  sharedPostLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  sharedPostCaption: {
    fontSize: 13,
  },
  groupPhotoSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  groupPhotoPreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  groupPhotoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  groupPhotoText: {
    fontSize: 12,
    fontWeight: '500',
  },
  chatContent: {
    flex: 1,
    gap: 4,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 13,
  },
  lastMessage: {
    fontSize: 14,
  },
  unreadBadge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.skyBlue,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerAction: {
    padding: 4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalForm: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  modalInput: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    fontSize: 15,
    borderWidth: 1,
  },
  usersList: {
    maxHeight: 300,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    gap: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  userCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  createGroupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 10,
  },
  createGroupText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
