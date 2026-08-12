import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import type { View } from 'react-native';

export async function shareVerseCard(viewRef: React.RefObject<View | null>) {
  try {
    if (!viewRef.current) return;
    
    // Capture the View as a local URI
    const uri = await captureRef(viewRef, {
      format: 'png',
      quality: 1,
    });
    
    // Check if sharing is available
    const isAvailable = await Sharing.isAvailableAsync();
    
    if (isAvailable) {
      await Sharing.shareAsync(uri, {
        dialogTitle: 'Share DailyWord',
        mimeType: 'image/png',
      });
    } else {
      console.warn("Sharing is not available on this platform.");
    }
  } catch (error) {
    console.error("Failed to share verse card:", error);
  }
}
