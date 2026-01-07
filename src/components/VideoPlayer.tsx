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
  const videoRef = useRef<Video>(null);

  useEffect(() => {
    if (forceMute) {
      setIsMuted(true);
    }
  }, [forceMute]);

  useEffect(() => {
    const handleVisibility = async () => {
      if (!videoRef.current) return;
      
      if (Platform.OS === 'web') {
        const video = videoRef.current as any;
        if (isVisible && isFocused && !isHolding) {
          try {
            await video.play();
            setIsPlaying(true);
          } catch (e) {
            console.log('Video play failed:', e);
          }
        } else {
          video.pause();
          setIsPlaying(false);
        }
      } else {
        if (isVisible && isFocused && !isHolding) {
          await (videoRef.current as any).playAsync();
          setIsPlaying(true);
        } else {
          await (videoRef.current as any).pauseAsync();
          setIsPlaying(false);
        }
      }
    };
    
    handleVisibility();
  }, [isVisible, isFocused, isHolding]);

  const handlePressIn = async () => {
    if (!videoRef.current) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIsHolding(true);
    
    if (Platform.OS === 'web') {
      (videoRef.current as any).pause();
    } else {
      await (videoRef.current as any).pauseAsync();
    }
    setIsPlaying(false);
  };

  const handlePressOut = async () => {
    if (!videoRef.current) return;
    setIsHolding(false);
    if (isVisible && isFocused) {
      if (Platform.OS === 'web') {
        try {
          await (videoRef.current as any).play();
          setIsPlaying(true);
        } catch (e) {
          console.log('Video play failed:', e);
        }
      } else {
        await (videoRef.current as any).playAsync();
        setIsPlaying(true);
      }
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
              setIsHolding(true);
              const video = videoRef.current as any;
              if (video) video.pause();
              setIsPlaying(false);
            }}
            onPressOut={() => {
              setIsHolding(false);
              const video = videoRef.current as any;
              if (video && isVisible && isFocused) {
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

  return (
    <View style={[styles.container, style]}>
      <Video
        ref={videoRef as any}
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
