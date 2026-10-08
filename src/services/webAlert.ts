/**
 * react-native-web's Alert.alert is a no-op, which would silently break confirmations (e.g. "Delete account") in the
 * browser build. Map it to window.alert / window.confirm on web; native platforms keep the real dialogs.
 */
import { Alert, Platform } from 'react-native';

if (Platform.OS === 'web' && typeof window !== 'undefined') {
  Alert.alert = (title, message, buttons) => {
    const text = [title, message].filter(Boolean).join('\n\n');
    if (!buttons || buttons.length <= 1) {
      window.alert(text);
      buttons?.[0]?.onPress?.();
      return;
    }
    const cancel = buttons.find((b) => b.style === 'cancel');
    const action = buttons.find((b) => b.style !== 'cancel') ?? buttons[buttons.length - 1];
    if (window.confirm(text)) action.onPress?.();
    else cancel?.onPress?.();
  };
}
