import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, SafeAreaView, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, Camera } from 'lucide-react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/src/hooks/useTheme';
import { useAuth } from '@/src/hooks/useAuth';
import { COLORS } from '@/src/utils/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function EditProfileScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [city, setCity] = useState(user?.city || '');
  const [currentClub, setCurrentClub] = useState(user?.role === 'player' ? (user.currentClub || '') : '');
  const [profilePhoto, setProfilePhoto] = useState(user?.profilePhoto || '');
  const [isSaving, setIsSaving] = useState(false);

  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photos to change your profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProfilePhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Failed to pick image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSave = async () => {
    if (!user) return;

    if (!fullName.trim() || !username.trim()) {
      Alert.alert('Validation Error', 'Name and username are required');
      return;
    }

    setIsSaving(true);
    try {
      const updatedUser = {
        ...user,
        fullName: fullName.trim(),
        username: username.trim(),
        bio: bio.trim(),
        city: city.trim(),
        profilePhoto,
      };

      if (user.role === 'player') {
        (updatedUser as any).currentClub = currentClub.trim();
      }

      await updateUser(updatedUser);
      
      await AsyncStorage.setItem('@user_profile', JSON.stringify(updatedUser));
      
      Alert.alert('Success', 'Profile updated successfully!');
      router.back();
    } catch (error) {
      console.error('Failed to update profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Edit Profile</Text>
        <Pressable onPress={handleSave} disabled={isSaving}>
          <Text style={[styles.saveText, { color: isSaving ? theme.textSecondary : COLORS.skyBlue }]}>
            {isSaving ? 'Saving...' : 'Save'}
          </Text>
        </Pressable>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.photoSection}>
          <Image 
            source={{ uri: profilePhoto }} 
            style={styles.profilePhoto}
            contentFit="cover"
          />
          <Pressable 
            style={[styles.photoButton, { backgroundColor: theme.card }]}
            onPress={handlePickImage}
          >
            <Camera size={20} color={COLORS.skyBlue} />
            <Text style={[styles.photoButtonText, { color: COLORS.skyBlue }]}>Change Photo</Text>
          </Pressable>
        </View>

        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Full Name</Text>
            <TextInput
              style={[styles.textInput, { color: theme.text, backgroundColor: theme.inputBackground, borderColor: theme.border }]}
              placeholder="Enter your full name"
              placeholderTextColor={theme.textSecondary}
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Username</Text>
            <TextInput
              style={[styles.textInput, { color: theme.text, backgroundColor: theme.inputBackground, borderColor: theme.border }]}
              placeholder="Enter your username"
              placeholderTextColor={theme.textSecondary}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Bio</Text>
            <TextInput
              style={[styles.textArea, { color: theme.text, backgroundColor: theme.inputBackground, borderColor: theme.border }]}
              placeholder="Tell us about yourself"
              placeholderTextColor={theme.textSecondary}
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>City</Text>
            <TextInput
              style={[styles.textInput, { color: theme.text, backgroundColor: theme.inputBackground, borderColor: theme.border }]}
              placeholder="Enter your city"
              placeholderTextColor={theme.textSecondary}
              value={city}
              onChangeText={setCity}
            />
          </View>

          {user?.role === 'player' && (
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Current Club</Text>
              <TextInput
                style={[styles.textInput, { color: theme.text, backgroundColor: theme.inputBackground, borderColor: theme.border }]}
                placeholder="Enter your club"
                placeholderTextColor={theme.textSecondary}
                value={currentClub}
                onChangeText={setCurrentClub}
              />
            </View>
          )}
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
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  photoButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  formSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  textArea: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    minHeight: 100,
    textAlignVertical: 'top',
  },
});
