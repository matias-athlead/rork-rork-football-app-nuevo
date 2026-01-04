import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TouchableOpacity } from 'react-native';
import { Check, X } from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { changeLanguage, getCurrentLanguage } from '@/src/i18n';

interface LanguageSelectorProps {
  visible: boolean;
  onClose: () => void;
}

const languages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
];

export default function LanguageSelector({ visible, onClose }: LanguageSelectorProps) {
  const { theme } = useTheme();
  const [currentLang, setCurrentLang] = React.useState(getCurrentLanguage());

  const handleSelectLanguage = async (code: string) => {
    await changeLanguage(code);
    setCurrentLang(code);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.modal, { backgroundColor: theme.card }]} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>Select Language</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.languages}>
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.languageItem,
                  { borderBottomColor: theme.border },
                ]}
                onPress={() => handleSelectLanguage(lang.code)}
              >
                <View style={styles.languageInfo}>
                  <Text style={[styles.languageName, { color: theme.text }]}>
                    {lang.nativeName}
                  </Text>
                  <Text style={[styles.languageSubtext, { color: theme.textSecondary }]}>
                    {lang.name}
                  </Text>
                </View>
                {currentLang === lang.code && (
                  <Check size={24} color="#10b981" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  languages: {
    paddingBottom: 8,
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 2,
  },
  languageSubtext: {
    fontSize: 14,
  },
});
