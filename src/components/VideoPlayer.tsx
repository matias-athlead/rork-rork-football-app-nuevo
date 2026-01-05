import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Play, Volume2, VolumeX } from 'lucide-react-native';
import { COLORS } from '@/src/utils/theme';

interface VideoPlayerProps {
  uri: string;
  style?: any;
  autoPlay?: boolean;
  isFocused?: boolean;
  showControls?: boolean;
  loop?: boolean;
}

export default function VideoPlayer({ 
  uri, 
  style, 
  autoPlay = false, 
  isFocused = true,
  showControls = true,
  loop = true 
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<Video>(null);

  useEffect(() => {
    if (!isFocused && isPlaying) {
      videoRef.current?.pauseAsync();
      setIsPlaying(false);
    }
  }, [isFocused, isPlaying]);

  const handlePlayPause = async () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      await videoRef.current.pauseAsync();
      setIsPlaying(false);
    } else {
      await videoRef.current.playAsync();
      setIsPlaying(true);
    }
  };

  const handleMuteToggle = async () => {
    if (!videoRef.current) return;
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
          onPress={handlePlayPause} 
          style={styles.controlsOverlay}
        >
          {!isPlaying && (
            <View style={styles.playButton}>
              <Play size={40} color={COLORS.white} fill={COLORS.white} />
            </View>
          )}
        </Pressable>
      )}

      {showControls && (
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
});
