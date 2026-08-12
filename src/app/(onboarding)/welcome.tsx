import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { BookOpen, Sun, TrendingUp } from 'lucide-react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue, useAnimatedStyle, interpolate, Extrapolation } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { TextStyle, FontFamily, FontSize } from '@/constants/typography';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Daily Bread',
    description: 'Start your day with a curated Bible verse designed to inspire and guide you.',
    Icon: Sun,
  },
  {
    id: '2',
    title: 'Grow in Faith',
    description: 'Read a short devotional lesson and reflect on its meaning for your life.',
    Icon: BookOpen,
  },
  {
    id: '3',
    title: 'Track Your Journey',
    description: 'Build a habit of daily reading. Set reminders and watch your streak grow.',
    Icon: TrendingUp,
  },
];

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

export default function WelcomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const scrollX = useSharedValue(0);
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems[0]) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      router.push('/(onboarding)/setup');
    }
  };

  const renderItem = ({ item, index }: { item: typeof SLIDES[0]; index: number }) => {
    return (
      <View style={[styles.slide, { width, backgroundColor: theme.background }]}>
        <View style={styles.imageContainer}>
          <View style={[styles.iconWrapper, { backgroundColor: theme.primary + '15' }]}>
            <item.Icon size={100} color={theme.primary} strokeWidth={1.5} />
          </View>
        </View>
        <View style={styles.textContainer}>
          <Text style={[TextStyle.heading1, { color: theme.textPrimary, textAlign: 'center', marginBottom: 16 }]}>
            {item.title}
          </Text>
          <Text style={[TextStyle.lessonBody, { color: theme.textSecondary, textAlign: 'center' }]}>
            {item.description}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <AnimatedFlatList
        ref={flatListRef as any}
        data={SLIDES}
        renderItem={renderItem as any}
        keyExtractor={(item: any) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={scrollHandler}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        scrollEventThrottle={16}
      />

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {SLIDES.map((_, index) => {
            const animatedStyle = useAnimatedStyle(() => {
              const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
              const dotWidth = interpolate(scrollX.value, inputRange, [8, 24, 8], Extrapolation.CLAMP);
              const opacity = interpolate(scrollX.value, inputRange, [0.3, 1, 0.3], Extrapolation.CLAMP);
              return { width: dotWidth, opacity };
            });

            return (
              <Animated.View
                key={index.toString()}
                style={[styles.dot, { backgroundColor: theme.primary }, animatedStyle]}
              />
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primary }]}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={[{ fontFamily: FontFamily.semiBold, fontSize: FontSize.md }, { color: theme.surface }]}>
            {currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  imageContainer: {
    flex: 0.6,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  iconWrapper: {
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: width * 0.25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 0.4,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  button: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
});
