import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Settings } from '../types';

interface SettingsContextType {
  settings: Settings | null;
  loading: boolean;
  updateSettings: (updates: Partial<Settings>) => Promise<void>;
  currency: string;
  theme: 'dark' | 'light';
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const defaultSettings: Settings = {
  id: 'default',
  currency: 'USD',
  theme: 'dark',
  updated_at: new Date().toISOString(),
};

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .maybeSingle();

      if (error) {
        // Fall back to default settings silently
        setSettings(defaultSettings);
        return;
      }

      if (!data) {
        // Try to create default settings
        try {
          const { data: newSettings, error: insertError } = await supabase
            .from('settings')
            .insert({ currency: 'USD', theme: 'dark' })
            .select()
            .single();

          if (insertError) {
            // Fall back to default settings silently
            setSettings(defaultSettings);
          } else {
            setSettings(newSettings);
          }
        } catch {
          // Fall back to default settings silently
          setSettings(defaultSettings);
        }
      } else {
        setSettings(data);
      }
    } catch {
      // Fall back to default settings silently
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = useCallback(async (updates: Partial<Settings>) => {
    if (!settings || settings.id === 'default') {
      // Update local settings if no backend available
      setSettings(prev => prev ? { ...prev, ...updates } : null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('settings')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', settings.id)
        .select()
        .single();

      if (error) throw error;
      setSettings(data);
    } catch {
      // Update locally if backend fails
      setSettings(prev => prev ? { ...prev, ...updates } : null);
    }
  }, [settings]);

  useEffect(() => {
    if (settings?.theme) {
      document.documentElement.classList.toggle('dark', settings.theme === 'dark');
    }
  }, [settings?.theme]);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        updateSettings,
        currency: settings?.currency || 'USD',
        theme: settings?.theme || 'dark',
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
