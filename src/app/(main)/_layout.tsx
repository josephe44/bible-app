import { Tabs } from 'expo-router';
import { Home, Calendar, BookOpen, Settings } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';

export default function MainLayout() {
  const colors = useTheme();
  
  return (
    <Tabs screenOptions={{ 
      headerShown: false,
      tabBarStyle: { 
        backgroundColor: colors.background, 
        borderTopColor: colors.border,
        elevation: 0,
        shadowOpacity: 0,
      },
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textSecondary,
    }}>
      <Tabs.Screen 
        name="home" 
        options={{
          title: 'Today',
          tabBarIcon: ({ color }) => <Home size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="plan" 
        options={{
          title: 'Plan',
          tabBarIcon: ({ color }) => <Calendar size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="journal" 
        options={{
          title: 'Journal',
          tabBarIcon: ({ color }) => <BookOpen size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="settings" 
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Settings size={24} color={color} />
        }} 
      />
    </Tabs>
  );
}
