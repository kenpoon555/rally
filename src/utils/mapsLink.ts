import { Linking, Platform } from 'react-native';

export function buildMapsUrl(
  latitude: number,
  longitude: number,
  label?: string
): string {
  const q = encodeURIComponent(label?.trim() || `${latitude},${longitude}`);
  if (Platform.OS === 'ios') {
    return `https://maps.apple.com/?ll=${latitude},${longitude}&q=${q}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}

export async function openMaps(
  latitude: number,
  longitude: number,
  label?: string
): Promise<void> {
  const url = buildMapsUrl(latitude, longitude, label);
  await Linking.openURL(url);
}
