import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, Platform } from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Phone, Mic, MicOff, Volume2, VolumeX } from 'lucide-react-native';
import { MOCK_USERS } from '@/src/services/mockData';
import { COLORS } from '@/src/utils/theme';
import * as Haptics from 'expo-haptics';

export default function AudioCallScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [callDuration, setCallDuration] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);

  const callingUser = MOCK_USERS.find(u => u.id === id) || MOCK_USERS[0];

  useEffect(() => {
    const connectTimer = setTimeout(() => {
      setIsConnected(true);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }, 2000);

    return () => clearTimeout(connectTimer);
  }, []);

  useEffect(() => {
    if (!isConnected) return;

    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isConnected]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    router.back();
  };

  const handleToggleMute = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setIsMuted(!isMuted);
  };

  const handleToggleSpeaker = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setIsSpeaker(!isSpeaker);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.primary }]}>
      <View style={styles.content}>
        <View style={styles.userInfo}>
          <Image source={{ uri: callingUser.profilePhoto }} style={styles.avatar} />
          <Text style={styles.username}>{callingUser.username}</Text>
          <Text style={styles.status}>
            {isConnected ? formatDuration(callDuration) : 'Calling...'}
          </Text>
        </View>

        <View style={styles.controls}>
          <Pressable
            onPress={handleToggleSpeaker}
            style={[styles.controlButton, isSpeaker && styles.controlButtonActive]}
          >
            {isSpeaker ? (
              <Volume2 size={28} color={COLORS.white} />
            ) : (
              <VolumeX size={28} color={COLORS.white} />
            )}
          </Pressable>

          <Pressable
            onPress={handleToggleMute}
            style={[styles.controlButton, isMuted && styles.controlButtonActive]}
          >
            {isMuted ? (
              <MicOff size={28} color={COLORS.white} />
            ) : (
              <Mic size={28} color={COLORS.white} />
            )}
          </Pressable>
        </View>

        <Pressable onPress={handleEndCall} style={styles.endCallButton}>
          <Phone size={32} color={COLORS.white} style={{ transform: [{ rotate: '135deg' }] }} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  userInfo: {
    alignItems: 'center',
    marginTop: 60,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 24,
  },
  username: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 8,
  },
  status: {
    fontSize: 18,
    color: COLORS.white,
    opacity: 0.8,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
  },
  controlButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  endCallButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
});
