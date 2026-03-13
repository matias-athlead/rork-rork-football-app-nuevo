import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, SafeAreaView, TextInput, Modal, Alert, Platform, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import Avatar from '@/src/components/Avatar';
import { useRouter } from 'expo-router';
import { ArrowLeft, Search, Plus, X, Users, Camera, Play, UserMinus, UserPlus, LogOut, BellOff, Bell, FileText, Flag, Ban, ChevronRight, Trash2 } from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { useAuth } from '@/src/hooks/useAuth';
import { authService } from '@/src/services/authService';
import { User } from '@/src/types/User';
import { COLORS } from '@/src/utils/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';

interface GroupChat {
  id: string;
  name: string;
  photo: string;
  members: string[];
  adminId: string;
  description?: string;
  isMuted?: boolean;
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
  const { user } = useAuth();
  const router = useRouter();
  const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [groups, setGroups] = useState<GroupChat[]>([]);
  const [groupPhoto, setGroupPhoto] = useState<string | null>(null);
  const [chatPreviews, setChatPreviews] = useState<Record<string, { lastMessage: string; sharedPost?: SharedPost }>>({})
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupChat | null>(null);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [showRemoveMembers, setShowRemoveMembers] = useState(false);
  const [showEditDescription, setShowEditDescription] = useState(false);
  const [groupDescription, setGroupDescription] = useState('');
  const [newMembersToAdd, setNewMembersToAdd] = useState<string[]>([]);
  const [membersToRemove, setMembersToRemove] = useState<string[]>([]);

  useEffect(() => {
    loadGroups();
    loadChatPreviews();
    loadRegisteredUsers();
  }, []);

  const loadRegisteredUsers = async () => {
    try {
      const users = await authService.getAllUsers();
      setRegisteredUsers(users.filter(u => u.id !== user?.id));
    } catch (error) {
      console.log('Error loading registered users:', error);
    }
  };

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

