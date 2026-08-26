import { Alert, Platform } from 'react-native';

type AlertButton = {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
};

/**
 * Drop-in replacement for RN's `Alert.alert` — react-native-web's Alert is a
 * no-op, which silently swallows every validation/success/confirm message
 * (and the onPress of confirm dialogs) when the app runs on web.
 */
export function showAlert(title: string, message?: string, buttons?: AlertButton[]): void {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons);
    return;
  }

  const list = buttons && buttons.length > 0 ? buttons : [{ text: 'OK' } as AlertButton];
  const confirmButton = list.find((b) => b.style !== 'cancel') ?? list[0];
  const text = message ? `${title}\n\n${message}` : title;

  if (list.length > 1) {
    if (window.confirm(text)) confirmButton.onPress?.();
  } else {
    window.alert(text);
    confirmButton.onPress?.();
  }
}
