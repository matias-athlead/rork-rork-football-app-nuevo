import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, SafeAreaView, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Camera } from 'lucide-react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/src/hooks/useTheme';
import { useAuth } from '@/src/hooks/useAuth';
import { COLORS } from '@/src/utils/theme';

export default function EditProfileScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [city, setCity] = useState(user?.city || '');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Edit Profile</Text>
        <Pressable onPress={() => {
          Alert.alert('Success', 'Profile updated!');
          router.back();
        }}>
          <Text style={[styles.saveText, { color: COLORS.skyBlue }]}>Save</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.photoSection}>
          <Image 
            source={{ uri: user?.profilePhoto }} 
            style={styles.profilePhoto}
            contentFit="cover"
          />
          <Pressable style={[styles.photoButton, { backgroundColor: theme.card }]}>
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
                value={'currentClub' in user ? user.currentClub : ''}
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
