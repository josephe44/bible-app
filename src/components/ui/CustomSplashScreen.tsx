import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { TextStyle } from '@/constants/typography';
import { BookOpen } from 'lucide-react-native';

interface CustomSplashScreenProps {
  onAnimationComplete: () => void;
}

export function CustomSplashScreen({ onAnimationComplete }: CustomSplashScreenProps) {
  const colors = useTheme();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const containerFadeAnim = useRef(new Animated.Value(1)).current;
  const textTranslateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    // 1. Entrance animation: Fade in and scale up the content
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(textTranslateY, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      })
    ]).start(() => {
      // 2. Wait for a short duration, then fade out the whole screen
      setTimeout(() => {
        Animated.timing(containerFadeAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }).start(() => {
          // 3. Animation finished, notify parent
          onAnimationComplete();
        });
      }, 1500); // Wait 1.5 seconds before fading out
    });
  }, []);

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          backgroundColor: colors.background,
          opacity: containerFadeAnim 
        }
      ]}
    >
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: textTranslateY }
            ]
          }
        ]}
      >
        <View style={[styles.iconContainer, { backgroundColor: colors.surface }]}>
          <BookOpen size={48} color={colors.primary} />
        </View>
        <Text style={[TextStyle.heading1, { color: colors.textPrimary, marginTop: 24 }]}>
          Antigravity Bible
        </Text>
        <Text style={[TextStyle.lessonBody, { color: colors.textSecondary, marginTop: 8 }]}>
          Your daily walk
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  }
});
