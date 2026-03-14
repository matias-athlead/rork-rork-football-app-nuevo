import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, Modal, Alert, FlatList as RNFlatList } from 'react-native';
import { Image } from 'expo-image';
import Avatar from '@/src/components/Avatar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Send, Phone, Video, StickyNote, Plus, X, Check, Image as ImageIcon, Clock, Infinity, Calendar, ChevronRight, Play } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/src/hooks/useTheme';
import { useAuth } from '@/src/hooks/useAuth';
import { authService } from '@/src/services/authService';
import { notificationService } from '@/src/services/notificationService';
import { User } from '@/src/types/User';
import { COLORS } from '@/src/utils/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Calendar as RNCalendar } from 'react-native-calendars';

interface Note {
  id: string;
  text: string;
  createdAt: string;
}

interface Task {
  id: string;
  text: string;
  date: string;
  time: string;
  completed: boolean;
  createdAt: string;
}

interface ChatMessage {
  id: string;
  text: string;
  mediaUrl?: string;
  mediaType?: 'permanent' | 'ephemeral';
  isViewed?: boolean;
  postData?: {
    id: string;
    userId: string;
    username: string;
    userPhoto: string;
    videoUrl: string;
    thumbnailUrl: string;
    caption: string;
    likes: number;
  };
  isSent: boolean;
  createdAt: string;
}

