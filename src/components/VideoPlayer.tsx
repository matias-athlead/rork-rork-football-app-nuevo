import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Platform } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Play, Volume2, VolumeX } from 'lucide-react-native';
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
  paused?: boolean;
}

export default function VideoPlayer({
  uri,
  style,
  autoPlay = false,
  isFocused = true,
  showControls = true,
  loop = true,
  forceMute = false,
  isVisible = true,
  paused = false,
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<Video>(null);
  const isMounted = useRef(true);
  const lastPauseToggle = useRef<number>(0);
  const PAUSE_COOLDOWN = 1000;

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (forceMute) {
      setIsMuted(true);
    }
  }, [forceMute]);

  useEffect(() => {
    const handleVisibility = async () => {
      if (!videoRef.current || !isMounted.current || hasError) return;
      const shouldPlay = isVisible && isFocused && !paused;
      try {
        if (Platform.OS === 'web') {
          const video = videoRef.current as any;
          if (shouldPlay) {
            await video.play();
            if (isMounted.current) setIsPlaying(true);
          } else {
            video.pause();
            if (isMounted.current) setIsPlaying(false);
          }
        } else {
          if (shouldPlay) {
            await (videoRef.current as any).playAsync();
            if (isMounted.current) setIsPlaying(true);
          } else {
            await (videoRef.current as any).pauseAsync();
            if (isMounted.current) setIsPlaying(false);
          }
        }
      } catch (e) {
        console.log('Video playback error:', e);
      }
    };

    const timeoutId = setTimeout(handleVisibility, 100);
    return () => clearTimeout(timeoutId);
  }, [isVisible, isFocused, paused, hasError]);

  const handlePress = async () => {
    if (!videoRef.current || hasError) return;
    
    const now = Date.now();
    const timeSinceLastToggle = now - lastPauseToggle.current;
    
    if (timeSinceLastToggle < PAUSE_COOLDOWN) {
      return;
    }
    
    lastPauseToggle.current = now;
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    try {
      if (Platform.OS === 'web') {
        const video = videoRef.current as any;
        if (isPlaying) {
          video.pause();
          setIsPlaying(false);
        } else {
          await video.play();
          setIsPlaying(true);
        }
      } else {
        if (isPlaying) {
          await (videoRef.current as any).pauseAsync();
          setIsPlaying(false);
        } else {
          await (videoRef.current as any).playAsync();
          setIsPlaying(true);
        }
      }
    } catch (e) {
      console.log('Video toggle error:', e);
    }
  };

  const handleMuteToggle = async () => {
    if (!videoRef.current || forceMute) return;
    setIsMuted(!isMuted);
  };

  const handleVideoStatusUpdate = (status: AVPlaybackStatus) => {
    if (!isMounted.current) return;
    
    if (status.isLoaded) {
      setIsLoading(false);
      setIsPlaying(status.isPlaying);
      setHasError(false);
      if (status.didJustFinish && !loop) {
        setIsPlaying(false);
      }
    } else if ('error' in status) {
      console.log('Video error:', status.error);
      setHasError(true);
      setIsLoading(false);
    }
  };

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, style]}>
        <video
          ref={videoRef as any}
          src={uri}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
          loop={loop}
          muted={isMuted}
          playsInline
          onLoadStart={() => setIsLoading(true)}
          onCanPlay={() => setIsLoading(false)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
        
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={COLORS.white} />
          </View>
        )}

        {showControls && (
          <Pressable 
            onPress={() => {
              const video = videoRef.current as any;
              if (!video) return;
              
              const now = Date.now();
              const timeSinceLastToggle = now - lastPauseToggle.current;
              
              if (timeSinceLastToggle < PAUSE_COOLDOWN) {
                return;
              }
              
              lastPauseToggle.current = now;
              
              if (isPlaying) {
                video.pause();
                setIsPlaying(false);
              } else {
                video.play();
                setIsPlaying(true);
              }
            }}
            style={styles.controlsOverlay}
          >
            {!isPlaying && (
              <View style={styles.playButton}>
                <Play size={40} color={COLORS.white} fill={COLORS.white} />
              </View>
            )}
          </Pressable>
        )}

        {showControls && !forceMute && (
          <Pressable 
            onPress={(e) => {
              e.stopPropagation();
              setIsMuted(!isMuted);
              const video = videoRef.current as any;
              if (video) video.muted = !isMuted;
            }}
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

  if (!uri || hasError) {
    return (
      <View style={[styles.container, style, styles.errorContainer]}>
        <Text style={styles.errorText}>Unable to load video</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Video
        ref={videoRef}
        source={{ uri }}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        isLooping={loop}
        isMuted={isMuted}
        shouldPlay={false}
        onPlaybackStatusUpdate={handleVideoStatusUpdate}
        useNativeControls={false}
        onError={(error) => {
          console.log('Video component error:', error);
          setHasError(true);
          setIsLoading(false);
        }}
      />
      
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.white} />
        </View>
      )}

      {showControls && (
        <Pressable 
          onPress={handlePress}
          style={styles.controlsOverlay}
        >
          {!isPlaying && (
            <View style={styles.playButton}>
              <Play size={40} color={COLORS.white} fill={COLORS.white} />
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
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: COLORS.white,
    fontSize: 14,
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
