import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, Alert, Platform, ScrollView, TextInput, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Image as ImageIcon, X, Video as VideoIcon, Check, Play, Pause } from 'lucide-react-native';
import { Image } from 'expo-image';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { useTheme } from '@/src/hooks/useTheme';
import { useAuth } from '@/src/hooks/useAuth';
import { COLORS } from '@/src/utils/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AspectRatio = '3:4' | '4:5' | 'original';

const POSTS_STORAGE_KEY = '@athlead_user_posts';

export default function CreateScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('4:5');
  const [caption, setCaption] = useState('');
  const [showAspectModal, setShowAspectModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<Video>(null);

  const getAspectRatioValue = (ratio: AspectRatio): number => {
    switch (ratio) {
      case '3:4': return 3 / 4;
      case '4:5': return 4 / 5;
      default: return 1;
    }
  };

  const savePost = async () => {
    if (!selectedMedia || !user) {
      Alert.alert('Error', 'Please select media first');
      return;
    }

    setIsUploading(true);
    try {
      const existingPosts = await AsyncStorage.getItem(POSTS_STORAGE_KEY);
      const posts = existingPosts ? JSON.parse(existingPosts) : {};
      
      if (!posts[user.id]) {
        posts[user.id] = [];
      }

      const newPost = {
        id: `post_${Date.now()}`,
        userId: user.id,
        username: user.username,
        userPhoto: user.profilePhoto,
        videoUrl: selectedMedia,
        thumbnailUrl: selectedMedia,
        caption: caption || 'New post',
        aspectRatio,
        mediaType,
        createdAt: new Date().toISOString(),
      };

      posts[user.id].unshift(newPost);
      await AsyncStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(posts));

      Alert.alert('Success', 'Post created successfully!');
      setSelectedMedia(null);
      setMediaType(null);
      setCaption('');
      setAspectRatio('4:5');
      router.back();
    } catch {
      Alert.alert('Error', 'Failed to save post');
    } finally {
      setIsUploading(false);
    }
  };

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant media library permissions');
        return false;
      }
    }
    return true;
  };

  const handlePickVideo = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedMedia(result.assets[0].uri);
      setMediaType(result.assets[0].type || 'image');
      setIsPlaying(false);
    }
  };

  const handleCamera = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not available', 'Camera is not available on web');
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera permissions');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedMedia(result.assets[0].uri);
      setMediaType(result.assets[0].type || 'image');
      setIsPlaying(false);
    }
  };

  const handlePlayPause = async () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
    setIsPlaying(!isPlaying);
  };

  const handleVideoStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setIsPlaying(status.isPlaying);
      if (status.didJustFinish) {
        setIsPlaying(false);
      }
    }
  };

  const aspectRatios: AspectRatio[] = ['3:4', '4:5', 'original'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <Pressable onPress={() => router.back()}>
          <X size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Create Post</Text>
        {selectedMedia ? (
          <Pressable onPress={savePost} disabled={isUploading}>
            <Text style={[styles.postButton, { color: isUploading ? theme.textSecondary : COLORS.skyBlue }]}>
              {isUploading ? 'Posting...' : 'Post'}
            </Text>
          </Pressable>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {!selectedMedia ? (
          <>
            <View style={[styles.uploadArea, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <VideoIcon size={48} color={theme.textSecondary} />
              <Text style={[styles.uploadTitle, { color: theme.text }]}>Upload Your Play</Text>
              <Text style={[styles.uploadSubtitle, { color: theme.textSecondary }]}>
                Share your best football moments
              </Text>

              <View style={styles.buttonContainer}>
                <Pressable
                  onPress={handleCamera}
                  style={[styles.uploadButton, { backgroundColor: COLORS.primary }]}
                >
                  <Camera size={24} color={COLORS.white} />
                  <Text style={styles.buttonText}>Record</Text>
                </Pressable>

                <Pressable
                  onPress={handlePickVideo}
                  style={[styles.uploadButton, { backgroundColor: COLORS.skyBlue }]}
                >
                  <ImageIcon size={24} color={COLORS.white} />
                  <Text style={styles.buttonText}>Gallery</Text>
                </Pressable>
              </View>
            </View>

            <View style={[styles.tipsSection, { backgroundColor: theme.card }]}>
              <Text style={[styles.tipsTitle, { color: theme.text }]}>Tips for Great Content</Text>
              <Text style={[styles.tip, { color: theme.textSecondary }]}>• Film in good lighting</Text>
              <Text style={[styles.tip, { color: theme.textSecondary }]}>• Keep videos under 60s</Text>
              <Text style={[styles.tip, { color: theme.textSecondary }]}>• Add relevant hashtags</Text>
              <Text style={[styles.tip, { color: theme.textSecondary }]}>• Tag your club</Text>
            </View>
          </>
        ) : (
          <>
            <View style={[styles.previewSection, { backgroundColor: theme.card }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Preview</Text>
              <View style={styles.previewContainer}>
                {mediaType === 'video' ? (
                  <>
                    <Video
                      ref={videoRef}
                      source={{ uri: selectedMedia }}
                      style={[
                        styles.preview,
                        aspectRatio !== 'original' && {
                          aspectRatio: getAspectRatioValue(aspectRatio),
                        },
                      ]}
                      resizeMode={ResizeMode.COVER}
                      isLooping={false}
                      onPlaybackStatusUpdate={handleVideoStatusUpdate}
                      useNativeControls={false}
                    />
                    <Pressable
                      onPress={handlePlayPause}
                      style={styles.videoControlsOverlay}
                    >
                      <View style={styles.playPauseButton}>
                        {isPlaying ? (
                          <Pause size={40} color={COLORS.white} />
                        ) : (
                          <Play size={40} color={COLORS.white} />
                        )}
                      </View>
                    </Pressable>
                  </>
                ) : (
                  <Image
                    source={{ uri: selectedMedia }}
                    style={[
                      styles.preview,
                      aspectRatio !== 'original' && {
                        aspectRatio: getAspectRatioValue(aspectRatio),
                      },
                    ]}
                    contentFit="cover"
                  />
                )}
              </View>
              <Pressable
                onPress={() => {
                  setSelectedMedia(null);
                  setMediaType(null);
                }}
                style={[styles.changeButton, { backgroundColor: theme.inputBackground }]}
              >
                <Text style={[styles.changeButtonText, { color: theme.text }]}>Change Media</Text>
              </Pressable>
            </View>

            <View style={[styles.aspectSection, { backgroundColor: theme.card }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Aspect Ratio</Text>
              <Pressable
                onPress={() => setShowAspectModal(true)}
                style={[styles.aspectButton, { backgroundColor: theme.inputBackground }]}
              >
                <Text style={[styles.aspectButtonText, { color: theme.text }]}>{aspectRatio}</Text>
              </Pressable>
            </View>

            <View style={[styles.captionSection, { backgroundColor: theme.card }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Caption</Text>
              <TextInput
                style={[styles.captionInput, { color: theme.text, backgroundColor: theme.inputBackground }]}
                placeholder="Write a caption..."
                placeholderTextColor={theme.textSecondary}
                value={caption}
                onChangeText={setCaption}
                multiline
                numberOfLines={4}
              />
            </View>
          </>
        )}
      </ScrollView>

      <Modal visible={showAspectModal} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowAspectModal(false)}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Select Aspect Ratio</Text>
            {aspectRatios.map((ratio) => (
              <Pressable
                key={ratio}
                onPress={() => {
                  setAspectRatio(ratio);
                  setShowAspectModal(false);
                }}
                style={[
                  styles.aspectOption,
                  { backgroundColor: aspectRatio === ratio ? COLORS.skyBlue : theme.card }
                ]}
              >
                <Text style={[styles.aspectOptionText, { color: aspectRatio === ratio ? COLORS.white : theme.text }]}>
                  {ratio === 'original' ? 'Original' : ratio}
                </Text>
                {aspectRatio === ratio && <Check size={20} color={COLORS.white} />}
              </Pressable>
            ))}
          </View>
        </Pressable>
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  postButton: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  uploadArea: {
    padding: 32,
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  uploadTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  uploadSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
    marginTop: 16,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  tipsSection: {
    padding: 20,
    borderRadius: 16,
    gap: 8,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tip: {
    fontSize: 14,
    lineHeight: 20,
  },
  previewSection: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  previewContainer: {
    position: 'relative',
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  preview: {
    width: '100%',
    minHeight: 300,
  },
  videoControlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playPauseButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 40,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  changeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  aspectSection: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  aspectButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  aspectButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  captionSection: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  captionInput: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '50%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  aspectOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  aspectOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
