import { Tabs, Redirect } from "expo-router";
import { Home, Search, PlusSquare, BarChart3, User } from "lucide-react-native";
import React from "react";
import { useAuth } from "@/src/hooks/useAuth";
import { useTheme } from "@/src/hooks/useTheme";

export default function TabLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const { theme } = useTheme();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          height: 72,
          paddingBottom: 16,
          paddingTop: 8,
          marginBottom: 8,
        },
        tabBarIconStyle: {
          marginBottom: 2,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Home color={color} size={28} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color }) => <Search color={color} size={28} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: "Create",
          tabBarIcon: ({ color }) => <PlusSquare color={color} size={28} />,
        }}
      />
      <Tabs.Screen
        name="rankings"
        options={{
          title: "Rankings",
          tabBarIcon: ({ color }) => <BarChart3 color={color} size={28} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <User color={color} size={28} />,
        }}
      />
      <Tabs.Screen
        name="[id]"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
