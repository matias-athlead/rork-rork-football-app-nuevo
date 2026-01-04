import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, KeyboardAvoidingView, Platform, Pressable, SafeAreaView } from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Send, Phone, Video, Calendar } from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { MOCK_USERS } from '@/src/services/mockData';
import { COLORS } from '@/src/utils/theme';

export default function ChatScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [message, setMessage] = useState('');

  const chatUser = MOCK_USERS.find(u => u.id === id) || MOCK_USERS[0];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.text} />
        </Pressable>
        <Image source={{ uri: chatUser.profilePhoto }} style={styles.avatar} />
        <Text style={[styles.username, { color: theme.text }]}>{chatUser.username}</Text>
        <View style={styles.headerActions}>
          <Pressable onPress={() => router.push(`/audio-call/${id}` as any)} style={styles.headerAction}>
            <Phone size={22} color={theme.text} />
          </Pressable>
          <Pressable onPress={() => router.push(`/video-call/${id}` as any)} style={styles.headerAction}>
            <Video size={22} color={theme.text} />
          </Pressable>
          <Pressable style={styles.headerAction}>
            <Calendar size={22} color={theme.text} />
          </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={styles.messagesContainer}>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            Start a conversation with {chatUser.username}
          </Text>
        </View>

        <View style={[styles.inputContainer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
          <TextInput
            style={[styles.input, { color: theme.text, backgroundColor: theme.inputBackground }]}
            placeholder="Type a message..."
            placeholderTextColor={theme.textSecondary}
            value={message}
            onChangeText={setMessage}
            multiline
          />
          <Pressable
            onPress={() => {
              if (message.trim()) {
                setMessage('');
              }
            }}
            style={[styles.sendButton, { backgroundColor: message.trim() ? COLORS.primary : theme.border }]}
          >
            <Send size={20} color={COLORS.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  username: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 16,
  },
  headerAction: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    gap: 12,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    fontSize: 16,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
