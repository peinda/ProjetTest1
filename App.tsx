import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, AppState } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { initDatabase } from './src/db/database';
import { seedSampleDataIfEmpty } from './src/db/seed';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import LockScreen from './src/screens/LockScreen';
import RootNavigator from './src/navigation/RootNavigator';
import { colors } from './src/theme/theme';

function Gate() {
  const { loading, isUnlocked, lock } = useAuth();

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background') lock();
    });
    return () => sub.remove();
  }, [lock]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return isUnlocked ? <RootNavigator /> : <LockScreen />;
}

export default function App() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    initDatabase()
      .then(() => (__DEV__ ? seedSampleDataIfEmpty() : undefined))
      .then(() => setDbReady(true));
  }, []);

  if (!dbReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Gate />
      </AuthProvider>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
