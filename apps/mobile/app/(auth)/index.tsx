import { Redirect } from 'expo-router';
import { useAuth } from '@/lib/auth/auth-provider';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '@/styles';

export default function AuthIndex() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (session) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
