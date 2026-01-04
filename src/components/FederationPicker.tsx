import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, FlatList } from 'react-native';
import { Federation } from '@/src/types/User';
import { ChevronDown } from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { COLORS } from '@/src/utils/theme';
import { useTranslation } from 'react-i18next';

interface FederationPickerProps {
  value: Federation | null;
  onChange: (federation: Federation) => void;
}

const FEDERATIONS: Federation[] = [
  'RFEF',
  'Andaluza',
  'Catalana',
  'Madrileña',
  'Vasca',
  'Valenciana',
  'Aragonesa',
  'Gallega',
  'Castellana',
  'Murciana',
];

export function FederationPicker({ value, onChange }: FederationPickerProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.text }]}>{t('roles.federation')}</Text>
      <Pressable
        onPress={() => setIsOpen(true)}
        style={[styles.picker, { backgroundColor: theme.card, borderColor: theme.border }]}
      >
        <Text style={[styles.pickerText, { color: value ? theme.text : theme.textSecondary }]}>
          {value ? t(`federation.${value.toLowerCase()}`) : 'Select federation'}
        </Text>
        <ChevronDown size={20} color={theme.textSecondary} />
      </Pressable>

      <Modal visible={isOpen} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setIsOpen(false)}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {t('roles.federation')}
            </Text>
            <FlatList
              data={FEDERATIONS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    onChange(item);
                    setIsOpen(false);
                  }}
                  style={[
                    styles.option,
                    { backgroundColor: value === item ? COLORS.skyBlue : 'transparent' },
                  ]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      { color: value === item ? COLORS.white : theme.text },
                    ]}
                  >
                    {t(`federation.${item.toLowerCase()}`)}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  picker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  pickerText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  option: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
