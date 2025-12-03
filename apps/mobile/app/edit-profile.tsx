import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/lib/auth/auth-provider';
import { getCurrentUser, updateUserProfile, UserProfile } from '@/lib/services/users';
import { uploadAvatar, updateUserAvatar, deleteAvatar, deleteAllUserAvatars } from '@/lib/services/avatar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Layout, BorderRadius, FontSize, FontWeight } from '@/styles';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function EditProfileScreen() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [username, setUsername] = useState('');
  const [fullname, setFullname] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      const data = await getCurrentUser();
      if (data) {
        setProfile(data);
        setUsername(data.username || '');
        setFullname(data.fullname || '');
        setBio(data.bio || '');
        setAvatarUrl(data.avatar_url);
      }
      setLoading(false);
    }
    loadProfile();
  }, []);

  const requestImagePermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need access to your photos to change your avatar.');
      return false;
    }
    return true;
  };

  const handlePickImage = async () => {
    const hasPermission = await requestImagePermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!avatarUrl && !user?.id) return;

    Alert.alert('Remove Avatar', 'Are you sure you want to remove your avatar?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          // Delete all avatars for this user
          if (user?.id) {
            await deleteAllUserAvatars(user.id);
            await updateUserAvatar(user.id, '');
          }
          setAvatarUrl(null);
          setAvatarUri(null);
        },
      },
    ]);
  };

  const handleSave = async () => {
    if (!user?.id || !profile) return;

    setSaving(true);

    try {
      // Upload avatar if changed
      let finalAvatarUrl = avatarUrl;
      if (avatarUri) {
        setUploadingAvatar(true);

        // Upload new avatar (this will automatically delete all old avatars)
        const newAvatarUrl = await uploadAvatar(user.id, avatarUri, 'avatar.jpg');
        if (newAvatarUrl) {
          await updateUserAvatar(user.id, newAvatarUrl);
          finalAvatarUrl = newAvatarUrl;
        }
        setUploadingAvatar(false);
      }

      // Update profile
      const success = await updateUserProfile(user.id, {
        username: username.trim() || null,
        fullname: fullname.trim() || null,
        bio: bio.trim() || null,
        avatar_url: finalAvatarUrl,
      });

      if (success) {
        Alert.alert('Success', 'Profile updated successfully!', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('Error', 'Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'An error occurred while saving your profile.');
    } finally {
      setSaving(false);
      setUploadingAvatar(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const displayAvatar = avatarUri || avatarUrl;
  const displayName = fullname || username || 'User';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Edit Profile',
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.primary,
          headerTitleStyle: { fontWeight: FontWeight.semibold },
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            {displayAvatar ? (
              <Image source={{ uri: displayAvatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
              </View>
            )}
            <View style={styles.avatarButtons}>
              <TouchableOpacity
                style={styles.avatarButton}
                onPress={handlePickImage}
                disabled={uploadingAvatar}
              >
                <Ionicons name="camera-outline" size={20} color={Colors.primary} />
                <Text style={styles.avatarButtonText}>Change</Text>
              </TouchableOpacity>
              {avatarUrl && (
                <TouchableOpacity
                  style={[styles.avatarButton, styles.avatarButtonDanger]}
                  onPress={handleRemoveAvatar}
                  disabled={uploadingAvatar}
                >
                  <Ionicons name="trash-outline" size={20} color={Colors.destructive} />
                  <Text style={[styles.avatarButtonText, styles.avatarButtonTextDanger]}>
                    Remove
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            {uploadingAvatar && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.uploadingText}>Uploading...</Text>
              </View>
            )}
          </View>

          {/* Form Fields */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter username"
                placeholderTextColor={Colors.secondary}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                maxLength={30}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor={Colors.secondary}
                value={fullname}
                onChangeText={setFullname}
                maxLength={50}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Tell us about yourself"
                placeholderTextColor={Colors.secondary}
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={4}
                maxLength={200}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{bio.length}/200</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={user?.email || ''}
                editable={false}
              />
              <Text style={styles.helperText}>Email cannot be changed</Text>
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving || uploadingAvatar}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator color={Colors.background} />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: Layout.screenPadding,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.primary,
    marginBottom: Spacing.lg,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  avatarText: {
    color: Colors.primary,
    fontSize: FontSize.display,
    fontWeight: FontWeight.semibold,
  },
  avatarButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  avatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.small,
  },
  avatarButtonDanger: {
    borderColor: Colors.destructive,
  },
  avatarButtonText: {
    color: Colors.primary,
    fontSize: FontSize.normal,
    fontWeight: FontWeight.medium,
  },
  avatarButtonTextDanger: {
    color: Colors.destructive,
  },
  uploadingOverlay: {
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  uploadingText: {
    color: Colors.textSecondary,
    fontSize: FontSize.small,
    marginTop: Spacing.xs,
  },
  form: {
    gap: Spacing.lg,
    marginBottom: Spacing.xxxl,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: FontSize.small,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.small,
    paddingHorizontal: Layout.inputPadding,
    paddingVertical: Spacing.md,
    color: Colors.textPrimary,
    fontSize: FontSize.normal,
  },
  textArea: {
    minHeight: 100,
    paddingTop: Spacing.md,
  },
  inputDisabled: {
    opacity: 0.5,
  },
  helperText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xsmall,
    marginTop: Spacing.xs,
  },
  charCount: {
    color: Colors.textSecondary,
    fontSize: FontSize.xsmall,
    textAlign: 'right',
    marginTop: Spacing.xs,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.small,
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: Colors.background,
    fontSize: FontSize.normal,
    fontWeight: FontWeight.medium,
  },
});

