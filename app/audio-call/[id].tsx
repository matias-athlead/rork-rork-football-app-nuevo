import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, Platform, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Phone, Mic, MicOff, Volume2, VolumeX } from 'lucide-react-native';
import { Audio } from 'expo-av';
import Avatar from '@/src/components/Avatar';
import { authService } from '@/src/services/authService';
import { User } from '@/src/types/User';
import { COLORS } from '@/src/utils/theme';
import * as Haptics from 'expo-haptics';

export default function AudioCallScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [callDuration, setCallDuration] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isRequesting, setIsRequesting] = useState(true);
  const [callingUser, setCallingUser] = useState<Partial<User>>({ username: '...', profilePhoto: 'https://i.pravatar.cc/300?img=1' });

  useEffect(() => {
    const loadUser = async () => {
      const userId = Array.isArray(id) ? id[0] : String(id);
      try {
        const users = await authService.getAllUsers();
        const found = users.find(u => u.id === userId);
        if (found) setCallingUser(found);
      } catch {}
    };
    loadUser();
  }, [id]);

  const requestMicrophonePermission = useCallback(async () => {
    try {
      if (Platform.OS === 'web') {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(track => track.stop());
          setHasPermission(true);
        } catch {
          setHasPermission(false);
          Alert.alert(
            'Microphone Permission Required',
            'Please allow microphone access to make audio calls.',
            [{ text: 'OK', onPress: () => router.back() }]
          );
        }
        setIsRequesting(false);
        return;
      }

      const { status } = await Audio.requestPermissionsAsync();
      const granted = status === 'granted';
      setHasPermission(granted);
      
      if (!granted) {
        Alert.alert(
          'Microphone Permission Required',
          'Please allow microphone access in your device settings to make audio calls.',
          [
            { text: 'Cancel', onPress: () => router.back(), style: 'cancel' },
            { text: 'Try Again', onPress: () => requestMicrophonePermission() },
          ]
        );
      } else {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
      }
    } catch (error) {
      console.log('Error requesting microphone permission:', error);
      setHasPermission(false);
    } finally {
      setIsRequesting(false);
    }
  }, [router]);

  useEffect(() => {
    requestMicrophonePermission();
  }, [requestMicrophonePermission]);

  useEffect(() => {
    if (!hasPermission || isRequesting) return;

    const connectTimer = setTimeout(() => {
      setIsConnected(true);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }, 2000);

    return () => clearTimeout(connectTimer);
  }, [hasPermission, isRequesting]);

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

  if (isRequesting) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: COLORS.primary }]}>
        <View style={styles.permissionContainer}>
          <Mic size={64} color={COLORS.white} />
          <Text style={styles.permissionTitle}>Requesting Microphone Access</Text>
          <Text style={styles.permissionText}>Please allow microphone access to make audio calls</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!hasPermission) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: COLORS.primary }]}>
        <View style={styles.permissionContainer}>
          <MicOff size={64} color={COLORS.white} />
          <Text style={styles.permissionTitle}>Microphone Access Denied</Text>
          <Text style={styles.permissionText}>Please enable microphone access in your device settings to make audio calls</Text>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.primary }]}>
      <View style={styles.content}>
        <View style={styles.userInfo}>
          <View style={styles.demoBadge}>
            <Text style={styles.demoBadgeText}>Demo Mode — Real calls coming soon</Text>
          </View>
          <Avatar uri={callingUser.profilePhoto || ''} username={callingUser.username || '...'} size={120} />
          <Text style={styles.username}>{callingUser.username || '...'}</Text>
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
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 16,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
    marginTop: 16,
  },
  permissionText: {
    fontSize: 16,
    color: COLORS.white,
    opacity: 0.8,
    textAlign: 'center',
    lineHeight: 24,
  },
  backBtn: {
    marginTop: 24,
    paddingVertical: 14,
    paddingHorizontal: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 25,
  },
  backBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  userInfo: {
    alignItems: 'center',
    marginTop: 40,
    gap: 12,
  },
  demoBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 8,
  },
  demoBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.9,
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
