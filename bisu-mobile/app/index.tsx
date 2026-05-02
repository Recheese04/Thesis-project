import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Dimensions, Animated, FlatList, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { CalendarDays, BellRing, ShieldCheck, ChevronRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Welcome to\nTAPasok',
    description: 'The centralized platform for BISU Candijay Campus. Manage student attendance, events, and records seamlessly.',
    icon: <CalendarDays size={72} color="#fff" strokeWidth={1.5} />,
    image: require('../assets/images/bisu_day.jpg'),
    badge: 'NEW PLATFORM'
  },
  {
    id: '2',
    title: 'Stay entirely\nin the Loop',
    description: 'Get real-time announcements directly from your student organizations and never miss an important update again.',
    icon: <BellRing size={72} color="#fff" strokeWidth={1.5} />,
    image: require('../assets/images/intrams.jpg'),
    badge: 'LIVE UPDATES'
  },
  {
    id: '3',
    title: 'Attendance Tracking Built for You.',
    description: 'A seamless, secure, and fast way to check into events, completely integrated with BISU Candijay systems.',
    icon: <ShieldCheck size={72} color="#fff" strokeWidth={1.5} />,
    image: require('../assets/images/valentines.jpg'),
    badge: 'LIVE AT BISU CANDIJAY',
    stats: true
  }
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef<FlatList>(null);

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const scrollToNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      router.replace('/login');
    }
  };

  const renderSlide = ({ item }: { item: typeof SLIDES[0] }) => {
    return (
      <View style={{ width, flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        
        {/* Animated Icon Container */}
        <View style={{ 
          width: 160, height: 160, 
          borderRadius: 80,
          backgroundColor: 'rgba(255,255,255,0.1)',
          alignItems: 'center', justifyContent: 'center',
          marginBottom: 48,
          borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)'
        }}>
          {item.icon}
        </View>

        {/* Text Content */}
        <View style={{ width: '100%', alignItems: 'flex-start' }}>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 16 }}>
            <Text style={{ color: '#bae6fd', fontSize: 10, fontWeight: '900', letterSpacing: 1 }}>
              {item.badge}
            </Text>
          </View>
          
          <Text style={{ fontSize: 34, fontWeight: '900', color: '#fff', letterSpacing: -1, lineHeight: 38, marginBottom: 16 }}>
            {item.title.split('TAPasok').map((part, i, arr) => (
              <React.Fragment key={'t' + i.toString()}>
                {part}
                {i < arr.length - 1 && <Text style={{ color: '#facc15' }}>TAP</Text>}
                {i < arr.length - 1 && <Text>asok</Text>}
              </React.Fragment>
            ))}
          </Text>
          
          <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)', lineHeight: 24, fontWeight: '500' }}>
            {item.description}
          </Text>

          {item.stats && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 32 }}>
              <View>
                <Text style={{ fontSize: 22, fontWeight: '900', color: '#fff' }}>500+</Text>
                <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginTop: 2 }}>Students</Text>
              </View>
              <View>
                <Text style={{ fontSize: 22, fontWeight: '900', color: '#fff' }}>40+</Text>
                <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginTop: 2 }}>Events</Text>
              </View>
              <View>
                <Text style={{ fontSize: 22, fontWeight: '900', color: '#fff' }}>98%</Text>
                <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginTop: 2 }}>Accuracy</Text>
              </View>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#1e1b4b' }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Background Crossfading Images */}
      {SLIDES.map((slide, i) => {
        const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
        const opacity = scrollX.interpolate({ inputRange, outputRange: [0, 1, 0], extrapolate: 'clamp' });
        return (
          <Animated.Image 
            key={slide.id}
            source={slide.image} 
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', opacity }}
            resizeMode="cover"
          />
        );
      })}

      {/* Dark Overlay Gradient to ensure readability */}
      <LinearGradient 
        colors={['rgba(15, 23, 42, 0.7)', 'rgba(15, 23, 42, 0.98)']} 
        style={{ position: 'absolute', width: '100%', height: '100%' }}
      />
      
      {/* Abstract floating shapes behind */}
      <View style={{ position: 'absolute', top: -100, right: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(255,255,255,0.03)' }} />
      <View style={{ position: 'absolute', bottom: 100, left: -100, width: 250, height: 250, borderRadius: 125, backgroundColor: 'rgba(99, 102, 241, 0.08)' }} />

      {/* Main Slider */}
      <View style={{ flex: 1, marginTop: insets.top }}>
        <FlatList
          ref={slidesRef}
          data={SLIDES}
          renderItem={renderSlide}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          bounces={false}
          keyExtractor={(item) => item.id}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
          scrollEventThrottle={32}
          onViewableItemsChanged={viewableItemsChanged}
          viewabilityConfig={viewConfig}
        />
      </View>

      {/* Footer / Controls */}
      <View style={{ paddingHorizontal: 32, paddingBottom: Math.max(insets.bottom + 20, 40), paddingTop: 20 }}>
        
        {/* Pagination Dots */}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', marginBottom: 32 }}>
          {SLIDES.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            const dotWidth = scrollX.interpolate({ inputRange, outputRange: [8, 24, 8], extrapolate: 'clamp' });
            const opacity = scrollX.interpolate({ inputRange, outputRange: [0.3, 1, 0.3], extrapolate: 'clamp' });
            return (
              <Animated.View 
                key={i.toString()} 
                style={{ width: dotWidth, height: 8, borderRadius: 4, backgroundColor: '#fff', opacity, marginRight: 8 }} 
              />
            );
          })}
        </View>

        {/* Next / Get Started Button */}
        <TouchableOpacity 
          onPress={scrollToNext}
          activeOpacity={0.8}
          style={{ width: '100%', height: 64, backgroundColor: '#fff', borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 6, marginBottom: currentIndex !== SLIDES.length - 1 ? 16 : 0 }}
        >
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#1e1b4b', marginRight: 8 }}>
            {currentIndex === SLIDES.length - 1 ? "Get Started" : "Next Step"}
          </Text>
          {currentIndex !== SLIDES.length - 1 && <ChevronRight size={20} color="#1e1b4b" strokeWidth={3} />}
        </TouchableOpacity>

        {/* Skip button for non-final slides */}
        {currentIndex !== SLIDES.length - 1 && (
          <TouchableOpacity onPress={() => router.replace('/login')} style={{ alignItems: 'center', paddingVertical: 8 }}>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '700' }}>Skip for now</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
