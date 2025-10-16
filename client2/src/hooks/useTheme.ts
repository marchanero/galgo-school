// hooks/useTheme.ts
import { useContext } from 'react';
import { ThemeContext } from '../contexts/themeContext';
import type { ThemeContextType } from '../types';

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};