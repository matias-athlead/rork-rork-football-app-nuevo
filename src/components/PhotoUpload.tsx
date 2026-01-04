import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Alert } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { COLORS } from '@/src/utils/theme';
import { useTranslation } from 'react-i18next';

interface PhotoUploadProps {
  value: string | null;
  onChange: (uri: string) => void;
  username?: string;
}

export function PhotoUpload({ value, onChange, username }: PhotoUploadProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const generateAvatar = (name: string) => {
    const initial = name.charAt(0).toUpperCase();
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];
    const color = colors[initial.charCodeAt(0) % colors.length];
    return { initial, color };
  };

  const pickImage = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to your photo library');
        return;
      }
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onChange(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const avatar = username ? generateAvatar(username) : null;

  return (
    <View style={styles.container}>
      <Pressable onPress={pickImage} style={styles.photoContainer}>
        {value ? (
          <Image source={{ uri: value }} style={styles.photo} contentFit="cover" />
        ) : avatar ? (
          <View style={[styles.placeholder, { backgroundColor: avatar.color }]}>
            <Text style={styles.initial}>{avatar.initial}</Text>
          </View>
        ) : (
          <View style={[styles.placeholder, { backgroundColor: theme.border }]}>
            <Camera size={40} color={theme.textSecondary} />
          </View>
        )}
        <View style={styles.badge}>
          <Camera size={16} color={COLORS.white} />
        </View>
      </Pressable>
      <Text style={[styles.label, { color: theme.textSecondary }]}>
        {t('auth.uploadPhoto')} ({t('auth.optional')})
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 20,
  },
  photoContainer: {
    position: 'relative',
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  placeholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initial: {
    fontSize: 48,
    fontWeight: '700',
    color: COLORS.white,
  },
  badge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.skyBlue,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  label: {
    marginTop: 12,
    fontSize: 14,
  },
});
