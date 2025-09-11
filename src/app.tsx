import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, View, Text, TouchableOpacity, Appearance } from 'react-native';
import Header from './components/Header';
import GeneratorTab from './components/GeneratorTab';
import HistoryTab from './components/HistoryTab';
import AddNumbersTab from './components/AddNumbersTab';
import PrivacyPolicyTab from './components/PrivacyPolicyTab';
import StatisticsTab from './components/StatisticsTab';
import SettingsTab from './components/SettingsTab';
import AppIcon from './components/AppIcon';

import { useAsyncStorage } from './hooks/useAsyncStorage';
import { Tab, INITIAL_DRAWS } from './constants';
import type { Draw } from './types';
import { generateLottoNumbers } from './services/geminiService';
import { ThemeContext } from './context/ThemeContext';
import { themes, fontSizes } from './themes';
import type { ThemeName, FontSize, Theme } from './themes';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.Generator);

  // Persistență pe web via hook (NU AsyncStorage RN)
  const [pastDraws, setPastDraws] = useAsyncStorage<Draw[]>('pastDraws', INITIAL_DRAWS);
  const [generatedHistory, setGeneratedHistory] = useAsyncStorage<Draw[]>('generatedHistory', []);
  const [themeName, setThemeName] = useAsyncStorage<ThemeName>('themeName', 'Default Blue');
  const [fontSize, setFontSize] = useAsyncStorage<FontSize>('fontSize', 'Medium');
  const [ageConfirmed, setAgeConfirmed] = useAsyncStorage<boolean>('ageConfirmed', false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latestGenerated, setLatestGenerated] = useState<Draw | null>(null);

  const systemTheme = Appearance.getColorScheme() || 'light';
  const theme: Theme = useMemo(() => ({
    ...themes[themeName],
    fontSizes: fontSizes[fontSize]
  }), [themeName, fontSize]);

  // URL ?tab=…
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam) {
      const t = tabParam.toLowerCase();
      if (t === 'generator') setActiveTab(Tab.Generator);
      else if (t === 'istoric') setActiveTab(Tab.Istoric);
    }
  }, []);

  // meta theme-color & body bg
  useEffect(() => {
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.colors.background);
    document.body.style.backgroundColor = theme.colors.background;
  }, [theme]);

  const handleGenerateNumbers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setLatestGenerated(null);
    try {
      const newNumbers = await generateLottoNumbers(pastDraws);
      if (newNumbers.length === 6) {
        const sorted = [...newNumbers].sort((a, b) => a - b);
        setLatestGenerated(sorted);
        setGeneratedHistory(prev => [sorted, ...prev]);
      } else {
        throw new Error('AI-ul a returnat un format nevalid.');
      }
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'A apărut o eroare necunoscută.');
    } finally {
      setIsLoading(false);
    }
  }, [pastDraws, setGeneratedHistory]);

  const addPastDraw = (draw: Draw) => setPastDraws(prev => [draw, ...prev]);

  const renderContent = () => {
    switch (activeTab) {
      case Tab.Generator:
        return (
          <GeneratorTab
            onGenerate={handleGenerateNumbers}
            latestNumbers={latestGenerated}
            isLoading={isLoading}
            error={error}
          />
        );
      case Tab.Istoric:
        return <HistoryTab history={generatedHistory} />;
      case Tab.Statistici:
        return <StatisticsTab pastDraws={pastDraws} />;
      case Tab.Adaugare:
        return <AddNumbersTab pastDraws={pastDraws} onAddDraw={addPastDraw} />;
      case Tab.Setari:
        return <SettingsTab />;
      case Tab.Confidentialitate:
        return <PrivacyPolicyTab />;
      default:
        return null;
    }
  };

  const styles = createThemedStyles(theme);

  return (
    <ThemeContext.Provider value={{ theme, setThemeName, setFontSize }}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.background} />
        <View style={styles.container}>
          <View style={styles.headerContainer}>
            <AppIcon />
            <Text style={styles.title}>Generator AI Loto</Text>
            <Text style={styles.subtitle}>Analizează trecutul, prezice viitorul.</Text>
          </View>

          {/* (opțional) age gate simplu */}
          {!ageConfirmed && (
            <View style={{ backgroundColor: '#0006', padding: 16, borderRadius: 12, marginBottom: 16 }}>
              <Text style={{ color: '#fff', marginBottom: 8, fontWeight: 'bold' }}>Interzis minorilor (18+)</Text>
              <TouchableOpacity onPress={() => setAgeConfirmed(true)}>
                <Text style={{ color: theme.colors.primary, textDecorationLine: 'underline' }}>Confirm că am peste 18 ani</Text>
              </TouchableOpacity>
            </View>
          )}

          <Header activeTab={activeTab} setActiveTab={setActiveTab} />
          <View style={styles.mainContent}>{renderContent()}</View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>&copy; {new Date().getFullYear()} Generator Loto AI. Doar pentru divertisment.</Text>
            <Text style={styles.footerText}>Jucați responsabil. Interzis minorilor (18+).</Text>
            <View style={styles.footerLinks}>
              <TouchableOpacity onPress={() => setActiveTab(Tab.Confidentialitate)}>
                <Text style={styles.footerLink}>Politică de Confidențialitate</Text>
              </TouchableOpacity>
              <Text style={styles.footerSeparator}>|</Text>
              <TouchableOpacity onPress={() => window.open('https://jocresponsabil.ro', '_blank')}>
                <Text style={styles.footerLink}>Joc Responsabil</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </ThemeContext.Provider>
  );
};

const createThemedStyles = (theme: Theme) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.colors.background },
    container: { flex: 1, padding: 16, backgroundColor: theme.colors.background },
    headerContainer: { alignItems: 'center', marginBottom: 24 },
    title: {
      fontSize: theme.fontSizes.xxlarge,
      fontWeight: 'bold',
      color: theme.colors.primary,
      textShadowColor: 'rgba(0, 0, 0, 0.25)',
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 2,
      marginTop: 12
    },
    subtitle: { fontSize: theme.fontSizes.large, color: theme.colors.secondary, marginTop: 8 },
    mainContent: { marginTop: 24, backgroundColor: theme.colors.surface, borderRadius: 16, padding: 16, flex: 1 },
    footer: { alignItems: 'center', marginTop: 16, gap: 4, paddingHorizontal: 8 },
    footerText: { fontSize: theme.fontSizes.small, color: theme.colors.subtleText, textAlign: 'center' },
    footerLinks: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
    footerLink: { fontSize: theme.fontSizes.small, color: theme.colors.primary, textDecorationLine: 'underline' },
    footerSeparator: { fontSize: theme.fontSizes.small, color: theme.colors.subtleText, marginHorizontal: 8 }
  });

export default App;
