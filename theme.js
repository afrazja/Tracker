export const theme = {
  colors: {
    bg: '#394579',
    card: '#FFFFFF',
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    accentBlue: '#2563EB',
    accentGreen: '#10B981',
    accentAmber: '#F59E0B',
    border: '#E5E7EB',
    subtle: '#F3F4F6'
  },
  radius: {
    xs: 6,
    sm: 10,
    md: 12,
    lg: 16,
    xl: 20,
  },
  spacing: (n) => n * 4,
  shadow: {
    card: {
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    }
  }
};
