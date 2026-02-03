import { useTheme } from '@/lib/context/ThemeContext';

/**
 * Hook that provides theme-aware colors for accessibility
 * Ensures proper contrast ratios between text and background
 */
export const useThemeAwareColors = () => {
  const { theme } = useTheme();

  const getColorForContrast = (baseColor: string, targetContrast: 'text' | 'background' | 'border' = 'text'): string => {
    // For text on background
    if (targetContrast === 'text') {
      if (theme === 'dark') {
        // Dark theme: use lighter text colors
        switch(baseColor) {
          case 'primary':
            return '#60a5fa'; // light blue
          case 'secondary':
            return '#94a3b8'; // light gray
          case 'success':
            return '#4ade80'; // light green
          case 'warning':
            return '#fbbf24'; // light yellow
          case 'error':
            return '#f87171'; // light red
          case 'muted':
            return '#94a3b8'; // muted text
          default:
            return '#e2e8f0'; // default light text
        }
      } else {
        // Light theme: use darker text colors
        switch(baseColor) {
          case 'primary':
            return '#2563eb'; // dark blue
          case 'secondary':
            return '#64748b'; // dark gray
          case 'success':
            return '#16a34a'; // dark green
          case 'warning':
            return '#d97706'; // dark yellow
          case 'error':
            return '#dc2626'; // dark red
          case 'muted':
            return '#64748b'; // muted text
          default:
            return '#1e293b'; // default dark text
        }
      }
    }

    // For background colors
    if (targetContrast === 'background') {
      if (theme === 'dark') {
        // Dark theme: use darker backgrounds
        switch(baseColor) {
          case 'primary':
            return '#1e40af'; // dark blue bg
          case 'secondary':
            return '#334155'; // dark gray bg
          case 'success':
            return '#166534'; // dark green bg
          case 'warning':
            return '#92400e'; // dark yellow bg
          case 'error':
            return '#7f1d1d'; // dark red bg
          case 'muted':
            return '#334155'; // muted bg
          default:
            return '#1e293b'; // default dark bg
        }
      } else {
        // Light theme: use lighter backgrounds
        switch(baseColor) {
          case 'primary':
            return '#dbeafe'; // light blue bg
          case 'secondary':
            return '#e2e8f0'; // light gray bg
          case 'success':
            return '#dcfce7'; // light green bg
          case 'warning':
            return '#fef3c7'; // light yellow bg
          case 'error':
            return '#fee2e2'; // light red bg
          case 'muted':
            return '#f1f5f9'; // muted bg
          default:
            return '#f8fafc'; // default light bg
        }
      }
    }

    // For border colors
    if (targetContrast === 'border') {
      if (theme === 'dark') {
        // Dark theme: use medium contrast borders
        switch(baseColor) {
          case 'primary':
            return '#3b82f6'; // blue border
          case 'secondary':
            return '#475569'; // gray border
          case 'success':
            return '#22c55e'; // green border
          case 'warning':
            return '#f59e0b'; // yellow border
          case 'error':
            return '#ef4444'; // red border
          case 'muted':
            return '#475569'; // muted border
          default:
            return '#334155'; // default border
        }
      } else {
        // Light theme: use medium contrast borders
        switch(baseColor) {
          case 'primary':
            return '#3b82f6'; // blue border
          case 'secondary':
            return '#94a3b8'; // gray border
          case 'success':
            return '#22c55e'; // green border
          case 'warning':
            return '#f59e0b'; // yellow border
          case 'error':
            return '#ef4444'; // red border
          case 'muted':
            return '#94a3b8'; // muted border
          default:
            return '#cbd5e1'; // default border
        }
      }
    }

    // Fallback
    return baseColor;
  };

  return {
    theme,
    getColorForContrast,
  };
};