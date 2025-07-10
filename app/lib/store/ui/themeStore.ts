import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { BaseState, BaseActions, ThemeState, ThemeActions } from '../types';
import { StorePersistence } from '../persistence';
import { StorePerformanceMonitor } from '../utils';
import { Logger } from '../../utils/logger';

const logger = Logger.getInstance().withContext({
  component: 'theme-store'
});

// Theme configuration
export type ThemeMode = 'light' | 'dark' | 'system';
export type ColorScheme = 'default' | 'blue' | 'green' | 'purple';

interface ThemePreferences {
  mode: ThemeMode;
  colorScheme: ColorScheme;
  fontSize: 'small' | 'medium' | 'large';
  reducedMotion: boolean;
  highContrast: boolean;
}

interface ThemeStoreState extends BaseState, ThemeState {
  preferences: ThemePreferences;
  systemTheme: 'light' | 'dark';
  resolvedTheme: 'light' | 'dark';
  isLoading: boolean;
  error: string | null;
}

interface ThemeStoreActions extends BaseActions, ThemeActions {
  setThemeMode: (mode: ThemeMode) => void;
  setColorScheme: (scheme: ColorScheme) => void;
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  setReducedMotion: (enabled: boolean) => void;
  setHighContrast: (enabled: boolean) => void;
  toggleDarkMode: () => void;
  updateSystemTheme: (theme: 'light' | 'dark') => void;
  resetToDefaults: () => void;
  initializeTheme: (userId?: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

type ThemeStore = ThemeStoreState & ThemeStoreActions;

// Default preferences
const defaultPreferences: ThemePreferences = {
  mode: 'system',
  colorScheme: 'default',
  fontSize: 'medium',
  reducedMotion: false,
  highContrast: false
};

// Persistence and performance monitoring
const persistence = StorePersistence.getInstance();
const performanceMonitor = StorePerformanceMonitor.getInstance();

const persistenceConfig = {
  key: 'theme_preferences',
  version: 1,
  userSpecific: true,
  whitelist: ['preferences']
};

// Helper functions
const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const computeResolvedTheme = (mode: ThemeMode, systemTheme: 'light' | 'dark'): 'light' | 'dark' => {
  if (mode === 'system') return systemTheme;
  return mode;
};

const applyThemeToDocument = (theme: 'light' | 'dark', preferences: ThemePreferences) => {
  if (typeof document === 'undefined') return;
  
  const root = document.documentElement;
  
  // Apply theme mode
  root.classList.remove('light', 'dark');
  root.classList.add(theme);
  
  // Apply other preferences
  root.setAttribute('data-color-scheme', preferences.colorScheme);
  root.setAttribute('data-font-size', preferences.fontSize);
  
  // Apply accessibility settings
  root.classList.toggle('reduce-motion', preferences.reducedMotion);
  root.classList.toggle('high-contrast', preferences.highContrast);
  
  logger.info('Theme applied to document', undefined, {
    theme,
    colorScheme: preferences.colorScheme,
    fontSize: preferences.fontSize,
    reducedMotion: preferences.reducedMotion,
    highContrast: preferences.highContrast
  });
};

export const useThemeStore = create<ThemeStore>()(
  subscribeWithSelector(
    (set, get) => ({
      // Base state
      isInitialized: false,
      lastUpdated: Date.now(),
      
      // Theme state
      theme: 'light',
      preferences: defaultPreferences,
      systemTheme: getSystemTheme(),
      resolvedTheme: computeResolvedTheme(defaultPreferences.mode, getSystemTheme()),
      isLoading: false,
      error: null,
      
      // Base actions
      initialize: () => {
        get().initializeTheme();
      },
      
      reset: () => {
        get().resetToDefaults();
      },
      
      // Theme actions
      setTheme: (theme: 'light' | 'dark') => {
        const mode: ThemeMode = theme;
        get().setThemeMode(mode);
      },
      
      toggleTheme: () => {
        get().toggleDarkMode();
      },
      
      setLoading: (loading: boolean) => {
        set({ isLoading: loading, lastUpdated: Date.now() });
      },
      
      setError: (error: string | null) => {
        set({ error, lastUpdated: Date.now() });
      },
      
      clearError: () => {
        set({ error: null, lastUpdated: Date.now() });
      },
      
      setThemeMode: (mode: ThemeMode) => {
        const endMeasure = performanceMonitor.startMeasure('theme.setThemeMode');
        
        try {
          const state = get();
          const newResolvedTheme = computeResolvedTheme(mode, state.systemTheme);
          const newPreferences = { ...state.preferences, mode };
          
          set({
            preferences: newPreferences,
            resolvedTheme: newResolvedTheme,
            theme: newResolvedTheme,
            lastUpdated: Date.now(),
            error: null
          });
          
          // Apply theme to document
          applyThemeToDocument(newResolvedTheme, newPreferences);
          
          // Persist preferences
          persistence.persistState(persistenceConfig, { preferences: newPreferences });
          
          logger.info('Theme mode updated', undefined, {
            mode,
            resolvedTheme: newResolvedTheme,
            systemTheme: state.systemTheme
          });
          
        } catch (error) {
          logger.error('Failed to set theme mode', error, undefined, { mode });
          set({ error: 'Failed to update theme mode' });
        } finally {
          endMeasure();
        }
      },
      
      setColorScheme: (scheme: ColorScheme) => {
        const endMeasure = performanceMonitor.startMeasure('theme.setColorScheme');
        
        try {
          const state = get();
          const newPreferences = { ...state.preferences, colorScheme: scheme };
          
          set({
            preferences: newPreferences,
            lastUpdated: Date.now(),
            error: null
          });
          
          // Apply theme to document
          applyThemeToDocument(state.resolvedTheme, newPreferences);
          
          // Persist preferences
          persistence.persistState(persistenceConfig, { preferences: newPreferences });
          
          logger.info('Color scheme updated', undefined, { scheme });
          
        } catch (error) {
          logger.error('Failed to set color scheme', error, undefined, { scheme });
          set({ error: 'Failed to update color scheme' });
        } finally {
          endMeasure();
        }
      },
      
      setFontSize: (size: 'small' | 'medium' | 'large') => {
        const endMeasure = performanceMonitor.startMeasure('theme.setFontSize');
        
        try {
          const state = get();
          const newPreferences = { ...state.preferences, fontSize: size };
          
          set({
            preferences: newPreferences,
            lastUpdated: Date.now(),
            error: null
          });
          
          // Apply theme to document
          applyThemeToDocument(state.resolvedTheme, newPreferences);
          
          // Persist preferences
          persistence.persistState(persistenceConfig, { preferences: newPreferences });
          
          logger.info('Font size updated', undefined, { size });
          
        } catch (error) {
          logger.error('Failed to set font size', error, undefined, { size });
          set({ error: 'Failed to update font size' });
        } finally {
          endMeasure();
        }
      },
      
      setReducedMotion: (enabled: boolean) => {
        const endMeasure = performanceMonitor.startMeasure('theme.setReducedMotion');
        
        try {
          const state = get();
          const newPreferences = { ...state.preferences, reducedMotion: enabled };
          
          set({
            preferences: newPreferences,
            lastUpdated: Date.now(),
            error: null
          });
          
          // Apply theme to document
          applyThemeToDocument(state.resolvedTheme, newPreferences);
          
          // Persist preferences
          persistence.persistState(persistenceConfig, { preferences: newPreferences });
          
          logger.info('Reduced motion updated', undefined, { enabled });
          
        } catch (error) {
          logger.error('Failed to set reduced motion', error, undefined, { enabled });
          set({ error: 'Failed to update reduced motion' });
        } finally {
          endMeasure();
        }
      },
      
      setHighContrast: (enabled: boolean) => {
        const endMeasure = performanceMonitor.startMeasure('theme.setHighContrast');
        
        try {
          const state = get();
          const newPreferences = { ...state.preferences, highContrast: enabled };
          
          set({
            preferences: newPreferences,
            lastUpdated: Date.now(),
            error: null
          });
          
          // Apply theme to document
          applyThemeToDocument(state.resolvedTheme, newPreferences);
          
          // Persist preferences
          persistence.persistState(persistenceConfig, { preferences: newPreferences });
          
          logger.info('High contrast updated', undefined, { enabled });
          
        } catch (error) {
          logger.error('Failed to set high contrast', error, undefined, { enabled });
          set({ error: 'Failed to update high contrast' });
        } finally {
          endMeasure();
        }
      },
      
      toggleDarkMode: () => {
        const state = get();
        const newMode: ThemeMode = state.resolvedTheme === 'dark' ? 'light' : 'dark';
        get().setThemeMode(newMode);
      },
      
      updateSystemTheme: (theme: 'light' | 'dark') => {
        const state = get();
        const newResolvedTheme = computeResolvedTheme(state.preferences.mode, theme);
        
        set({
          systemTheme: theme,
          resolvedTheme: newResolvedTheme,
          theme: newResolvedTheme,
          lastUpdated: Date.now()
        });
        
        // Apply theme to document if using system theme
        if (state.preferences.mode === 'system') {
          applyThemeToDocument(newResolvedTheme, state.preferences);
        }
        
        logger.info('System theme updated', undefined, {
          systemTheme: theme,
          resolvedTheme: newResolvedTheme,
          mode: state.preferences.mode
        });
      },
      
      resetToDefaults: () => {
        const endMeasure = performanceMonitor.startMeasure('theme.resetToDefaults');
        
        try {
          const systemTheme = getSystemTheme();
          const resolvedTheme = computeResolvedTheme(defaultPreferences.mode, systemTheme);
          
          set({
            preferences: defaultPreferences,
            systemTheme,
            resolvedTheme,
            theme: resolvedTheme,
            lastUpdated: Date.now(),
            error: null
          });
          
          // Apply theme to document
          applyThemeToDocument(resolvedTheme, defaultPreferences);
          
          // Clear persisted preferences
          persistence.clearPersistedState(persistenceConfig);
          
          logger.info('Theme reset to defaults', undefined, {
            resolvedTheme,
            systemTheme
          });
          
        } catch (error) {
          logger.error('Failed to reset theme to defaults', error);
          set({ error: 'Failed to reset theme' });
        } finally {
          endMeasure();
        }
      },
      
      initializeTheme: (userId?: string) => {
        const endMeasure = performanceMonitor.startMeasure('theme.initializeTheme');
        
        try {
          logger.info('Initializing theme store', undefined, { userId });
          
          // Load persisted preferences
          const persistedData = persistence.getPersistedState<{ preferences: ThemePreferences }>(
            persistenceConfig, 
            userId
          );
          const preferences = persistedData?.preferences || defaultPreferences;
          
          // Get current system theme
          const systemTheme = getSystemTheme();
          const resolvedTheme = computeResolvedTheme(preferences.mode, systemTheme);
          
          set({
            preferences,
            systemTheme,
            resolvedTheme,
            theme: resolvedTheme,
            isInitialized: true,
            lastUpdated: Date.now(),
            error: null
          });
          
          // Apply theme to document
          applyThemeToDocument(resolvedTheme, preferences);
          
          // Set up system theme listener
          if (typeof window !== 'undefined') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleSystemThemeChange = (e: MediaQueryListEvent) => {
              get().updateSystemTheme(e.matches ? 'dark' : 'light');
            };
            
            mediaQuery.addEventListener('change', handleSystemThemeChange);
            
            // Store cleanup function
            (window as any).__themeCleanup = () => {
              mediaQuery.removeEventListener('change', handleSystemThemeChange);
            };
          }
          
          logger.info('Theme store initialized', undefined, {
            userId,
            preferences,
            systemTheme,
            resolvedTheme,
            hadPersistedData: !!persistedData
          });
          
        } catch (error) {
          logger.error('Failed to initialize theme store', error, undefined, { userId });
          set({ error: 'Failed to initialize theme' });
        } finally {
          endMeasure();
        }
      }
    })
  )
);

// Export default
export default useThemeStore; 