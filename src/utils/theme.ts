export const COLORS = {
  primary: '#1E3A8A',
  primaryDark: '#1e40af',
  black: '#000000',
  white: '#FFFFFF',
  skyBlue: '#60A5FA',
  gray: '#6B7280',
  lightGray: '#E5E7EB',
  darkGray: '#374151',
  border: '#D1D5DB',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
} as const;

export interface Theme {
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
  tabBar: string;
  inputBackground: string;
  primary: string;
  accent: string;
}

export const lightTheme: Theme = {
  background: '#FFFFFF',
  card: '#F9FAFB',
  text: '#000000',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  tabBar: '#FFFFFF',
  inputBackground: '#F3F4F6',
  primary: COLORS.primary,
  accent: COLORS.skyBlue,
};

export const darkTheme: Theme = {
  background: '#000000',
  card: '#1F2937',
  text: '#FFFFFF',
  textSecondary: '#9CA3AF',
  border: '#374151',
  tabBar: '#111827',
  inputBackground: '#1F2937',
  primary: COLORS.skyBlue,
  accent: COLORS.skyBlue,
};
