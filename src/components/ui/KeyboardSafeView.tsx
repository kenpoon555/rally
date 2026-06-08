import React, { useEffect, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollViewProps,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Extra offset below the status bar / header (iOS). */
  keyboardVerticalOffset?: number;
};

/**
 * Keeps focused inputs visible when the software keyboard opens.
 * Android manifest uses adjustResize; padding behavior still helps nested layouts.
 */
export function KeyboardSafeView({
  children,
  style,
  keyboardVerticalOffset,
}: Props) {
  const insets = useSafeAreaInsets();
  const offset =
    keyboardVerticalOffset ?? (Platform.OS === 'ios' ? insets.top : 0);

  return (
    <KeyboardAvoidingView
      style={[{ flex: 1 }, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      keyboardVerticalOffset={offset}
    >
      {children}
    </KeyboardAvoidingView>
  );
}

/** ScrollView defaults for screens with text fields. */
export const keyboardAwareScrollProps: Pick<
  ScrollViewProps,
  'keyboardShouldPersistTaps' | 'keyboardDismissMode' | 'automaticallyAdjustKeyboardInsets'
> = {
  keyboardShouldPersistTaps: 'handled',
  keyboardDismissMode: 'on-drag',
  automaticallyAdjustKeyboardInsets: true,
};

export function useKeyboardVisible(): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, () => setVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return visible;
}

/** Android keyboard height (0 on iOS — rely on KeyboardAvoidingView there). */
export function useKeyboardInset(): number {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (event) => {
      if (Platform.OS === 'android') {
        setInset(event.endCoordinates.height);
      }
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      if (Platform.OS === 'android') {
        setInset(0);
      }
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return inset;
}

/** Bottom padding for chat-style composers above the software keyboard. */
export function useComposerBottomPadding(extra = 8): number {
  const insets = useSafeAreaInsets();
  const keyboardInset = useKeyboardInset();
  if (Platform.OS === 'android' && keyboardInset > 0) {
    return Math.max(extra, keyboardInset - insets.bottom + extra);
  }
  return Math.max(insets.bottom, extra);
}

type BottomSheetProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Bottom-aligned modal content that shifts above the keyboard. */
export function KeyboardSafeBottomSheet({ children, style }: BottomSheetProps) {
  return (
    <KeyboardAvoidingView
      style={[{ flex: 1, justifyContent: 'flex-end' }, style]}
      behavior="padding"
    >
      {children}
    </KeyboardAvoidingView>
  );
}