  const directChats: ChatPreview[] = registeredUsers.slice(0, 15).map((contact, index) => {
    const preview = chatPreviews[contact.id];
    return {
      id: contact.id,
      type: 'direct' as const,
      name: contact.username,
      photo: contact.profilePhoto,
      lastMessage: preview?.lastMessage || 'Tap to start a conversation',
      timestamp: preview ? `${index + 1}h ago` : '',
      unread: preview ? index % 3 === 0 : false,
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
      adminId: 'current_user',
      description: '',
      isMuted: false,
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

  const handleOpenGroupSettings = (groupId: string) => {
    const group = groups.find(g => `group_${g.id}` === groupId);
    if (group) {
      setSelectedGroup(group);
      setGroupDescription(group.description || '');
      setShowGroupSettings(true);
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  const handleUpdateGroupPhoto = async () => {
    if (!selectedGroup) return;
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
        const updatedGroups = groups.map(g =>
          g.id === selectedGroup.id ? { ...g, photo: result.assets[0].uri } : g
        );
        setGroups(updatedGroups);
        setSelectedGroup({ ...selectedGroup, photo: result.assets[0].uri });
        await saveGroups(updatedGroups);
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (error) {
      console.log('Error updating group photo:', error);
    }
  };

  const handleToggleMuteGroup = async () => {
    if (!selectedGroup) return;
    const updatedGroups = groups.map(g =>
      g.id === selectedGroup.id ? { ...g, isMuted: !g.isMuted } : g
    );
    setGroups(updatedGroups);
    setSelectedGroup({ ...selectedGroup, isMuted: !selectedGroup.isMuted });
    await saveGroups(updatedGroups);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleSaveDescription = async () => {
    if (!selectedGroup) return;
    const updatedGroups = groups.map(g =>
      g.id === selectedGroup.id ? { ...g, description: groupDescription.trim() } : g
    );
    setGroups(updatedGroups);
    setSelectedGroup({ ...selectedGroup, description: groupDescription.trim() });
    await saveGroups(updatedGroups);
    setShowEditDescription(false);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleAddMembersToGroup = async () => {
    if (!selectedGroup || newMembersToAdd.length === 0) return;
    const updatedMembers = [...selectedGroup.members, ...newMembersToAdd];
    const updatedGroups = groups.map(g =>
      g.id === selectedGroup.id ? { ...g, members: updatedMembers } : g
    );
    setGroups(updatedGroups);
    setSelectedGroup({ ...selectedGroup, members: updatedMembers });
    await saveGroups(updatedGroups);
    setNewMembersToAdd([]);
    setShowAddMembers(false);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    Alert.alert('Success', 'Members added to group');
  };

  const handleRemoveMembersFromGroup = async () => {
    if (!selectedGroup || membersToRemove.length === 0) return;
    const updatedMembers = selectedGroup.members.filter(m => !membersToRemove.includes(m));
    const updatedGroups = groups.map(g =>
      g.id === selectedGroup.id ? { ...g, members: updatedMembers } : g
    );
    setGroups(updatedGroups);
    setSelectedGroup({ ...selectedGroup, members: updatedMembers });
    await saveGroups(updatedGroups);
    setMembersToRemove([]);
    setShowRemoveMembers(false);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    Alert.alert('Success', 'Members removed from group');
  };

  const handleLeaveGroup = () => {
    if (!selectedGroup) return;
    Alert.alert(
      'Leave Group',
      `Are you sure you want to leave "${selectedGroup.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            const updatedGroups = groups.filter(g => g.id !== selectedGroup.id);
            setGroups(updatedGroups);
            await saveGroups(updatedGroups);
            setShowGroupSettings(false);
            setSelectedGroup(null);
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          },
        },
      ]
    );
  };

  const handleReportGroup = () => {
    Alert.alert(
      'Report Group',
      'Are you sure you want to report this group for inappropriate content?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Reported', 'Thank you for your report. We will review this group.');
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          },
        },
      ]
    );
  };

  const handleBlockGroup = () => {
    if (!selectedGroup) return;
    Alert.alert(
      'Block Group',
      `Are you sure you want to block "${selectedGroup.name}"? You will no longer receive messages from this group.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            const updatedGroups = groups.filter(g => g.id !== selectedGroup.id);
            setGroups(updatedGroups);
            await saveGroups(updatedGroups);
            setShowGroupSettings(false);
            setSelectedGroup(null);
            Alert.alert('Blocked', 'Group has been blocked');
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          },
        },
      ]
    );
  };

  const isAdmin = selectedGroup?.adminId === 'current_user';

  const renderChat = ({ item }: { item: ChatPreview }) => (
    <Pressable
      onPress={() => router.push(`/chat/${item.id}` as any)}
      onLongPress={() => {
        if (item.type === 'group') {
          handleOpenGroupSettings(item.id);
        }
      }}
      style={[
        styles.chatItem,
        { backgroundColor: item.unread ? `${COLORS.skyBlue}10` : 'transparent' },
      ]}
    >
      <View style={styles.avatarContainer}>
        <Avatar uri={item.photo} username={item.name} size={56} />
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
        <Pressable onPress={() => {
          try {
            if (Platform.OS !== 'web') {
              router.back();
            } else {
              router.push('/(tabs)');
            }
          } catch {
            router.push('/(tabs)');
          }
        }} style={styles.backButton}>
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
              {searchQuery ? 'No messages found' : 'No conversations yet.\nRegister more accounts to start messaging!'}
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
                <Text style={[styles.inputLabel, { color: theme.text }]}>{`Select Members (${selectedUsers.length})`}</Text>
                <FlatList
                  data={registeredUsers.slice(0, 10)}
                  style={styles.usersList}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => {
                    const isSelected = selectedUsers.includes(item.id);
                    return (
                      <Pressable
                        onPress={() => handleToggleUser(item.id)}
                        style={[styles.userItem, { backgroundColor: isSelected ? `${COLORS.skyBlue}20` : theme.card }]}
                      >
                        <Avatar uri={item.profilePhoto} username={item.username} size={40} />
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

      <Modal
        visible={showGroupSettings}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowGroupSettings(false);
          setSelectedGroup(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.groupSettingsContent, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Group Settings</Text>
              <Pressable onPress={() => {
                setShowGroupSettings(false);
                setSelectedGroup(null);
              }}>
                <X size={24} color={theme.text} />
              </Pressable>
            </View>

            {selectedGroup && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.groupHeader}>
                  <Pressable onPress={isAdmin ? handleUpdateGroupPhoto : undefined}>
                    <Image source={{ uri: selectedGroup.photo }} style={styles.groupSettingsPhoto} />
                    {isAdmin && (
                      <View style={[styles.editPhotoBadge, { backgroundColor: COLORS.skyBlue }]}>
                        <Camera size={16} color={COLORS.white} />
                      </View>
                    )}
                  </Pressable>
                  <Text style={[styles.groupSettingsName, { color: theme.text }]}>{selectedGroup.name}</Text>
                  <Text style={[styles.groupMemberCount, { color: theme.textSecondary }]}>
                    {selectedGroup.members.length} members
                  </Text>
                </View>

                {selectedGroup.description && (
                  <View style={[styles.descriptionSection, { backgroundColor: theme.card }]}>
                    <Text style={[styles.descriptionText, { color: theme.text }]}>{selectedGroup.description}</Text>
                  </View>
                )}

                <View style={styles.settingsSection}>
                  {isAdmin && (
                    <>
                      <Pressable
                        onPress={() => setShowAddMembers(true)}
                        style={[styles.settingsItem, { backgroundColor: theme.card }]}
                      >
                        <View style={[styles.settingsIconContainer, { backgroundColor: `${COLORS.skyBlue}20` }]}>
                          <UserPlus size={20} color={COLORS.skyBlue} />
                        </View>
                        <Text style={[styles.settingsItemText, { color: theme.text }]}>Add Members</Text>
                        <ChevronRight size={20} color={theme.textSecondary} />
                      </Pressable>

                      <Pressable
                        onPress={() => setShowRemoveMembers(true)}
                        style={[styles.settingsItem, { backgroundColor: theme.card }]}
                      >
                        <View style={[styles.settingsIconContainer, { backgroundColor: `${COLORS.error}20` }]}>
                          <UserMinus size={20} color={COLORS.error} />
                        </View>
                        <Text style={[styles.settingsItemText, { color: theme.text }]}>Remove Members</Text>
                        <ChevronRight size={20} color={theme.textSecondary} />
                      </Pressable>
                    </>
                  )}

                  <Pressable
                    onPress={() => setShowEditDescription(true)}
                    style={[styles.settingsItem, { backgroundColor: theme.card }]}
                  >
                    <View style={[styles.settingsIconContainer, { backgroundColor: `${COLORS.primary}20` }]}>
                      <FileText size={20} color={COLORS.primary} />
                    </View>
                    <Text style={[styles.settingsItemText, { color: theme.text }]}>
                      {selectedGroup.description ? 'Edit Description' : 'Add Description'}
                    </Text>
                    <ChevronRight size={20} color={theme.textSecondary} />
                  </Pressable>

                  <Pressable
                    onPress={handleToggleMuteGroup}
                    style={[styles.settingsItem, { backgroundColor: theme.card }]}
                  >
                    <View style={[styles.settingsIconContainer, { backgroundColor: `${COLORS.skyBlue}20` }]}>
                      {selectedGroup.isMuted ? (
                        <BellOff size={20} color={COLORS.skyBlue} />
                      ) : (
                        <Bell size={20} color={COLORS.skyBlue} />
                      )}
                    </View>
                    <Text style={[styles.settingsItemText, { color: theme.text }]}>
                      {selectedGroup.isMuted ? 'Unmute Group' : 'Mute Group'}
                    </Text>
                  </Pressable>
                </View>

                <View style={[styles.settingsSection, { marginTop: 24 }]}>
                  <Pressable
                    onPress={handleLeaveGroup}
                    style={[styles.settingsItem, { backgroundColor: theme.card }]}
                  >
                    <View style={[styles.settingsIconContainer, { backgroundColor: `${COLORS.error}20` }]}>
                      <LogOut size={20} color={COLORS.error} />
                    </View>
                    <Text style={[styles.settingsItemText, { color: COLORS.error }]}>Leave Group</Text>
                  </Pressable>

                  <Pressable
                    onPress={handleReportGroup}
                    style={[styles.settingsItem, { backgroundColor: theme.card }]}
                  >
                    <View style={[styles.settingsIconContainer, { backgroundColor: `${COLORS.error}20` }]}>
                      <Flag size={20} color={COLORS.error} />
                    </View>
                    <Text style={[styles.settingsItemText, { color: COLORS.error }]}>Report Group</Text>
                  </Pressable>

                  <Pressable
                    onPress={handleBlockGroup}
                    style={[styles.settingsItem, { backgroundColor: theme.card }]}
                  >
                    <View style={[styles.settingsIconContainer, { backgroundColor: `${COLORS.error}20` }]}>
                      <Ban size={20} color={COLORS.error} />
                    </View>
                    <Text style={[styles.settingsItemText, { color: COLORS.error }]}>Block Group</Text>
                  </Pressable>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={showAddMembers}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowAddMembers(false);
          setNewMembersToAdd([]);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Add Members</Text>
              <Pressable onPress={() => {
                setShowAddMembers(false);
                setNewMembersToAdd([]);
              }}>
                <X size={24} color={theme.text} />
              </Pressable>
            </View>
            <FlatList
              data={registeredUsers.filter(u => !selectedGroup?.members.includes(u.id)).slice(0, 15)}
              style={styles.usersList}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const isSelected = newMembersToAdd.includes(item.id);
                return (
                  <Pressable
                    onPress={() => {
                      if (Platform.OS !== 'web') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      setNewMembersToAdd(prev =>
                        prev.includes(item.id)
                          ? prev.filter(id => id !== item.id)
                          : [...prev, item.id]
                      );
                    }}
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
            <Pressable
              onPress={handleAddMembersToGroup}
              disabled={newMembersToAdd.length === 0}
              style={[styles.createGroupBtn, { backgroundColor: newMembersToAdd.length > 0 ? COLORS.skyBlue : theme.border }]}
            >
              <UserPlus size={20} color={COLORS.white} />
              <Text style={styles.createGroupText}>{`Add ${newMembersToAdd.length} Members`}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showRemoveMembers}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowRemoveMembers(false);
          setMembersToRemove([]);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Remove Members</Text>
              <Pressable onPress={() => {
                setShowRemoveMembers(false);
                setMembersToRemove([]);
              }}>
                <X size={24} color={theme.text} />
              </Pressable>
            </View>
            <FlatList
              data={registeredUsers.filter(u => selectedGroup?.members.includes(u.id))}
              style={styles.usersList}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const isSelected = membersToRemove.includes(item.id);
                return (
                  <Pressable
                    onPress={() => {
                      if (Platform.OS !== 'web') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      setMembersToRemove(prev =>
                        prev.includes(item.id)
                          ? prev.filter(id => id !== item.id)
                          : [...prev, item.id]
                      );
                    }}
                    style={[styles.userItem, { backgroundColor: isSelected ? `${COLORS.error}20` : theme.card }]}
                  >
                    <Image source={{ uri: item.profilePhoto }} style={styles.userAvatar} />
                    <Text style={[styles.userName, { color: theme.text }]}>{item.username}</Text>
                    <View style={[styles.userCheckbox, { borderColor: theme.border, backgroundColor: isSelected ? COLORS.error : 'transparent' }]}>
                      {isSelected && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                  </Pressable>
                );
              }}
            />
            <Pressable
              onPress={handleRemoveMembersFromGroup}
              disabled={membersToRemove.length === 0}
              style={[styles.createGroupBtn, { backgroundColor: membersToRemove.length > 0 ? COLORS.error : theme.border }]}
            >
              <Trash2 size={20} color={COLORS.white} />
              <Text style={styles.createGroupText}>{`Remove ${membersToRemove.length} Members`}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showEditDescription}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditDescription(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.descriptionModalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Group Description</Text>
              <Pressable onPress={() => setShowEditDescription(false)}>
                <X size={24} color={theme.text} />
              </Pressable>
            </View>
            <TextInput
              style={[styles.descriptionInput, { color: theme.text, backgroundColor: theme.inputBackground, borderColor: theme.border }]}
              placeholder="Add a description for this group..."
              placeholderTextColor={theme.textSecondary}
              value={groupDescription}
              onChangeText={setGroupDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <Pressable
              onPress={handleSaveDescription}
              style={[styles.createGroupBtn, { backgroundColor: COLORS.skyBlue }]}
            >
              <Text style={styles.createGroupText}>Save Description</Text>
            </Pressable>
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
    paddingTop: 8,
    paddingBottom: 16,
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
  groupSettingsContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  groupHeader: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  groupSettingsPhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editPhotoBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  groupSettingsName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 12,
  },
  groupMemberCount: {
    fontSize: 14,
    marginTop: 4,
  },
  descriptionSection: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  settingsSection: {
    gap: 8,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 12,
  },
  settingsIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  descriptionModalContent: {
    margin: 20,
    borderRadius: 20,
    padding: 20,
  },
  descriptionInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    minHeight: 120,
    marginBottom: 16,
  },
});
