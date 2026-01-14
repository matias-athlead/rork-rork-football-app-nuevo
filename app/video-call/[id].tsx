import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, Platform, Alert } from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Phone, Mic, MicOff, Video, VideoOff, Camera, CameraOff, RefreshCw } from 'lucide-react-native';
import { useCameraPermissions, useMicrophonePermissions, CameraView, CameraType } from 'expo-camera';
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
  const [isRequesting, setIsRequesting] = useState(true);
  const [hasAllPermissions, setHasAllPermissions] = useState(false);
  const [cameraType, setCameraType] = useState<CameraType>('front');
  const cameraRef = useRef<CameraView>(null);

  const [, requestCameraPermission] = useCameraPermissions();
  const [, requestMicPermission] = useMicrophonePermissions();

  const callingUser = MOCK_USERS.find(u => u.id === id) || MOCK_USERS[0];

  const requestPermissions = useCallback(async () => {
    try {
      if (Platform.OS === 'web') {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          stream.getTracks().forEach(track => track.stop());
          setHasAllPermissions(true);
        } catch {
          setHasAllPermissions(false);
          Alert.alert(
            'Camera & Microphone Required',
            'Please allow camera and microphone access to make video calls.',
            [{ text: 'OK', onPress: () => router.back() }]
          );
        }
        setIsRequesting(false);
        return;
      }

      const cameraResult = await requestCameraPermission();
      const micResult = await requestMicPermission();

      const allGranted = cameraResult.granted && micResult.granted;
      setHasAllPermissions(allGranted);

      if (!allGranted) {
        const missingPermissions = [];
        if (!cameraResult.granted) missingPermissions.push('Camera');
        if (!micResult.granted) missingPermissions.push('Microphone');

        Alert.alert(
          'Permissions Required',
          `Please allow ${missingPermissions.join(' and ')} access to make video calls.`,
          [
            { text: 'Cancel', onPress: () => router.back(), style: 'cancel' },
            { text: 'Try Again', onPress: () => requestPermissions() },
          ]
        );
      }
    } catch (error) {
      console.log('Error requesting permissions:', error);
      setHasAllPermissions(false);
    } finally {
      setIsRequesting(false);
    }
  }, [router, requestCameraPermission, requestMicPermission]);

  useEffect(() => {
    requestPermissions();
  }, [requestPermissions]);

  useEffect(() => {
    if (!hasAllPermissions || isRequesting) return;

    const connectTimer = setTimeout(() => {
      setIsConnected(true);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }, 2000);

    return () => clearTimeout(connectTimer);
  }, [hasAllPermissions, isRequesting]);

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

  const handleFlipCamera = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setCameraType(current => (current === 'back' ? 'front' : 'back'));
  };

  if (isRequesting) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Camera size={64} color={COLORS.white} />
          <Text style={styles.permissionTitle}>Requesting Permissions</Text>
          <Text style={styles.permissionText}>Please allow camera and microphone access to make video calls</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!hasAllPermissions) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <CameraOff size={64} color={COLORS.white} />
          <Text style={styles.permissionTitle}>Permissions Denied</Text>
          <Text style={styles.permissionText}>Please enable camera and microphone access in your device settings to make video calls</Text>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

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
        {!isVideoOff && hasAllPermissions && Platform.OS !== 'web' ? (
          <CameraView
            ref={cameraRef}
            style={styles.localVideo}
            facing={cameraType}
            mirror={cameraType === 'front'}
          />
        ) : (
          <>
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
          </>
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
            onPress={handleFlipCamera}
            style={styles.controlButton}
          >
            <RefreshCw size={28} color={COLORS.white} />
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
