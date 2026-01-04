import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, SafeAreaView, TextInput, Modal, Alert, Platform } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ArrowLeft, Search, Plus, X, Users } from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { MOCK_USERS } from '@/src/services/mockData';
import { COLORS } from '@/src/utils/theme';
import * as Haptics from 'expo-haptics';

export default function MessagesScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const chats = MOCK_USERS.slice(0, 15).map((user, index) => ({
    id: user.id,
    user,
    lastMessage: 'Hey! How are you doing?',
    timestamp: `${index + 1}h ago`,
    unread: index % 3 === 0,
  }));

  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chats;
    const query = searchQuery.toLowerCase();
    return chats.filter(chat => 
      chat.user.username.toLowerCase().includes(query) ||
      chat.lastMessage.toLowerCase().includes(query)
    );
  }, [searchQuery, chats]);

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

  const handleCreateGroup = () => {
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
    Alert.alert('Success', `Group "${groupName}" created with ${selectedUsers.length} members!`);
    setShowCreateGroup(false);
    setGroupName('');
    setSelectedUsers([]);
  };

  const renderChat = ({ item }: { item: typeof chats[0] }) => (
    <Pressable
      onPress={() => router.push(`/chat/${item.id}` as any)}
      style={[
        styles.chatItem,
        { backgroundColor: item.unread ? `${COLORS.skyBlue}10` : 'transparent' },
      ]}
    >
      <Image source={{ uri: item.user.profilePhoto }} style={styles.avatar} />
      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={[styles.username, { color: theme.text }]}>{item.user.username}</Text>
          <Text style={[styles.timestamp, { color: theme.textSecondary }]}>
            {item.timestamp}
          </Text>
        </View>
        <Text
          style={[styles.lastMessage, { color: item.unread ? theme.text : theme.textSecondary }]}
          numberOfLines={1}
        >
          {item.lastMessage}
        </Text>
      </View>
      {item.unread && <View style={styles.unreadBadge} />}
    </Pressable>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
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
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
