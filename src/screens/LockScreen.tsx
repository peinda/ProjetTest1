import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, fontSize, radius } from '../theme/theme';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

export default function LockScreen() {
  const { hasPin, setPin, verifyPin, unlockWithBiometrics, biometricAvailable } = useAuth();
  const [mode, setMode] = useState<'enter' | 'create' | 'confirm'>(hasPin ? 'enter' : 'create');
  const [pin, setPinValue] = useState('');
  const [firstPin, setFirstPin] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setMode(hasPin ? 'enter' : 'create');
  }, [hasPin]);

  useEffect(() => {
    if (mode === 'enter' && biometricAvailable) {
      unlockWithBiometrics();
    }
  }, [mode]);

  const title =
    mode === 'create' ? 'Créez votre code PIN' : mode === 'confirm' ? 'Confirmez le code PIN' : 'Entrez votre code PIN';

  const handleKey = async (key: string) => {
    if (key === '') return;
    setError('');
    if (key === 'del') {
      setPinValue((p) => p.slice(0, -1));
      return;
    }
    const next = (pin + key).slice(0, 4);
    setPinValue(next);
    if (next.length === 4) {
      if (mode === 'create') {
        setFirstPin(next);
        setMode('confirm');
        setPinValue('');
      } else if (mode === 'confirm') {
        if (next === firstPin) {
          await setPin(next);
        } else {
          setError('Les codes ne correspondent pas. Réessayez.');
          setMode('create');
          setFirstPin('');
        }
        setPinValue('');
      } else {
        const ok = await verifyPin(next);
        if (!ok) {
          setError('Code incorrect');
        }
        setPinValue('');
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>Baba Robe & Diverss</Text>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.dots}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[styles.dot, pin.length > i && styles.dotFilled]} />
        ))}
      </View>
      {!!error && <Text style={styles.error}>{error}</Text>}
      <View style={styles.keypad}>
        {KEYS.map((key, idx) => (
          <Pressable
            key={idx}
            disabled={key === ''}
            onPress={() => handleKey(key)}
            style={({ pressed }) => [
              styles.key,
              { opacity: key === '' ? 0 : pressed ? 0.6 : 1 },
            ]}
          >
            <Text style={styles.keyLabel}>{key === 'del' ? '⌫' : key}</Text>
          </Pressable>
        ))}
      </View>
      {mode === 'enter' && biometricAvailable && (
        <Pressable onPress={unlockWithBiometrics} style={styles.bioButton}>
          <Text style={styles.bioLabel}>Utiliser Face ID</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  brand: {
    color: '#FFFFFF',
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginBottom: spacing.xl,
  },
  title: {
    color: '#FFFFFF',
    fontSize: fontSize.md,
    marginBottom: spacing.lg,
  },
  dots: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  dotFilled: {
    backgroundColor: '#FFFFFF',
  },
  error: {
    color: colors.accent,
    marginBottom: spacing.md,
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 260,
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  key: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    margin: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  keyLabel: {
    color: '#FFFFFF',
    fontSize: fontSize.xl,
    fontWeight: '600',
  },
  bioButton: {
    marginTop: spacing.xl,
    padding: spacing.sm,
  },
  bioLabel: {
    color: colors.accent,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
});
