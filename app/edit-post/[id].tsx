import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, SafeAreaView, Alert, TextInput, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Check } from 'lucide-react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/src/hooks/useTheme';
import { useAuth } from '@/src/hooks/useAuth';
import { COLORS } from '@/src/utils/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const POSTS_STORAGE_KEY = '@athlead_user_posts';

export default function EditPostScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const loadPost = useCallback(async () => {
    if (!user || !id) return;
    try {
      const postsData = await AsyncStorage.getItem(POSTS_STORAGE_KEY);
      if (postsData) {
        const allPosts = JSON.parse(postsData);
        const userPosts = allPosts[user.id] || [];
        const post = userPosts.find((p: any) => p.id === id);
        if (post) {
          setCaption(post.caption);
          setHashtags(post.hashtags.join(' '));
          setThumbnailUrl(post.thumbnailUrl);
        }
      }
    } catch (error) {
      console.log('Error loading post:', error);
    }
  }, [user, id]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  const handleSave = async () => {
    if (!user || !id) return;
    
    if (!caption.trim()) {
      Alert.alert('Error', 'Please enter a caption');
      return;
    }

    setIsLoading(true);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      const postsData = await AsyncStorage.getItem(POSTS_STORAGE_KEY);
      if (postsData) {
        const allPosts = JSON.parse(postsData);
        const userPosts = allPosts[user.id] || [];
        const postIndex = userPosts.findIndex((p: any) => p.id === id);
        
        if (postIndex !== -1) {
          const hashtagsArray = hashtags
            .split(' ')
            .filter(tag => tag.trim().startsWith('#'))
            .map(tag => tag.trim());

          userPosts[postIndex] = {
            ...userPosts[postIndex],
            caption: caption.trim(),
            hashtags: hashtagsArray,
          };

          allPosts[user.id] = userPosts;
          await AsyncStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(allPosts));
          
          if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          Alert.alert('Success', 'Post updated successfully', [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]);
        }
      }
    } catch (error) {
      console.log('Error saving post:', error);
      Alert.alert('Error', 'Failed to update post');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Edit Post</Text>
        <Pressable 
          onPress={handleSave} 
          style={styles.saveButton}
          disabled={isLoading}
        >
          <Check size={24} color={COLORS.primary} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {thumbnailUrl ? (
            <Image
              source={{ uri: thumbnailUrl }}
              style={styles.thumbnail}
              contentFit="cover"
            />
          ) : null}

          <View style={styles.formSection}>
            <Text style={[styles.label, { color: theme.text }]}>Caption</Text>
            <TextInput
              style={[
                styles.textInput,
                { 
                  backgroundColor: theme.card,
                  color: theme.text,
                  borderColor: theme.border,
                }
              ]}
              value={caption}
              onChangeText={setCaption}
              placeholder="Write a caption..."
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.formSection}>
            <Text style={[styles.label, { color: theme.text }]}>Hashtags</Text>
            <TextInput
              style={[
                styles.textInput,
                { 
                  backgroundColor: theme.card,
                  color: theme.text,
                  borderColor: theme.border,
                }
              ]}
              value={hashtags}
              onChangeText={setHashtags}
              placeholder="#football #training #goals"
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
            />
            <Text style={[styles.hint, { color: theme.textSecondary }]}>
              Separate hashtags with spaces (e.g., #football #training)
            </Text>
          </View>

          <Pressable
            onPress={handleSave}
            style={[
              styles.saveButtonLarge,
              { backgroundColor: COLORS.primary },
              isLoading && { opacity: 0.6 }
            ]}
            disabled={isLoading}
          >
            <Text style={styles.saveButtonText}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
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
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  thumbnail: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    marginBottom: 24,
  },
  formSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    minHeight: 100,
  },
  hint: {
    fontSize: 13,
    marginTop: 6,
  },
  saveButtonLarge: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
