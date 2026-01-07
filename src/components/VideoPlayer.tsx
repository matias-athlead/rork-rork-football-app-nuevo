import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator, Platform } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Play, Volume2, VolumeX, Pause } from 'lucide-react-native';
import { COLORS } from '@/src/utils/theme';
import * as Haptics from 'expo-haptics';

interface VideoPlayerProps {
  uri: string;
  style?: any;
  autoPlay?: boolean;
  isFocused?: boolean;
  showControls?: boolean;
  loop?: boolean;
  forceMute?: boolean;
  isVisible?: boolean;
}

export default function VideoPlayer({ 
  uri, 
  style, 
  autoPlay = false, 
  isFocused = true,
  showControls = true,
  loop = true,
  forceMute = false,
  isVisible = true
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isHolding, setIsHolding] = useState(false);
  const [wasPlayingBeforeHold, setWasPlayingBeforeHold] = useState(false);
  const videoRef = useRef<Video>(null);

  useEffect(() => {
    if (forceMute) {
      setIsMuted(true);
    }
  }, [forceMute]);

  useEffect(() => {
    if (!isVisible || !isFocused) {
      if (isPlaying) {
        videoRef.current?.pauseAsync();
        setIsPlaying(false);
      }
    }
  }, [isVisible, isFocused, isPlaying]);

  const handlePressIn = async () => {
    if (!videoRef.current) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIsHolding(true);
    setWasPlayingBeforeHold(isPlaying);
    if (isPlaying) {
      await videoRef.current.pauseAsync();
    }
  };

  const handlePressOut = async () => {
    if (!videoRef.current) return;
    setIsHolding(false);
    if (wasPlayingBeforeHold) {
      await videoRef.current.playAsync();
    }
  };

  const handleMuteToggle = async () => {
    if (!videoRef.current || forceMute) return;
    setIsMuted(!isMuted);
  };

  const handleVideoStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setIsLoading(false);
      setIsPlaying(status.isPlaying);
      if (status.didJustFinish && !loop) {
        setIsPlaying(false);
      }
    }
  };

  return (
    <View style={[styles.container, style]}>
      <Video
        ref={videoRef}
        source={{ uri }}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        isLooping={loop}
        isMuted={isMuted}
        shouldPlay={autoPlay}
        onPlaybackStatusUpdate={handleVideoStatusUpdate}
        useNativeControls={false}
      />
      
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.white} />
        </View>
      )}

      {showControls && (
        <Pressable 
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.controlsOverlay}
        >
          {!isPlaying && !isHolding && (
            <View style={styles.playButton}>
              <Play size={40} color={COLORS.white} fill={COLORS.white} />
            </View>
          )}
          {isHolding && (
            <View style={styles.pauseIndicator}>
              <Pause size={40} color={COLORS.white} fill={COLORS.white} />
            </View>
          )}
        </Pressable>
      )}

      {showControls && !forceMute && (
        <Pressable 
          onPress={handleMuteToggle}
          style={styles.muteButton}
        >
          {isMuted ? (
            <VolumeX size={24} color={COLORS.white} />
          ) : (
            <Volume2 size={24} color={COLORS.white} />
          )}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  controlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 40,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  muteButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    padding: 10,
  },
  pauseIndicator: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 40,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
