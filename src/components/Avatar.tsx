import React from 'react';
import { View, Text } from 'react-native';
import { Image } from 'expo-image';

// Deterministic color palette — same user always gets the same color
const COLORS = [
  '#e53935', '#e91e63', '#9c27b0', '#673ab7',
  '#3f51b5', '#1976d2', '#0288d1', '#00838f',
  '#2e7d32', '#558b2f', '#f57f17', '#e65100',
  '#6d4c41', '#546e7a', '#00897b', '#c62828',
];

function colorFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash | 0;
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

function isPlaceholder(uri?: string | null): boolean {
  if (!uri || uri.trim() === '') return true;
  // Treat auto-assigned placeholder services as "no photo"
  return uri.includes('pravatar.cc') || uri.includes('picsum.photos');
}

interface AvatarProps {
  uri?: string | null;
  username?: string;
  size?: number;
  style?: object;
}

export default function Avatar({ uri, username = '?', size = 40, style }: AvatarProps) {
  const radius = size / 2;

  if (!isPlaceholder(uri)) {
    return (
      <Image
        source={{ uri: uri! }}
        style={[{ width: size, height: size, borderRadius: radius }, style]}
        contentFit="cover"
      />
    );
  }

  const initial = (username[0] ?? '?').toUpperCase();
  const fontSize = Math.max(10, Math.round(size * 0.38));

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: colorFor(username),
          justifyContent: 'center',
          alignItems: 'center',
        },
        style,
      ]}
    >
      <Text
        style={{
          color: '#ffffff',
          fontSize,
          fontWeight: '700',
          lineHeight: fontSize * 1.25,
          includeFontPadding: false,
        }}
      >
        {initial}
      </Text>
    </View>
  );
}
