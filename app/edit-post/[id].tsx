import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, SafeAreaView, Alert, TextInput, Platform, Modal, FlatList } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Check, Image as ImageIcon, MapPin, Music, Users, X, Volume2, VolumeX } from 'lucide-react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/src/hooks/useTheme';
import { useAuth } from '@/src/hooks/useAuth';
import { COLORS } from '@/src/utils/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { MUSIC_LIBRARY, MusicTrack } from '@/src/services/musicLibrary';
import { MOCK_USERS } from '@/src/services/mockData';

const POSTS_STORAGE_KEY = '@athlead_user_posts';

export default function EditPostScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [location, setLocation] = useState('');
  const [selectedMusic, setSelectedMusic] = useState<MusicTrack | null>(null);
  const [musicSound, setMusicSound] = useState('');
  const [clubTag, setClubTag] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showMusicModal, setShowMusicModal] = useState(false);
  const [musicSearch, setMusicSearch] = useState('');
  const [showClubModal, setShowClubModal] = useState(false);
  const [clubSearch, setClubSearch] = useState('');
  const [audioSound, setAudioSound] = useState<Audio.Sound | null>(null);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);

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
          setHashtags(post.hashtags?.join(' ') || '');
          setThumbnailUrl(post.thumbnailUrl);
          setCoverImage(post.coverImageUrl || null);
          setLocation(post.location || '');
          setMusicSound(post.musicSound || '');
          setClubTag(post.clubTag || '');
          if (post.musicUrl && post.musicTitle && post.musicArtist) {
            const track = MUSIC_LIBRARY.find(t => t.url === post.musicUrl);
            if (track) {
              setSelectedMusic(track);
            }
          }
        }
      }
    } catch (error) {
      console.log('Error loading post:', error);
    }
  }, [user, id]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  useEffect(() => {
    return () => {
      if (audioSound) {
        audioSound.unloadAsync();
      }
    };
  }, [audioSound]);

  const handleSelectCover = async () => {
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

  const clubUsers = MOCK_USERS.filter(u => u.role === 'club');
  const filteredClubs = clubUsers.filter(club => 
    club.username.toLowerCase().includes(clubSearch.toLowerCase()) ||
    club.fullName.toLowerCase().includes(clubSearch.toLowerCase())
  ).slice(0, 10);

  const handleSave = async () => {
    if (!user || !id) return;
    
    if (!caption.trim()) {
      Alert.alert('Error', 'Please enter a caption');
      return;
    }

    if (audioSound) {
      await audioSound.stopAsync();
      await audioSound.unloadAsync();
      setAudioSound(null);
      setIsPlayingMusic(false);
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
            coverImageUrl: coverImage || undefined,
            thumbnailUrl: coverImage || userPosts[postIndex].thumbnailUrl,
            location: location || undefined,
            musicSound: selectedMusic?.title || musicSound || undefined,
            musicUrl: selectedMusic?.url || undefined,
            musicTitle: selectedMusic?.title || undefined,
            musicArtist: selectedMusic?.artist || undefined,
            clubTag: clubTag || undefined,
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
          <View style={styles.formSection}>
            <Text style={[styles.label, { color: theme.text }]}>Cover Image</Text>
            {coverImage || thumbnailUrl ? (
              <View>
                <Image
                  source={{ uri: coverImage || thumbnailUrl }}
                  style={styles.thumbnail}
                  contentFit="cover"
                />
                <Pressable
                  onPress={handleSelectCover}
                  style={[styles.changeCoverButton, { backgroundColor: theme.card }]}
                >
                  <Text style={[styles.changeCoverText, { color: theme.text }]}>Change Cover</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={handleSelectCover}
                style={[styles.selectCoverButton, { backgroundColor: theme.card }]}
              >
                <ImageIcon size={24} color={theme.textSecondary} />
                <Text style={[styles.selectCoverText, { color: theme.textSecondary }]}>Select Cover Image</Text>
              </Pressable>
            )}
          </View>

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

          <View style={styles.formSection}>
            <Text style={[styles.label, { color: theme.text }]}>Location</Text>
            <View style={styles.metadataInputContainer}>
              <MapPin size={20} color={COLORS.skyBlue} />
              <TextInput
                style={[
                  styles.metadataTextInput,
                  { 
                    backgroundColor: theme.card,
                    color: theme.text,
                    borderColor: theme.border,
                  }
                ]}
                value={location}
                onChangeText={setLocation}
                placeholder="Add location..."
                placeholderTextColor={theme.textSecondary}
              />
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={[styles.label, { color: theme.text }]}>Music</Text>
            {selectedMusic ? (
              <View style={[styles.selectedMusicContainer, { backgroundColor: theme.card }]}>
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
                style={[styles.selectButton, { backgroundColor: theme.card }]}
              >
                <Music size={20} color={theme.textSecondary} />
                <Text style={[styles.selectButtonText, { color: theme.textSecondary }]}>Select music...</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.formSection}>
            <Text style={[styles.label, { color: theme.text }]}>Club Tag</Text>
            <Pressable
              onPress={() => {
                setClubSearch('');
                setShowClubModal(true);
              }}
              style={[styles.clubTagButton, { backgroundColor: theme.card }]}
            >
              <Users size={20} color={COLORS.skyBlue} />
              <Text style={[styles.clubTagText, { color: clubTag ? theme.text : theme.textSecondary }]}>
                {clubTag ? `@${clubTag}` : 'Tag a club...'}
              </Text>
              {clubTag && (
                <Pressable onPress={() => setClubTag('')} style={styles.clearClubTag}>
                  <X size={16} color={theme.textSecondary} />
                </Pressable>
              )}
            </Pressable>
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

      <Modal visible={showMusicModal} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowMusicModal(false)}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Select Music</Text>
              <Pressable onPress={() => setShowMusicModal(false)}>
                <X size={24} color={theme.text} />
              </Pressable>
            </View>
            <TextInput
              style={[styles.searchInput, { color: theme.text, backgroundColor: theme.card }]}
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
                  style={[styles.musicItem, { backgroundColor: theme.card }]}
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

      <Modal visible={showClubModal} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowClubModal(false)}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Tag a Club</Text>
              <Pressable onPress={() => setShowClubModal(false)}>
                <X size={24} color={theme.text} />
              </Pressable>
            </View>
            <TextInput
              style={[styles.searchInput, { color: theme.text, backgroundColor: theme.card }]}
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
                  style={[styles.clubItem, { backgroundColor: theme.card }]}
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
  changeCoverButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
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
  selectCoverText: {
    fontSize: 15,
    fontWeight: '500',
  },
  metadataInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  metadataTextInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 12,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
  },
  selectButtonText: {
    fontSize: 15,
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
  clubTagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
  },
  clubTagText: {
    fontSize: 15,
    flex: 1,
  },
  clearClubTag: {
    padding: 4,
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
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  searchInput: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 15,
    marginBottom: 12,
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
  noResults: {
    fontSize: 14,
    textAlign: 'center',
    padding: 20,
  },
});
