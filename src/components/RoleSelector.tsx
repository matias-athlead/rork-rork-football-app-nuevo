import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { UserRole } from '@/src/types/User';
import { useTheme } from '@/src/hooks/useTheme';
import { COLORS } from '@/src/utils/theme';

interface RoleSelectorProps {
  value: UserRole;
  onChange: (role: UserRole) => void;
}

export function RoleSelector({ value, onChange }: RoleSelectorProps) {
  const { theme } = useTheme();

  const roles: { value: UserRole; label: string }[] = [
    { value: 'player', label: 'Player' },
    { value: 'coach', label: 'Coach' },
    { value: 'club', label: 'Club' },
  ];

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.text }]}>Select Your Role</Text>
      <View style={styles.rolesContainer}>
        {roles.map((role) => {
          const isSelected = value === role.value;
          return (
            <Pressable
              key={role.value}
              onPress={() => onChange(role.value)}
              style={[
                styles.roleButton,
                {
                  backgroundColor: isSelected ? COLORS.primary : theme.card,
                  borderColor: isSelected ? COLORS.primary : theme.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.roleLabel,
                  { color: isSelected ? COLORS.white : theme.text },
                ]}
              >
                {role.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  rolesContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
});
