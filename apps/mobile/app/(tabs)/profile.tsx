import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth/auth-provider';
import { getCurrentUser, UserProfile } from '@/lib/services/users';
import { Colors, Spacing, Layout, BorderRadius, FontSize, FontWeight } from '@/styles';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

interface SettingsItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
  showChevron?: boolean;
}

function SettingsItem({ icon, label, onPress, danger, showChevron = true }: SettingsItemProps) {
  return (
    <TouchableOpacity 
      style={styles.settingsItem} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.settingsIcon, danger && styles.settingsIconDanger]}>
        <Ionicons name={icon} size={22} color={danger ? Colors.destructive : Colors.secondary} />
      </View>
      <Text style={[styles.settingsLabel, danger && styles.settingsLabelDanger]}>
        {label}
      </Text>
      {showChevron && <Ionicons name="chevron-forward" size={20} color={Colors.secondary} />}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    setLoading(true);
    const data = await getCurrentUser();
    setProfile(data);
    setLoading(false);
  };

  // Refresh profile when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  const handleEditProfile = () => {
    router.push('/edit-profile');
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const displayName = profile?.fullname || profile?.username || 'User';
  const avatarUrl = profile?.avatar_url;

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={handleEditProfile}
          activeOpacity={0.8}
        >
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
            </View>
          )}
          <View style={styles.editAvatarBadge}>
            <Ionicons name="camera" size={16} color={Colors.background} />
          </View>
        </TouchableOpacity>
        <Text style={styles.name}>{displayName}</Text>
        {profile?.username && (
          <Text style={styles.username}>@{profile.username}</Text>
        )}
        {profile?.bio && (
          <Text style={styles.bio}>{profile.bio}</Text>
        )}
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      {/* Settings Sections */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.settingsGroup}>
          <SettingsItem icon="person-outline" label="Edit Profile" onPress={handleEditProfile} />
          <View style={styles.settingsSeparator} />
          <SettingsItem icon="notifications-outline" label="Notifications" onPress={() => {
            Alert.alert('Coming Soon', 'Notification settings will be available soon.');
          }} />
          <View style={styles.settingsSeparator} />
          <SettingsItem icon="lock-closed-outline" label="Privacy & Security" onPress={() => {
            Alert.alert('Coming Soon', 'Privacy settings will be available soon.');
          }} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.settingsGroup}>
          <SettingsItem icon="text-outline" label="Font Size" onPress={() => {
            Alert.alert('Coming Soon', 'Font size settings will be available soon.');
          }} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <View style={styles.settingsGroup}>
          <SettingsItem icon="help-circle-outline" label="Help Center" onPress={() => {
            Alert.alert('Help Center', 'For support, please contact us at support@truechat.app');
          }} />
          <View style={styles.settingsSeparator} />
          <SettingsItem icon="chatbox-ellipses-outline" label="Send Feedback" onPress={() => {
            Alert.alert('Send Feedback', 'We\'d love to hear from you! Email us at feedback@truechat.app');
          }} />
          <View style={styles.settingsSeparator} />
          <SettingsItem icon="information-circle-outline" label="About" onPress={() => {
            Alert.alert('About TrueChat', 'TrueChat v1.0.0\n\nA minimal messaging app.');
          }} />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.settingsGroup}>
          <SettingsItem
            icon="log-out-outline"
            label="Sign Out"
            onPress={handleSignOut}
            danger
            showChevron={false}
          />
        </View>
      </View>

      {/* Version */}
      <Text style={styles.version}>TrueChat v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Layout.screenPadding,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  avatarPlaceholder: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.primary,
    fontSize: FontSize.display,
    fontWeight: FontWeight.semibold,
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    color: Colors.textPrimary,
    fontSize: FontSize.large,
    fontWeight: FontWeight.semibold,
    marginTop: Spacing.lg,
  },
  username: {
    color: Colors.textSecondary,
    fontSize: FontSize.normal,
    marginTop: Spacing.xs,
  },
  bio: {
    color: Colors.textSecondary,
    fontSize: FontSize.small,
    marginTop: Spacing.sm,
    textAlign: 'center',
    paddingHorizontal: Layout.screenPadding,
  },
  email: {
    color: Colors.textSecondary,
    fontSize: FontSize.small,
    marginTop: Spacing.sm,
  },
  section: {
    marginTop: Layout.screenPadding,
  },
  sectionTitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.xsmall,
    textTransform: 'uppercase',
    paddingHorizontal: Layout.screenPadding,
    marginBottom: Spacing.sm,
    letterSpacing: 1,
  },
  settingsGroup: {
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: Spacing.lg,
  },
  settingsIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.small,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  settingsIconDanger: {
    borderColor: Colors.destructive,
  },
  settingsLabel: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.normal,
  },
  settingsLabelDanger: {
    color: Colors.destructive,
  },
  settingsSeparator: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 76,
  },
  version: {
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: FontSize.xsmall,
    marginVertical: Spacing.xxxl,
  },
});
