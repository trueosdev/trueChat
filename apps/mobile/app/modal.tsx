import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  StyleSheet,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth/auth-provider';
import { searchUsers, UserProfile } from '@/lib/services/users';
import { createConversation } from '@/lib/services/conversations';
import useChatStore from '@/hooks/useChatStore';
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

interface UserItemProps {
  user: UserProfile;
  onPress: () => void;
}

function UserItem({ user, onPress }: UserItemProps) {
  const displayName = user.fullname || user.username || 'Unknown User';

  return (
    <TouchableOpacity 
      style={styles.userItem} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      {user.avatar_url ? (
        <Image source={{ uri: user.avatar_url }} style={styles.userAvatar} />
      ) : (
        <View style={styles.userAvatarPlaceholder}>
          <Text style={styles.userAvatarText}>{getInitials(displayName)}</Text>
        </View>
      )}
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{displayName}</Text>
        {user.username && <Text style={styles.userUsername}>@{user.username}</Text>}
      </View>
      <Ionicons name="chatbubble-outline" size={20} color={Colors.primary} />
    </TouchableOpacity>
  );
}

export default function NewChatModal() {
  const { user } = useAuth();
  const { addConversation } = useChatStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!searchQuery.trim() || !user?.id) {
      setUsers([]);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setLoading(true);
      const results = await searchUsers(searchQuery, user.id);
      setUsers(results);
      setLoading(false);
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [searchQuery, user?.id]);

  const handleSelectUser = async (selectedUser: UserProfile) => {
    if (!user?.id) return;

    setCreating(true);
    const conversation = await createConversation(user.id, selectedUser.id);
    setCreating(false);

    if (conversation) {
      addConversation(conversation);
      router.dismiss();
      router.push(`/chat/${conversation.id}`);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false, presentation: 'modal' }} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>New Chat</Text>
        <TouchableOpacity onPress={() => router.dismiss()}>
          <Ionicons name="close" size={28} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search" size={20} color={Colors.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users by name or username..."
            placeholderTextColor={Colors.secondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={Colors.secondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results */}
      {creating && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <UserItem user={item} onPress={() => handleSelectUser(item)} />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              {searchQuery.length > 0 ? (
                <>
                  <Ionicons name="person-outline" size={48} color={Colors.secondary} />
                  <Text style={styles.emptyText}>No users found for "{searchQuery}"</Text>
                </>
              ) : (
                <>
                  <Ionicons name="search-outline" size={48} color={Colors.secondary} />
                  <Text style={styles.emptyText}>Search for users to start a conversation</Text>
                </>
              )}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.large,
    fontWeight: FontWeight.semibold,
  },
  searchContainer: {
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: Spacing.md,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.small,
    paddingHorizontal: Layout.inputPadding,
    paddingVertical: Spacing.md,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.normal,
    marginLeft: Spacing.md,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.md,
  },
  userAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  userAvatarText: {
    color: Colors.primary,
    fontSize: FontSize.normal,
    fontWeight: FontWeight.semibold,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: Colors.textPrimary,
    fontWeight: FontWeight.semibold,
    fontSize: FontSize.normal,
  },
  userUsername: {
    color: Colors.textSecondary,
    fontSize: FontSize.small,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 84,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.lg,
    fontSize: FontSize.normal,
  },
});
