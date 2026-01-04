import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, Modal, Alert } from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Send, Phone, Video, StickyNote, Plus, X, Check } from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { MOCK_USERS } from '@/src/services/mockData';
import { COLORS } from '@/src/utils/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

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

export default function ChatScreen() {
  const { theme } = useTheme();
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

  const chatUser = MOCK_USERS.find(u => u.id === id) || MOCK_USERS[0];
  const NOTES_KEY = `@chat_notes_${id}`;
  const TASKS_KEY = `@chat_tasks_${id}`;

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

    loadNotes();
    loadTasks();
  }, [id, NOTES_KEY, TASKS_KEY]);

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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.push('/(tabs)')} style={styles.backButton}>
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
          <Pressable onPress={() => setShowNotes(!showNotes)} style={styles.headerAction}>
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
              <Text style={[styles.notesTitle, { color: theme.text }]}>Private Notes</Text>
              <Text style={[styles.notesSubtitle, { color: theme.textSecondary }]}>Only visible to you</Text>
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
                        {task.date} at {task.time}
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
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              Start a conversation with {chatUser.username}
            </Text>
          </View>
        )}

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
                <TextInput
                  style={[styles.modalInput, { color: theme.text, backgroundColor: theme.inputBackground, borderColor: theme.border }]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={theme.textSecondary}
                  value={newTaskDate}
                  onChangeText={setNewTaskDate}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>Time</Text>
                <TextInput
                  style={[styles.modalInput, { color: theme.text, backgroundColor: theme.inputBackground, borderColor: theme.border }]}
                  placeholder="HH:MM"
                  placeholderTextColor={theme.textSecondary}
                  value={newTaskTime}
                  onChangeText={setNewTaskTime}
                />
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
  notesContainer: {
    flex: 1,
    padding: 16,
  },
  notesHeader: {
    marginBottom: 16,
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
});
