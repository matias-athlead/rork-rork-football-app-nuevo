import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Platform } from 'react-native';
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
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<Video>(null);
  const isMounted = useRef(true);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
      }
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
      
      try {
        if (Platform.OS === 'web') {
          const video = videoRef.current as any;
          if (isVisible && isFocused && !isHolding) {
            await video.play();
            if (isMounted.current) setIsPlaying(true);
          } else {
            video.pause();
            if (isMounted.current) setIsPlaying(false);
          }
        } else {
          if (isVisible && isFocused && !isHolding) {
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
  }, [isVisible, isFocused, isHolding, hasError]);

  const handlePressIn = async () => {
    if (!videoRef.current || hasError) return;
    
    holdTimerRef.current = setTimeout(async () => {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setIsHolding(true);
      
      try {
        if (Platform.OS === 'web') {
          (videoRef.current as any).pause();
        } else {
          await (videoRef.current as any).pauseAsync();
        }
        setIsPlaying(false);
      } catch (e) {
        console.log('Video pause error:', e);
      }
    }, 800);
  };

  const handlePressOut = async () => {
    if (!videoRef.current || hasError) return;
    
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    
    const wasHolding = isHolding;
    setIsHolding(false);
    
    if (wasHolding && isVisible && isFocused) {
      try {
        if (Platform.OS === 'web') {
          await (videoRef.current as any).play();
          setIsPlaying(true);
        } else {
          await (videoRef.current as any).playAsync();
          setIsPlaying(true);
        }
      } catch (e) {
        console.log('Video play error:', e);
      }
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
            onPressIn={() => {
              if (holdTimerRef.current) {
                clearTimeout(holdTimerRef.current);
              }
              holdTimerRef.current = setTimeout(() => {
                setIsHolding(true);
                const video = videoRef.current as any;
                if (video) video.pause();
                setIsPlaying(false);
              }, 800);
            }}
            onPressOut={() => {
              if (holdTimerRef.current) {
                clearTimeout(holdTimerRef.current);
                holdTimerRef.current = null;
              }
              const wasHolding = isHolding;
              setIsHolding(false);
              const video = videoRef.current as any;
              if (video && wasHolding && isVisible && isFocused) {
                video.play();
                setIsPlaying(true);
              }
            }}
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
            onPress={() => {
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
