import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import * as LocalAuthentication from 'expo-local-authentication';

const PIN_KEY = 'boutique_pin_hash';

interface AuthContextValue {
  loading: boolean;
  hasPin: boolean;
  isUnlocked: boolean;
  biometricAvailable: boolean;
  setPin: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  unlockWithBiometrics: () => Promise<boolean>;
  lock: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function hashPin(pin: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, pin);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [hasPin, setHasPin] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    (async () => {
      const stored = await SecureStore.getItemAsync(PIN_KEY);
      setHasPin(!!stored);
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(compatible && enrolled);
      setLoading(false);
    })();
  }, []);

  const setPin = async (pin: string) => {
    const hashed = await hashPin(pin);
    await SecureStore.setItemAsync(PIN_KEY, hashed);
    setHasPin(true);
    setIsUnlocked(true);
  };

  const verifyPin = async (pin: string) => {
    const stored = await SecureStore.getItemAsync(PIN_KEY);
    if (!stored) return false;
    const hashed = await hashPin(pin);
    const ok = hashed === stored;
    if (ok) setIsUnlocked(true);
    return ok;
  };

  const unlockWithBiometrics = async () => {
    if (!biometricAvailable) return false;
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Déverrouiller Baba Robe & Diverss',
      cancelLabel: 'Annuler',
      fallbackLabel: 'Utiliser le code PIN',
    });
    if (result.success) setIsUnlocked(true);
    return result.success;
  };

  const lock = () => setIsUnlocked(false);

  return (
    <AuthContext.Provider
      value={{ loading, hasPin, isUnlocked, biometricAvailable, setPin, verifyPin, unlockWithBiometrics, lock }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
