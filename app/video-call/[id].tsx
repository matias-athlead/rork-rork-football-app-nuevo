import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, Platform } from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Phone, Mic, MicOff, Video, VideoOff, Camera } from 'lucide-react-native';
import { useAuth } from '@/src/hooks/useAuth';
import { MOCK_USERS } from '@/src/services/mockData';
import { COLORS } from '@/src/utils/theme';
import * as Haptics from 'expo-haptics';

export default function VideoCallScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { id } = useLocalSearchParams();
  const [callDuration, setCallDuration] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

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

  const handleToggleVideo = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setIsVideoOff(!isVideoOff);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.remoteVideoContainer}>
        <Image
          source={{ uri: callingUser.profilePhoto }}
          style={styles.remoteVideo}
          contentFit="cover"
        />
        {!isConnected && (
          <View style={styles.connectingOverlay}>
            <Text style={styles.connectingText}>Connecting...</Text>
          </View>
        )}
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>
            {isConnected ? formatDuration(callDuration) : 'Calling...'}
          </Text>
        </View>
      </View>

      <View style={styles.localVideoContainer}>
        {user && (
          <Image
            source={{ uri: user.profilePhoto }}
            style={styles.localVideo}
            contentFit="cover"
          />
        )}
        {isVideoOff && (
          <View style={styles.videoOffOverlay}>
            <VideoOff size={32} color={COLORS.white} />
          </View>
        )}
      </View>

      <View style={styles.controlsContainer}>
        <View style={styles.controls}>
          <Pressable
            onPress={handleToggleVideo}
            style={[styles.controlButton, isVideoOff && styles.controlButtonDanger]}
          >
            {isVideoOff ? (
              <VideoOff size={28} color={COLORS.white} />
            ) : (
              <Video size={28} color={COLORS.white} />
            )}
          </Pressable>

          <Pressable
            onPress={handleToggleMute}
            style={[styles.controlButton, isMuted && styles.controlButtonDanger]}
          >
            {isMuted ? (
              <MicOff size={28} color={COLORS.white} />
            ) : (
              <Mic size={28} color={COLORS.white} />
            )}
          </Pressable>

          <Pressable
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }
            }}
            style={styles.controlButton}
          >
            <Camera size={28} color={COLORS.white} />
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
    backgroundColor: '#000',
  },
  remoteVideoContainer: {
    flex: 1,
    position: 'relative',
  },
  remoteVideo: {
    width: '100%',
    height: '100%',
  },
  connectingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectingText: {
    fontSize: 20,
    color: COLORS.white,
    fontWeight: '600',
  },
  durationBadge: {
    position: 'absolute',
    top: 60,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  durationText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  localVideoContainer: {
    position: 'absolute',
    top: 100,
    right: 20,
    width: 120,
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  localVideo: {
    width: '100%',
    height: '100%',
  },
  videoOffOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    paddingHorizontal: 40,
    gap: 32,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  controlButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonDanger: {
    backgroundColor: COLORS.error,
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