export default function ChatScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [message, setMessage] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newNote, setNewNote] = useState('');
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');
  const [newTaskTime, setNewTaskTime] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [deletedPostIds, setDeletedPostIds] = useState<string[]>([]);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [photoType, setPhotoType] = useState<'permanent' | 'ephemeral'>('permanent');
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showCalendarView, setShowCalendarView] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [chatUser, setChatUser] = useState<Partial<User> | null>(null);
  const flatListRef = useRef<any>(null);
  const NOTES_KEY = `@chat_notes_${id}`;
  const TASKS_KEY = `@chat_tasks_${id}`;
  const MESSAGES_KEY = `@chat_messages_${id}`;
  const DELETED_POSTS_KEY = '@athlead_deleted_posts';

  useEffect(() => {
    const loadNotes = async () => {
      try {
        const stored = await AsyncStorage.getItem(NOTES_KEY);
        if (stored) {
          setNotes(JSON.parse(stored));
        }
      } catch (error) {
        console.log('Error loading notes:', error);
      }
    };

    const loadTasks = async () => {
      try {
        const stored = await AsyncStorage.getItem(TASKS_KEY);
        if (stored) {
          setTasks(JSON.parse(stored));
        }
      } catch (error) {
        console.log('Error loading tasks:', error);
      }
    };

    const loadMessages = async () => {
      try {
        const stored = await AsyncStorage.getItem(MESSAGES_KEY);
        if (stored) {
          setMessages(JSON.parse(stored));
        }
      } catch (error) {
        console.log('Error loading messages:', error);
      }
    };

    const loadDeletedPosts = async () => {
      try {
        const deletedData = await AsyncStorage.getItem(DELETED_POSTS_KEY);
        if (deletedData) {
          setDeletedPostIds(JSON.parse(deletedData));
        }
      } catch (error) {
        console.log('Error loading deleted posts:', error);
      }
    };

    loadNotes();
    loadTasks();
    loadMessages();
    loadDeletedPosts();
  }, [id, NOTES_KEY, TASKS_KEY, MESSAGES_KEY]);

  useEffect(() => {
    const loadChatUser = async () => {
      const chatId = Array.isArray(id) ? id[0] : String(id);
      if (chatId.startsWith('group_')) {
        try {
          const stored = await AsyncStorage.getItem('@athlead_groups');
          if (stored) {
            const groups = JSON.parse(stored);
            const groupId = chatId.replace('group_', '');
            const group = groups.find((g: any) => g.id === groupId);
            if (group) {
              setChatUser({ id: chatId, username: group.name, profilePhoto: group.photo } as any);
              return;
            }
          }
        } catch {}
        setChatUser({ id: chatId, username: 'Group Chat', profilePhoto: '' } as any);
      } else {
        try {
          const users = await authService.getAllUsers();
          const found = users.find(u => u.id === chatId);
          if (found) {
            setChatUser(found);
          } else {
            setChatUser({ id: chatId, username: chatId, profilePhoto: '' } as any);
          }
        } catch {
          setChatUser({ id: chatId, username: chatId, profilePhoto: '' } as any);
        }
      }
    };
    loadChatUser();
  }, [id]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const saveNotes = async (updatedNotes: Note[]) => {
    try {
      await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(updatedNotes));
    } catch (error) {
      console.log('Error saving notes:', error);
    }
  };

  const saveTasks = async (updatedTasks: Task[]) => {
    try {
      await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(updatedTasks));
    } catch (error) {
      console.log('Error saving tasks:', error);
    }
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const note: Note = {
      id: Date.now().toString(),
      text: newNote.trim(),
      createdAt: new Date().toISOString(),
    };
    const updatedNotes = [note, ...notes];
    setNotes(updatedNotes);
    saveNotes(updatedNotes);
    setNewNote('');
  };

  const handleDeleteNote = (noteId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const updatedNotes = notes.filter(n => n.id !== noteId);
    setNotes(updatedNotes);
    saveNotes(updatedNotes);
  };

  const handleAddTask = () => {
    if (!newTaskText.trim() || !newTaskDate || !newTaskTime) {
      Alert.alert('Error', 'Please fill all task fields');
      return;
    }
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const task: Task = {
      id: Date.now().toString(),
      text: newTaskText.trim(),
      date: newTaskDate,
      time: newTaskTime,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    const updatedTasks = [task, ...tasks];
    setTasks(updatedTasks);
    saveTasks(updatedTasks);
    setNewTaskText('');
    setNewTaskDate('');
    setNewTaskTime('');
    setShowAddTask(false);
  };

  const handleToggleTask = (taskId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const updatedTasks = tasks.map(t => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    setTasks(updatedTasks);
    saveTasks(updatedTasks);
  };

  const handleDeleteTask = (taskId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const updatedTasks = tasks.filter(t => t.id !== taskId);
    setTasks(updatedTasks);
    saveTasks(updatedTasks);
  };

  const saveMessages = async (updatedMessages: ChatMessage[]) => {
    try {
      await AsyncStorage.setItem(MESSAGES_KEY, JSON.stringify(updatedMessages));
    } catch (error) {
      console.log('Error saving messages:', error);
    }
  };

  const handlePickImage = async () => {
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
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedPhoto(result.assets[0].uri);
        setShowPhotoOptions(true);
      }
    } catch (error) {
      console.log('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSendPhoto = () => {
    if (!selectedPhoto) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text: '',
      mediaUrl: selectedPhoto,
      mediaType: photoType,
      isViewed: false,
      isSent: true,
      createdAt: new Date().toISOString(),
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    saveMessages(updatedMessages);
    setSelectedPhoto(null);
    setShowPhotoOptions(false);
    setPhotoType('permanent');
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text: message.trim(),
      isSent: true,
      createdAt: new Date().toISOString(),
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    saveMessages(updatedMessages);
    setMessage('');

    // Simulate a reply for real-time feel
    const chatId = Array.isArray(id) ? id[0] : String(id);
    if (!chatId.startsWith('group_')) {
      const autoReplies = ['👍', 'Sure!', 'Got it!', 'OK!', 'Sounds good!', '🔥', 'Thanks!', 'Let me know', '👏', 'On it!'];
      const replyText = autoReplies[Math.floor(Math.random() * autoReplies.length)];
      const replyKey = MESSAGES_KEY;
      const replyDelay = 1200 + Math.random() * 1800;
      setTimeout(() => {
        const reply: ChatMessage = {
          id: `reply_${Date.now()}`,
          text: replyText,
          isSent: false,
          createdAt: new Date().toISOString(),
        };
        setMessages(prev => {
          const updated = [...prev, reply];
          AsyncStorage.setItem(replyKey, JSON.stringify(updated)).catch(() => {});
          return updated;
        });
        // Fire a local push notification for the incoming message
        if (user) {
          void notificationService.addNotification(
            user.id,
            {
              type: 'message',
              userId: chatId,
              username: chatUser?.username || 'Someone',
              userPhoto: chatUser?.profilePhoto || '',
              content: replyText,
              chatId,
              isRead: false,
            },
            `💬 ${chatUser?.username || 'New message'}`,
            replyText,
          );
        }
      }, replyDelay);
    }
  };

  const handleViewEphemeralPhoto = (messageId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const updatedMessages = messages.map(m =>
      m.id === messageId ? { ...m, isViewed: true } : m
    );
    setMessages(updatedMessages);
    saveMessages(updatedMessages);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
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
        <Pressable
          onPress={() => {
            if (chatUser?.id && !String(chatUser.id).startsWith('group_')) {
              router.push(`/profile/${chatUser.id}` as any);
            }
          }}
          style={styles.headerUser}
        >
          <Avatar uri={chatUser?.profilePhoto || ''} username={chatUser?.username || '...'} size={40} />
          <Text style={[styles.username, { color: theme.text }]}>{chatUser?.username || '...'}</Text>
        </Pressable>
        <View style={styles.headerActions}>
          <Pressable onPress={() => router.push(`/audio-call/${id}` as any)} style={styles.headerAction}>
            <Phone size={22} color={theme.text} />
          </Pressable>
          <Pressable 
            onPress={() => {
              if (!user?.isPremium) {
                setShowPremiumModal(true);
              } else {
                router.push(`/video-call/${id}` as any);
              }
            }} 
            style={styles.headerAction}
          >
            <Video size={22} color={theme.text} />
          </Pressable>
          <Pressable 
            onPress={() => {
              if (!user?.isPremium) {
                setShowPremiumModal(true);
              } else {
                setShowNotes(!showNotes);
              }
            }} 
            style={styles.headerAction}
          >
            <StickyNote size={22} color={showNotes ? COLORS.skyBlue : theme.text} />
          </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        {showNotes ? (
          <ScrollView style={styles.notesContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.notesHeader}>
              <View>
                <Text style={[styles.notesTitle, { color: theme.text }]}>Private Notes & Tasks</Text>
                <Text style={[styles.notesSubtitle, { color: theme.textSecondary }]}>Only visible to you</Text>
              </View>
              <Pressable
                onPress={() => setShowCalendarView(!showCalendarView)}
                style={[styles.calendarToggle, { backgroundColor: showCalendarView ? COLORS.skyBlue : theme.card }]}
              >
                <Calendar size={20} color={showCalendarView ? COLORS.white : theme.text} />
              </Pressable>
            </View>

            <View style={[styles.addNoteSection, { backgroundColor: theme.inputBackground }]}>
              <TextInput
                style={[styles.noteInput, { color: theme.text }]}
                placeholder="Write a note..."
                placeholderTextColor={theme.textSecondary}
                value={newNote}
                onChangeText={setNewNote}
                multiline
              />
              <Pressable
                onPress={handleAddNote}
                disabled={!newNote.trim()}
                style={[styles.addNoteBtn, { backgroundColor: newNote.trim() ? COLORS.skyBlue : theme.border }]}
              >
                <Plus size={20} color={COLORS.white} />
              </Pressable>
            </View>

            {showCalendarView && (
              <View style={[styles.calendarContainer, { backgroundColor: theme.card }]}>
                <RNCalendar
                  onDayPress={(day) => {
                    setSelectedDate(day.dateString);
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                  }}
                  markedDates={{
                    ...tasks.reduce((acc, task) => {
                      acc[task.date] = { marked: true, dotColor: COLORS.skyBlue };
                      return acc;
                    }, {} as any),
                    ...(selectedDate ? { [selectedDate]: { selected: true, selectedColor: COLORS.skyBlue } } : {}),
                  }}
                  theme={{
                    backgroundColor: theme.card,
                    calendarBackground: theme.card,
                    textSectionTitleColor: theme.text,
                    selectedDayBackgroundColor: COLORS.skyBlue,
                    selectedDayTextColor: COLORS.white,
                    todayTextColor: COLORS.primary,
                    dayTextColor: theme.text,
                    textDisabledColor: theme.textSecondary,
                    monthTextColor: theme.text,
                    arrowColor: COLORS.skyBlue,
                  }}
                />
                {selectedDate && (
                  <View style={styles.selectedDateTasks}>
                    <Text style={[styles.selectedDateTitle, { color: theme.text }]}>
                      {`Tasks for ${selectedDate}`}
                    </Text>
                    {tasks.filter(t => t.date === selectedDate).map(task => (
                      <View key={task.id} style={[styles.taskCard, { backgroundColor: theme.inputBackground }]}>
                        <Pressable onPress={() => handleToggleTask(task.id)} style={styles.taskCheckbox}>
                          <View style={[styles.checkbox, { borderColor: theme.border, backgroundColor: task.completed ? COLORS.skyBlue : 'transparent' }]}>
                            {task.completed && <Check size={14} color={COLORS.white} />}
                          </View>
                        </Pressable>
                        <View style={styles.taskContent}>
                          <Text style={[styles.taskText, { color: theme.text, textDecorationLine: task.completed ? 'line-through' : 'none' }]}>
                            {task.text}
                          </Text>
                          <Text style={[styles.taskDateTime, { color: theme.textSecondary }]}>
                            {task.time}
                          </Text>
                        </View>
                        <Pressable onPress={() => handleDeleteTask(task.id)}>
                          <X size={18} color={theme.textSecondary} />
                        </Pressable>
                      </View>
                    ))}
                    {tasks.filter(t => t.date === selectedDate).length === 0 && (
                      <Text style={[styles.emptyTasksText, { color: theme.textSecondary }]}>No tasks for this date</Text>
                    )}
                  </View>
                )}
              </View>
            )}

            <View style={styles.notesList}>
              {notes.map(note => (
                <View key={note.id} style={[styles.noteCard, { backgroundColor: theme.card }]}>
                  <Text style={[styles.noteText, { color: theme.text }]}>{note.text}</Text>
                  <View style={styles.noteFooter}>
                    <Text style={[styles.noteDate, { color: theme.textSecondary }]}>
                      {new Date(note.createdAt).toLocaleDateString()}
                    </Text>
                    <Pressable onPress={() => handleDeleteNote(note.id)}>
                      <X size={16} color={theme.textSecondary} />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.tasksSection}>
              <View style={styles.tasksSectionHeader}>
                <Text style={[styles.tasksTitle, { color: theme.text }]}>Scheduled Tasks</Text>
                <Pressable
                  onPress={() => setShowAddTask(true)}
                  style={[styles.addTaskBtn, { backgroundColor: COLORS.skyBlue }]}
                >
                  <Plus size={16} color={COLORS.white} />
                  <Text style={styles.addTaskBtnText}>Add Task</Text>
                </Pressable>
              </View>

              <View style={styles.tasksList}>
                {tasks.map(task => (
                  <View key={task.id} style={[styles.taskCard, { backgroundColor: theme.card }]}>
                    <Pressable onPress={() => handleToggleTask(task.id)} style={styles.taskCheckbox}>
                      <View style={[styles.checkbox, { borderColor: theme.border, backgroundColor: task.completed ? COLORS.skyBlue : 'transparent' }]}>
                        {task.completed && <Check size={14} color={COLORS.white} />}
                      </View>
                    </Pressable>
                    <View style={styles.taskContent}>
                      <Text style={[styles.taskText, { color: theme.text, textDecorationLine: task.completed ? 'line-through' : 'none' }]}>
                        {task.text}
                      </Text>
                      <Text style={[styles.taskDateTime, { color: theme.textSecondary }]}>
                        {`${task.date} at ${task.time}`}
                      </Text>
                    </View>
                    <Pressable onPress={() => handleDeleteTask(task.id)}>
                      <X size={18} color={theme.textSecondary} />
                    </Pressable>
                  </View>
                ))}
                {tasks.length === 0 && (
                  <Text style={[styles.emptyTasksText, { color: theme.textSecondary }]}>No tasks scheduled</Text>
                )}
              </View>
            </View>
          </ScrollView>
        ) : (
          <View style={styles.messagesContainer}>
            {messages.length === 0 ? (
              <View style={styles.emptyMessagesView}>
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                  {`Start a conversation with ${chatUser?.username || '...'}`}
                </Text>
              </View>
            ) : (
              <RNFlatList
                ref={flatListRef}
                data={messages.filter(m => !m.postData || !deletedPostIds.includes(m.postData.id))}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.messagesList}
                renderItem={({ item }) => (
                  <View style={[styles.messageBubble, item.isSent ? styles.sentMessage : styles.receivedMessage]}>
                    {item.postData ? (
                      <Pressable
                        onPress={() => router.push(`/post/${item.postData!.id}` as any)}
                        style={styles.postMessageContainer}
                      >
                        <Image source={{ uri: item.postData.thumbnailUrl }} style={styles.postThumbnail} contentFit="cover" />
                        <View style={styles.postPlayIcon}>
                          <Play size={24} color={COLORS.white} fill={COLORS.white} />
                        </View>
                        <View style={styles.postMessageInfo}>
                          <View style={styles.postMessageHeader}>
                            <Avatar uri={item.postData.userPhoto} username={item.postData.username} size={24} />
                            <Text style={[styles.postMessageUsername, { color: item.isSent ? COLORS.white : theme.text }]} numberOfLines={1}>
                              {item.postData.username}
                            </Text>
                          </View>
                          {item.postData.caption && (
                            <Text style={[styles.postMessageCaption, { color: item.isSent ? COLORS.white : theme.text }]} numberOfLines={2}>
                              {item.postData.caption}
                            </Text>
                          )}
                        </View>
                      </Pressable>
                    ) : item.mediaUrl ? (
                      <View style={styles.mediaContainer}>
                        {item.mediaType === 'ephemeral' && !item.isViewed ? (
                          <Pressable
                            onPress={() => handleViewEphemeralPhoto(item.id)}
                            style={[styles.ephemeralPlaceholder, { backgroundColor: theme.card }]}
                          >
                            <Clock size={32} color={theme.textSecondary} />
                            <Text style={[styles.ephemeralText, { color: theme.textSecondary }]}>Tap to view once</Text>
                          </Pressable>
                        ) : item.mediaType === 'ephemeral' && item.isViewed ? (
                          <View style={[styles.ephemeralViewed, { backgroundColor: theme.card }]}>
                            <Text style={[styles.ephemeralViewedText, { color: theme.textSecondary }]}>Photo viewed</Text>
                          </View>
                        ) : (
                          <Image source={{ uri: item.mediaUrl }} style={styles.messageImage} contentFit="cover" />
                        )}
                        {item.mediaType === 'ephemeral' && (
                          <View style={styles.mediaTypeBadge}>
                            <Clock size={12} color={COLORS.white} />
                          </View>
                        )}
                        {item.mediaType === 'permanent' && (
                          <View style={[styles.mediaTypeBadge, { backgroundColor: COLORS.skyBlue }]}>
                            <Infinity size={12} color={COLORS.white} />
                          </View>
                        )}
                      </View>
                    ) : (
                      <Text style={[styles.messageText, { color: item.isSent ? COLORS.white : theme.text }]}>
                        {item.text}
                      </Text>
                    )}
                  </View>
                )}
              />
            )}
          </View>
        )}

        <View style={[styles.inputContainer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
          <Pressable onPress={handlePickImage} style={[styles.photoButton, { backgroundColor: theme.inputBackground }]}>
            <ImageIcon size={20} color={theme.text} />
          </Pressable>
          <TextInput
            style={[styles.input, { color: theme.text, backgroundColor: theme.inputBackground }]}
            placeholder="Type a message..."
            placeholderTextColor={theme.textSecondary}
            value={message}
            onChangeText={setMessage}
            multiline
          />
          <Pressable
            onPress={handleSendMessage}
            disabled={!message.trim()}
            style={[styles.sendButton, { backgroundColor: message.trim() ? COLORS.primary : theme.border }]}
          >
            <Send size={20} color={COLORS.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={showAddTask}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddTask(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Add Task</Text>
              <Pressable onPress={() => setShowAddTask(false)}>
                <X size={24} color={theme.text} />
              </Pressable>
            </View>

            <View style={styles.modalForm}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>Task</Text>
                <TextInput
                  style={[styles.modalInput, { color: theme.text, backgroundColor: theme.inputBackground, borderColor: theme.border }]}
                  placeholder="Enter task description"
                  placeholderTextColor={theme.textSecondary}
                  value={newTaskText}
                  onChangeText={setNewTaskText}
                  multiline
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>Date</Text>
                <Pressable
                  onPress={() => setShowDatePicker(!showDatePicker)}
                  style={[styles.datePickerButton, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}
                >
                  <Calendar size={20} color={theme.textSecondary} />
                  <Text style={[styles.datePickerText, { color: newTaskDate ? theme.text : theme.textSecondary }]}>
                    {newTaskDate || 'Select date'}
                  </Text>
                  <ChevronRight size={20} color={theme.textSecondary} />
                </Pressable>
                {showDatePicker && (
                  <View style={[styles.inlineCalendar, { backgroundColor: theme.inputBackground }]}>
                    <RNCalendar
                      onDayPress={(day) => {
                        setNewTaskDate(day.dateString);
                        setShowDatePicker(false);
                        if (Platform.OS !== 'web') {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                      }}
                      markedDates={{
                        [newTaskDate]: { selected: true, selectedColor: COLORS.skyBlue },
                      }}
                      theme={{
                        backgroundColor: theme.inputBackground,
                        calendarBackground: theme.inputBackground,
                        textSectionTitleColor: theme.text,
                        selectedDayBackgroundColor: COLORS.skyBlue,
                        selectedDayTextColor: COLORS.white,
                        todayTextColor: COLORS.primary,
                        dayTextColor: theme.text,
                        textDisabledColor: theme.textSecondary,
                        monthTextColor: theme.text,
                        arrowColor: COLORS.skyBlue,
                      }}
                    />
                  </View>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>Time</Text>
                <Pressable
                  onPress={() => setShowTimePicker(!showTimePicker)}
                  style={[styles.datePickerButton, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}
                >
                  <Clock size={20} color={theme.textSecondary} />
                  <Text style={[styles.datePickerText, { color: newTaskTime ? theme.text : theme.textSecondary }]}>
                    {newTaskTime || 'Select time'}
                  </Text>
                  <ChevronRight size={20} color={theme.textSecondary} />
                </Pressable>
                {showTimePicker && (
                  <View style={[styles.timePickerContainer, { backgroundColor: theme.inputBackground }]}>
                    <View style={styles.timePickerRow}>
                      {['09:00', '10:00', '11:00', '12:00', '13:00', '14:00'].map(time => (
                        <Pressable
                          key={time}
                          onPress={() => {
                            setNewTaskTime(time);
                            setShowTimePicker(false);
                            if (Platform.OS !== 'web') {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }
                          }}
                          style={[styles.timeOption, { backgroundColor: theme.card }]}
                        >
                          <Text style={[styles.timeOptionText, { color: theme.text }]}>{time}</Text>
                        </Pressable>
                      ))}
                    </View>
                    <View style={styles.timePickerRow}>
                      {['15:00', '16:00', '17:00', '18:00', '19:00', '20:00'].map(time => (
                        <Pressable
                          key={time}
                          onPress={() => {
                            setNewTaskTime(time);
                            setShowTimePicker(false);
                            if (Platform.OS !== 'web') {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }
                          }}
                          style={[styles.timeOption, { backgroundColor: theme.card }]}
                        >
                          <Text style={[styles.timeOptionText, { color: theme.text }]}>{time}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                )}
              </View>

              <Pressable
                onPress={handleAddTask}
                style={[styles.modalSubmitBtn, { backgroundColor: COLORS.skyBlue }]}
              >
                <Text style={styles.modalSubmitText}>Add Task</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showPhotoOptions}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowPhotoOptions(false);
          setSelectedPhoto(null);
        }}
      >
        <View style={styles.photoModalOverlay}>
          <View style={[styles.photoModalContent, { backgroundColor: theme.card }]}>
            {selectedPhoto && (
              <Image source={{ uri: selectedPhoto }} style={styles.photoPreview} contentFit="cover" />
            )}
            
            <View style={styles.photoTypeSelector}>
              <Text style={[styles.photoTypeTitle, { color: theme.text }]}>Send as:</Text>
              <View style={styles.photoTypeOptions}>
                <Pressable
                  onPress={() => setPhotoType('permanent')}
                  style={[
                    styles.photoTypeOption,
                    { backgroundColor: photoType === 'permanent' ? COLORS.skyBlue : theme.inputBackground },
                  ]}
                >
                  <Infinity size={24} color={photoType === 'permanent' ? COLORS.white : theme.text} />
                  <Text style={[styles.photoTypeLabel, { color: photoType === 'permanent' ? COLORS.white : theme.text }]}>
                    Permanent
                  </Text>
                  <Text style={[styles.photoTypeDesc, { color: photoType === 'permanent' ? COLORS.white : theme.textSecondary }]}>
                    Can be viewed anytime
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setPhotoType('ephemeral')}
                  style={[
                    styles.photoTypeOption,
                    { backgroundColor: photoType === 'ephemeral' ? COLORS.skyBlue : theme.inputBackground },
                  ]}
                >
                  <Clock size={24} color={photoType === 'ephemeral' ? COLORS.white : theme.text} />
                  <Text style={[styles.photoTypeLabel, { color: photoType === 'ephemeral' ? COLORS.white : theme.text }]}>
                    View Once
                  </Text>
                  <Text style={[styles.photoTypeDesc, { color: photoType === 'ephemeral' ? COLORS.white : theme.textSecondary }]}>
                    Disappears after viewing
                  </Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.photoModalActions}>
              <Pressable
                onPress={() => {
                  setShowPhotoOptions(false);
                  setSelectedPhoto(null);
                }}
                style={[styles.photoModalBtn, { backgroundColor: theme.inputBackground }]}
              >
                <Text style={[styles.photoModalBtnText, { color: theme.text }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSendPhoto}
                style={[styles.photoModalBtn, styles.photoModalBtnPrimary, { backgroundColor: COLORS.skyBlue }]}
              >
                <Send size={18} color={COLORS.white} />
                <Text style={styles.photoModalBtnTextPrimary}>Send</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showPremiumModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPremiumModal(false)}
      >
        <View style={styles.premiumModalOverlay}>
          <View style={[styles.premiumModalContent, { backgroundColor: theme.card }]}>
            <View style={styles.premiumIconContainer}>
              <Video size={48} color={COLORS.skyBlue} />
            </View>
            <Text style={[styles.premiumModalTitle, { color: theme.text }]}>Premium Feature</Text>
            <Text style={[styles.premiumModalDescription, { color: theme.textSecondary }]}>
              Video calls and private notes are exclusive features for premium members. Upgrade now to unlock these features and more!
            </Text>
            <View style={styles.premiumModalActions}>
              <Pressable
                onPress={() => setShowPremiumModal(false)}
                style={[styles.premiumModalBtn, { backgroundColor: theme.inputBackground }]}
              >
                <Text style={[styles.premiumModalBtnText, { color: theme.text }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setShowPremiumModal(false);
                  router.push('/premium');
                }}
                style={[styles.premiumModalBtn, styles.premiumModalBtnPrimary, { backgroundColor: COLORS.skyBlue }]}
              >
                <Text style={styles.premiumModalBtnTextPrimary}>Upgrade to Premium</Text>
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
  },
  headerUser: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  },
  emptyMessagesView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
  },
  messagesList: {
    padding: 16,
    gap: 12,
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: 16,
    padding: 12,
    marginVertical: 4,
  },
  sentMessage: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.skyBlue,
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#E5E5EA',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  mediaContainer: {
    position: 'relative',
  },
  messageImage: {
    width: 220,
    height: undefined,
    minHeight: 100,
    maxHeight: 350,
    aspectRatio: undefined,
    borderRadius: 12,
  },
  mediaTypeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 6,
  },
  ephemeralPlaceholder: {
    width: 200,
    height: 250,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  ephemeralText: {
    fontSize: 14,
    fontWeight: '500',
  },
  ephemeralViewed: {
    width: 200,
    height: 100,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ephemeralViewedText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  postMessageContainer: {
    width: 240,
    borderRadius: 12,
    overflow: 'hidden',
  },
  postThumbnail: {
    width: '100%',
    height: 160,
  },
  postPlayIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    padding: 8,
  },
  postMessageInfo: {
    padding: 10,
    gap: 6,
  },
  postMessageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  postMessageAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  postMessageUsername: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  postMessageCaption: {
    fontSize: 13,
    lineHeight: 18,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    gap: 8,
    alignItems: 'flex-end',
  },
  photoButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
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
  notesContainer: {
    flex: 1,
    padding: 16,
  },
  notesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  calendarToggle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarContainer: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  selectedDateTasks: {
    marginTop: 16,
    gap: 12,
  },
  selectedDateTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  datePickerText: {
    flex: 1,
    fontSize: 15,
  },
  inlineCalendar: {
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  timePickerContainer: {
    marginTop: 12,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  timePickerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  timeOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  timeOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  notesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  notesSubtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  addNoteSection: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    gap: 12,
    marginBottom: 20,
  },
  noteInput: {
    flex: 1,
    fontSize: 15,
    maxHeight: 100,
  },
  addNoteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notesList: {
    gap: 12,
  },
  noteCard: {
    padding: 16,
    borderRadius: 12,
  },
  noteText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noteDate: {
    fontSize: 12,
  },
  tasksSection: {
    marginTop: 32,
  },
  tasksSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tasksTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  addTaskBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  addTaskBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  tasksList: {
    gap: 12,
  },
  taskCard: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    gap: 12,
  },
  taskCheckbox: {
    padding: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskContent: {
    flex: 1,
  },
  taskText: {
    fontSize: 15,
    marginBottom: 4,
  },
  taskDateTime: {
    fontSize: 12,
  },
  emptyTasksText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
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
    maxHeight: '80%',
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
    gap: 16,
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
  modalSubmitBtn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  modalSubmitText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  photoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  photoModalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 20,
    gap: 20,
  },
  photoPreview: {
    width: '100%',
    height: 300,
    borderRadius: 12,
  },
  photoTypeSelector: {
    gap: 12,
  },
  photoTypeTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  photoTypeOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  photoTypeOption: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  photoTypeLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 4,
  },
  photoTypeDesc: {
    fontSize: 12,
    textAlign: 'center',
  },
  photoModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  photoModalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  photoModalBtnPrimary: {
    flexDirection: 'row',
    gap: 8,
  },
  photoModalBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
  photoModalBtnTextPrimary: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  premiumModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  premiumModalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    gap: 16,
  },
  premiumIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(96, 165, 250, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  premiumModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  premiumModalDescription: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 8,
  },
  premiumModalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 8,
  },
  premiumModalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  premiumModalBtnPrimary: {
    flexDirection: 'row',
  },
  premiumModalBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
  premiumModalBtnTextPrimary: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
