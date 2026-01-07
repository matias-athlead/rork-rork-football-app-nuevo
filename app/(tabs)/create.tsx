import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, Alert, Platform, ScrollView, TextInput, Modal, FlatList, KeyboardAvoidingView } from 'react-native';
import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Image as ImageIcon, X, Video as VideoIcon, Check, Play, Pause, MapPin, Music, Users, Volume2, VolumeX, Film, Scissors } from 'lucide-react-native';
import { Image } from 'expo-image';
import { Video, ResizeMode, AVPlaybackStatus, Audio } from 'expo-av';
import { useTheme } from '@/src/hooks/useTheme';
import { useAuth } from '@/src/hooks/useAuth';
import { COLORS } from '@/src/utils/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MOCK_USERS } from '@/src/services/mockData';
import { MUSIC_LIBRARY, MusicTrack } from '@/src/services/musicLibrary';
import * as VideoThumbnails from 'expo-video-thumbnails';

type AspectRatio = '4:3' | '4:5' | '16:9' | 'original';

const POSTS_STORAGE_KEY = '@athlead_user_posts';

export default function CreateScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('4:5');
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<Video>(null);
  const [showMentionModal, setShowMentionModal] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionedUsers, setMentionedUsers] = useState<string[]>([]);
  const captionInputRef = useRef<TextInput>(null);
  const [location, setLocation] = useState('');
  const [musicSound, setMusicSound] = useState('');
  const [selectedMusic, setSelectedMusic] = useState<MusicTrack | null>(null);
  const [clubTag, setClubTag] = useState('');
  const [showClubModal, setShowClubModal] = useState(false);
  const [clubSearch, setClubSearch] = useState('');
  const clubInputRef = useRef<TextInput>(null);
  const [showMusicModal, setShowMusicModal] = useState(false);
  const [musicSearch, setMusicSearch] = useState('');
  const [audioSound, setAudioSound] = useState<Audio.Sound | null>(null);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [showFramePickerModal, setShowFramePickerModal] = useState(false);
  const [framePickerTime, setFramePickerTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);

  const getAspectRatioValue = (ratio: AspectRatio): number => {
    switch (ratio) {
      case '4:3': return 4 / 3;
      case '4:5': return 4 / 5;
      case '16:9': return 16 / 9;
      default: return 1;
    }
  };

  const handleCaptionChange = (text: string) => {
    setCaption(text);
    
    const lastAtIndex = text.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const textAfterAt = text.slice(lastAtIndex + 1);
      const hasSpace = textAfterAt.includes(' ');
      
      if (!hasSpace && textAfterAt.length >= 0) {
        setMentionSearch(textAfterAt);
        setShowMentionModal(true);
      } else {
        setShowMentionModal(false);
      }
    } else {
      setShowMentionModal(false);
    }
  };

  const handleSelectMention = (username: string) => {
    const lastAtIndex = caption.lastIndexOf('@');
    const newCaption = caption.slice(0, lastAtIndex) + `@${username} `;
    setCaption(newCaption);
    setShowMentionModal(false);
    if (!mentionedUsers.includes(username)) {
      setMentionedUsers([...mentionedUsers, username]);
    }
    captionInputRef.current?.focus();
  };

  const filteredUsers = MOCK_USERS.filter(u => 
    u.username.toLowerCase().includes(mentionSearch.toLowerCase())
  ).slice(0, 10);

  const clubUsers = MOCK_USERS.filter(u => u.role === 'club');
  const filteredClubs = clubUsers.filter(club => 
    club.username.toLowerCase().includes(clubSearch.toLowerCase()) ||
    club.fullName.toLowerCase().includes(clubSearch.toLowerCase())
  ).slice(0, 10);

  const savePost = async () => {
    if (!selectedMedia || !user) {
      Alert.alert('Error', 'Please select media first');
      return;
    }

    if (audioSound) {
      await audioSound.stopAsync();
      await audioSound.unloadAsync();
      setAudioSound(null);
      setIsPlayingMusic(false);
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
        thumbnailUrl: coverImage || selectedMedia,
        coverImageUrl: coverImage || undefined,
        caption: caption || 'New post',
        aspectRatio,
        mediaType,
        taggedUsers: mentionedUsers,
        location: location || undefined,
        musicSound: selectedMusic?.title || musicSound || undefined,
        musicUrl: selectedMusic?.url || undefined,
        musicTitle: selectedMusic?.title || undefined,
        musicArtist: selectedMusic?.artist || undefined,
        clubTag: clubTag || undefined,
        createdAt: new Date().toISOString(),
      };

      posts[user.id].unshift(newPost);
      await AsyncStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(posts));

      Alert.alert('Success', 'Post created successfully!');
      setSelectedMedia(null);
      setMediaType(null);
      setCaption('');
      setAspectRatio('4:5');
      setMentionedUsers([]);
      setLocation('');
      setMusicSound('');
      setSelectedMusic(null);
      setClubTag('');
      setCoverImage(null);
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
      const uri = result.assets[0].uri;
      const type = result.assets[0].type || 'image';
      setSelectedMedia(uri);
      setMediaType(type);
      setIsPlaying(false);
      
      if (type === 'video') {
        await autoExtractFirstFrame(uri);
      }
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
      const uri = result.assets[0].uri;
      const type = result.assets[0].type || 'image';
      setSelectedMedia(uri);
      setMediaType(type);
      setIsPlaying(false);
      
      if (type === 'video') {
        await autoExtractFirstFrame(uri);
      }
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
      if (status.durationMillis) {
        setVideoDuration(status.durationMillis);
      }
      if (status.didJustFinish) {
        setIsPlaying(false);
      }
    }
  };

  const handleSelectCover = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setCoverImage(result.assets[0].uri);
    }
  };

  const extractVideoFrame = async (timeMs?: number) => {
    if (!selectedMedia || mediaType !== 'video') {
      Alert.alert('Error', 'Please select a video first');
      return;
    }

    try {
      const { uri } = await VideoThumbnails.getThumbnailAsync(selectedMedia, {
        time: timeMs !== undefined ? timeMs : 0,
        quality: 1,
      });
      setCoverImage(uri);
      if (timeMs === undefined) {
        Alert.alert('Success', 'Video frame extracted as cover!');
      }
    } catch (error) {
      console.log('Error extracting frame:', error);
      Alert.alert('Error', 'Failed to extract video frame');
    }
  };

  const openFramePicker = () => {
    setFramePickerTime(0);
    setShowFramePickerModal(true);
  };

  const handleFrameSelect = async () => {
    await extractVideoFrame(framePickerTime * 1000);
    setShowFramePickerModal(false);
    Alert.alert('Success', 'Frame selected as cover!');
  };

  const autoExtractFirstFrame = async (videoUri: string) => {
    try {
      const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
        time: 0,
        quality: 1,
      });
      setCoverImage(uri);
    } catch (error) {
      console.log('Error auto-extracting frame:', error);
    }
  };

  const handleSelectMusic = async (track: MusicTrack) => {
    if (audioSound) {
      await audioSound.stopAsync();
      await audioSound.unloadAsync();
    }

    setSelectedMusic(track);
    setMusicSound(track.title);
    setShowMusicModal(false);

    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: track.url },
        { shouldPlay: true, isLooping: true }
      );
      setAudioSound(sound);
      setIsPlayingMusic(true);
    } catch (error) {
      console.log('Error playing music:', error);
    }
  };

  const toggleMusicPlayback = async () => {
    if (!audioSound) return;

    if (isPlayingMusic) {
      await audioSound.pauseAsync();
      setIsPlayingMusic(false);
    } else {
      await audioSound.playAsync();
      setIsPlayingMusic(true);
    }
  };

  const removeMusicSelection = async () => {
    if (audioSound) {
      await audioSound.stopAsync();
      await audioSound.unloadAsync();
    }
    setSelectedMusic(null);
    setMusicSound('');
    setAudioSound(null);
    setIsPlayingMusic(false);
  };

  const filteredMusic = MUSIC_LIBRARY.filter(track => 
    track.title.toLowerCase().includes(musicSearch.toLowerCase()) ||
    track.artist.toLowerCase().includes(musicSearch.toLowerCase())
  );

  const aspectRatios: AspectRatio[] = ['4:3', '4:5', '16:9', 'original'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
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
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.aspectScrollView}>
                <View style={styles.aspectRatioRow}>
                  {aspectRatios.map((ratio) => (
                    <Pressable
                      key={ratio}
                      onPress={() => setAspectRatio(ratio)}
                      style={[
                        styles.aspectRatioButton,
                        { backgroundColor: aspectRatio === ratio ? COLORS.skyBlue : theme.inputBackground }
                      ]}
                    >
                      <Text style={[styles.aspectRatioText, { color: aspectRatio === ratio ? COLORS.white : theme.text }]}>
                        {ratio}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={[styles.captionSection, { backgroundColor: theme.card }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Caption</Text>
              <TextInput
                ref={captionInputRef}
                style={[styles.captionInput, { color: theme.text, backgroundColor: theme.inputBackground }]}
                placeholder="Write a caption... Use @ to mention users"
                placeholderTextColor={theme.textSecondary}
                value={caption}
                onChangeText={handleCaptionChange}
                multiline
                numberOfLines={4}
              />
              {mentionedUsers.length > 0 && (
                <View style={styles.mentionedUsersContainer}>
                  <Text style={[styles.mentionedLabel, { color: theme.textSecondary }]}>Mentioned:</Text>
                  <View style={styles.mentionedUsers}>
                    {mentionedUsers.map((username, index) => (
                      <View key={index} style={[styles.mentionChip, { backgroundColor: theme.inputBackground }]}>
                        <Text style={[styles.mentionChipText, { color: COLORS.skyBlue }]}>@{username}</Text>
                        <Pressable 
                          onPress={() => setMentionedUsers(mentionedUsers.filter(u => u !== username))}
                          style={styles.removeMention}
                        >
                          <X size={14} color={theme.textSecondary} />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>

            <View style={[styles.coverSection, { backgroundColor: theme.card }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Cover Image</Text>
              {coverImage ? (
                <View>
                  <Image source={{ uri: coverImage }} style={styles.coverPreview} contentFit="cover" />
                  <View style={styles.coverButtonsContainer}>
                    <Pressable
                      onPress={handleSelectCover}
                      style={[styles.coverActionButton, { backgroundColor: theme.inputBackground }]}
                    >
                      <ImageIcon size={18} color={theme.text} />
                      <Text style={[styles.coverActionText, { color: theme.text }]}>Image</Text>
                    </Pressable>
                    {mediaType === 'video' && (
                      <>
                        <Pressable
                          onPress={() => extractVideoFrame(0)}
                          style={[styles.coverActionButton, { backgroundColor: theme.inputBackground }]}
                        >
                          <Film size={18} color={theme.text} />
                          <Text style={[styles.coverActionText, { color: theme.text }]}>First Frame</Text>
                        </Pressable>
                        <Pressable
                          onPress={openFramePicker}
                          style={[styles.coverActionButton, { backgroundColor: theme.inputBackground }]}
                        >
                          <Scissors size={18} color={theme.text} />
                          <Text style={[styles.coverActionText, { color: theme.text }]}>Pick Frame</Text>
                        </Pressable>
                      </>
                    )}
                  </View>
                </View>
              ) : (
                <View style={styles.noCoverContainer}>
                  <Pressable
                    onPress={handleSelectCover}
                    style={[styles.selectCoverButton, { backgroundColor: theme.inputBackground }]}
                  >
                    <ImageIcon size={24} color={theme.textSecondary} />
                    <Text style={[styles.selectCoverText, { color: theme.textSecondary }]}>Select Cover Image</Text>
                  </Pressable>
                  {mediaType === 'video' && (
                    <>
                      <Pressable
                        onPress={() => extractVideoFrame(0)}
                        style={[styles.extractFrameButton, { backgroundColor: theme.inputBackground }]}
                      >
                        <Film size={24} color={theme.textSecondary} />
                        <Text style={[styles.selectCoverText, { color: theme.textSecondary }]}>Extract First Frame</Text>
                      </Pressable>
                      <Pressable
                        onPress={openFramePicker}
                        style={[styles.extractFrameButton, { backgroundColor: theme.inputBackground }]}
                      >
                        <Scissors size={24} color={theme.textSecondary} />
                        <Text style={[styles.selectCoverText, { color: theme.textSecondary }]}>Pick Frame Manually</Text>
                      </Pressable>
                    </>
                  )}
                </View>
              )}
              {mediaType === 'video' && !coverImage && (
                <Text style={[styles.coverHint, { color: theme.textSecondary }]}>First frame will be used by default</Text>
              )}
            </View>

            <View style={[styles.metadataSection, { backgroundColor: theme.card }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Additional Details</Text>
              
              <View style={styles.metadataItem}>
                <View style={styles.metadataHeader}>
                  <MapPin size={20} color={COLORS.skyBlue} />
                  <Text style={[styles.metadataLabel, { color: theme.text }]}>Location</Text>
                </View>
                <TextInput
                  style={[styles.metadataInput, { color: theme.text, backgroundColor: theme.inputBackground }]}
                  placeholder="Add location..."
                  placeholderTextColor={theme.textSecondary}
                  value={location}
                  onChangeText={setLocation}
                />
              </View>

              <View style={styles.metadataItem}>
                <View style={styles.metadataHeader}>
                  <Music size={20} color={COLORS.skyBlue} />
                  <Text style={[styles.metadataLabel, { color: theme.text }]}>Music/Sound</Text>
                </View>
                {selectedMusic ? (
                  <View style={[styles.selectedMusicContainer, { backgroundColor: theme.inputBackground }]}>
                    <View style={styles.selectedMusicInfo}>
                      <Text style={[styles.selectedMusicTitle, { color: theme.text }]} numberOfLines={1}>
                        {selectedMusic.title}
                      </Text>
                      <Text style={[styles.selectedMusicArtist, { color: theme.textSecondary }]} numberOfLines={1}>
                        {selectedMusic.artist}
                      </Text>
                    </View>
                    <View style={styles.musicControls}>
                      <Pressable onPress={toggleMusicPlayback} style={styles.musicControlButton}>
                        {isPlayingMusic ? (
                          <VolumeX size={20} color={COLORS.skyBlue} />
                        ) : (
                          <Volume2 size={20} color={COLORS.skyBlue} />
                        )}
                      </Pressable>
                      <Pressable onPress={removeMusicSelection} style={styles.musicControlButton}>
                        <X size={20} color={theme.textSecondary} />
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <Pressable
                    onPress={() => {
                      setMusicSearch('');
                      setShowMusicModal(true);
                    }}
                    style={[styles.selectMusicButton, { backgroundColor: theme.inputBackground }]}
                  >
                    <Text style={[styles.selectMusicText, { color: theme.textSecondary }]}>Select music...</Text>
                  </Pressable>
                )}
              </View>

              <View style={styles.metadataItem}>
                <View style={styles.metadataHeader}>
                  <Users size={20} color={COLORS.skyBlue} />
                  <Text style={[styles.metadataLabel, { color: theme.text }]}>Club Tag</Text>
                </View>
                <Pressable
                  onPress={() => {
                    setClubSearch('');
                    setShowClubModal(true);
                  }}
                  style={[styles.clubTagButton, { backgroundColor: theme.inputBackground }]}
                >
                  <Text style={[styles.clubTagText, { color: clubTag ? theme.text : theme.textSecondary }]}>
                    {clubTag ? `@${clubTag}` : 'Tag a club...'}
                  </Text>
                  {clubTag && (
                    <Pressable onPress={() => setClubTag('')} style={styles.clearClubTag}>
                      <X size={16} color={theme.textSecondary} />
                    </Pressable>
                  )}
                </Pressable>
                <Text style={[styles.clubHint, { color: theme.textSecondary }]}>Only clubs with accounts can be tagged</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <Modal visible={showFramePickerModal} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowFramePickerModal(false)}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]} onStartShouldSetResponder={() => true}>
            <View style={styles.framePickerHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Select Frame</Text>
              <Pressable onPress={() => setShowFramePickerModal(false)}>
                <X size={24} color={theme.text} />
              </Pressable>
            </View>
            
            {selectedMedia && (
              <View style={styles.framePreviewContainer}>
                <Video
                  source={{ uri: selectedMedia }}
                  style={styles.framePreviewVideo}
                  resizeMode={ResizeMode.CONTAIN}
                  positionMillis={framePickerTime * 1000}
                  shouldPlay={false}
                />
              </View>
            )}
            
            <View style={styles.sliderContainer}>
              <Text style={[styles.timeText, { color: theme.textSecondary }]}>
                {Math.floor(framePickerTime / 60)}:{(Math.floor(framePickerTime) % 60).toString().padStart(2, '0')}
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={Math.floor(videoDuration / 1000) || 60}
                value={framePickerTime}
                onValueChange={setFramePickerTime}
                minimumTrackTintColor={COLORS.skyBlue}
                maximumTrackTintColor={theme.border}
                thumbTintColor={COLORS.skyBlue}
              />
              <Text style={[styles.timeText, { color: theme.textSecondary }]}>
                {Math.floor((videoDuration / 1000) / 60)}:{(Math.floor(videoDuration / 1000) % 60).toString().padStart(2, '0')}
              </Text>
            </View>
            
            <Pressable
              onPress={handleFrameSelect}
              style={[styles.selectFrameButton, { backgroundColor: COLORS.skyBlue }]}
            >
              <Check size={20} color={COLORS.white} />
              <Text style={styles.selectFrameButtonText}>Select This Frame</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <Modal visible={showMentionModal} transparent animationType="fade">
        <Pressable style={styles.mentionModalOverlay} onPress={() => setShowMentionModal(false)}>
          <View style={[styles.mentionModalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.mentionModalTitle, { color: theme.text }]}>Mention Users</Text>
            <FlatList
              data={filteredUsers}
              keyExtractor={(item) => item.id}
              style={styles.mentionList}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handleSelectMention(item.username)}
                  style={[styles.mentionItem, { backgroundColor: theme.inputBackground }]}
                >
                  <Image source={{ uri: item.profilePhoto }} style={styles.mentionAvatar} />
                  <View style={styles.mentionInfo}>
                    <Text style={[styles.mentionUsername, { color: theme.text }]}>@{item.username}</Text>
                    <Text style={[styles.mentionFullName, { color: theme.textSecondary }]}>{item.fullName}</Text>
                  </View>
                </Pressable>
              )}
              ListEmptyComponent={
                <Text style={[styles.noResults, { color: theme.textSecondary }]}>No users found</Text>
              }
            />
          </View>
        </Pressable>
      </Modal>

      <Modal visible={showClubModal} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowClubModal(false)}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]} onStartShouldSetResponder={() => true}>
            <View style={styles.clubModalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Tag a Club</Text>
              <Pressable onPress={() => setShowClubModal(false)}>
                <X size={24} color={theme.text} />
              </Pressable>
            </View>
            <TextInput
              ref={clubInputRef}
              style={[styles.searchInput, { color: theme.text, backgroundColor: theme.inputBackground }]}
              placeholder="Search clubs..."
              placeholderTextColor={theme.textSecondary}
              value={clubSearch}
              onChangeText={setClubSearch}
              autoFocus
            />
            <FlatList
              data={filteredClubs}
              keyExtractor={(item) => item.id}
              style={styles.clubList}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    setClubTag(item.username);
                    setShowClubModal(false);
                  }}
                  style={[styles.clubItem, { backgroundColor: theme.inputBackground }]}
                >
                  <Image source={{ uri: item.profilePhoto }} style={styles.clubAvatar} />
                  <View style={styles.clubInfo}>
                    <Text style={[styles.clubUsername, { color: theme.text }]}>@{item.username}</Text>
                    <Text style={[styles.clubFullName, { color: theme.textSecondary }]}>{item.fullName}</Text>
                  </View>
                </Pressable>
              )}
              ListEmptyComponent={
                <Text style={[styles.noResults, { color: theme.textSecondary }]}>
                  {clubUsers.length === 0 ? 'No clubs available' : 'No clubs found'}
                </Text>
              }
            />
          </View>
        </Pressable>
      </Modal>

      <Modal visible={showMusicModal} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowMusicModal(false)}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]} onStartShouldSetResponder={() => true}>
            <View style={styles.clubModalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Select Music</Text>
              <Pressable onPress={() => setShowMusicModal(false)}>
                <X size={24} color={theme.text} />
              </Pressable>
            </View>
            <TextInput
              style={[styles.searchInput, { color: theme.text, backgroundColor: theme.inputBackground }]}
              placeholder="Search music..."
              placeholderTextColor={theme.textSecondary}
              value={musicSearch}
              onChangeText={setMusicSearch}
              autoFocus
            />
            <FlatList
              data={filteredMusic}
              keyExtractor={(item) => item.id}
              style={styles.musicList}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handleSelectMusic(item)}
                  style={[styles.musicItem, { backgroundColor: theme.inputBackground }]}
                >
                  <View style={[styles.musicIconContainer, { backgroundColor: COLORS.skyBlue }]}>
                    <Music size={20} color={COLORS.white} />
                  </View>
                  <View style={styles.musicItemInfo}>
                    <Text style={[styles.musicItemTitle, { color: theme.text }]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={[styles.musicItemArtist, { color: theme.textSecondary }]} numberOfLines={1}>
                      {item.artist} • {Math.floor(item.duration / 60)}:{(item.duration % 60).toString().padStart(2, '0')}
                    </Text>
                  </View>
                </Pressable>
              )}
              ListEmptyComponent={
                <Text style={[styles.noResults, { color: theme.textSecondary }]}>No music found</Text>
              }
            />
          </View>
        </Pressable>
      </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
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
  mentionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  mentionModalContent: {
    borderRadius: 20,
    padding: 16,
    maxHeight: '70%',
  },
  mentionModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  mentionList: {
    maxHeight: 300,
  },
  mentionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  mentionAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  mentionInfo: {
    marginLeft: 12,
    flex: 1,
  },
  mentionUsername: {
    fontSize: 15,
    fontWeight: '600',
  },
  mentionFullName: {
    fontSize: 13,
    marginTop: 2,
  },
  noResults: {
    fontSize: 14,
    textAlign: 'center',
    padding: 20,
  },
  mentionedUsersContainer: {
    marginTop: 12,
  },
  mentionedLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  mentionedUsers: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mentionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 6,
  },
  mentionChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  removeMention: {
    padding: 2,
  },
  metadataSection: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    gap: 16,
  },
  metadataItem: {
    gap: 8,
  },
  metadataHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metadataLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  metadataInput: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 15,
  },
  clubTagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  clubTagText: {
    fontSize: 15,
    flex: 1,
  },
  clearClubTag: {
    padding: 4,
  },
  clubHint: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  clubModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchInput: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 15,
    marginBottom: 12,
  },
  clubList: {
    maxHeight: 400,
  },
  clubItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  clubAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  clubInfo: {
    marginLeft: 12,
    flex: 1,
  },
  clubUsername: {
    fontSize: 15,
    fontWeight: '600',
  },
  clubFullName: {
    fontSize: 13,
    marginTop: 2,
  },
  coverSection: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  coverPreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  coverButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  coverActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  coverActionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  noCoverContainer: {
    gap: 8,
  },
  coverHint: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
  changeCoverButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  changeCoverText: {
    fontSize: 14,
    fontWeight: '600',
  },
  selectCoverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    borderRadius: 12,
    gap: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(128, 128, 128, 0.3)',
  },
  extractFrameButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    borderRadius: 12,
    gap: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(128, 128, 128, 0.3)',
  },
  selectCoverText: {
    fontSize: 15,
    fontWeight: '500',
  },
  selectedMusicContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 12,
  },
  selectedMusicInfo: {
    flex: 1,
  },
  selectedMusicTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  selectedMusicArtist: {
    fontSize: 13,
    marginTop: 2,
  },
  musicControls: {
    flexDirection: 'row',
    gap: 8,
  },
  musicControlButton: {
    padding: 4,
  },
  selectMusicButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  selectMusicText: {
    fontSize: 15,
  },
  musicList: {
    maxHeight: 400,
  },
  musicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  musicIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  musicItemInfo: {
    flex: 1,
  },
  musicItemTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  musicItemArtist: {
    fontSize: 13,
    marginTop: 2,
  },
  aspectScrollView: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  aspectRatioRow: {
    flexDirection: 'row',
    gap: 8,
  },
  aspectRatioButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  aspectRatioText: {
    fontSize: 14,
    fontWeight: '600',
  },
  framePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  framePreviewContainer: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#000',
  },
  framePreviewVideo: {
    width: '100%',
    height: '100%',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '600',
    minWidth: 40,
  },
  selectFrameButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  selectFrameButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});
