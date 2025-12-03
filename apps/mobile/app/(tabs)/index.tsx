import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth/auth-provider';
import { getConversations, subscribeToConversations } from '@/lib/services/conversations';
import useChatStore from '@/hooks/useChatStore';
import { ConversationWithUser } from '@/lib/types';
import { Colors, Spacing, Layout, BorderRadius, FontSize, FontWeight } from '@/styles';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

interface ConversationItemProps {
  conversation: ConversationWithUser;
  userId: string;
}

function ConversationItem({ conversation, userId }: ConversationItemProps) {
  const displayName = conversation.is_group
    ? conversation.name || 'Group Chat'
    : conversation.other_user?.fullname ||
      conversation.other_user?.username ||
      'Unknown User';

  const avatarUrl = conversation.is_group
    ? null
    : conversation.other_user?.avatar_url;

  const lastMessage = conversation.last_message?.content || 'No messages yet';
  const lastMessageTime = conversation.last_message?.created_at || conversation.created_at;

  const handlePress = () => {
    router.push(`/chat/${conversation.id}`);
  };

  return (
    <TouchableOpacity 
      style={styles.conversationItem} 
      onPress={handlePress}
      activeOpacity={0.8}
    >
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {conversation.is_group ? '👥' : getInitials(displayName)}
            </Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.conversationName} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.conversationTime}>{formatTime(lastMessageTime)}</Text>
        </View>
        <Text style={styles.lastMessage} numberOfLines={1}>
          {lastMessage}
        </Text>
      </View>

      {/* Chevron */}
      <Ionicons name="chevron-forward" size={20} color={Colors.secondary} />
    </TouchableOpacity>
  );
}

export default function ChatsScreen() {
  const { user } = useAuth();
  const { conversations, setConversations, addConversation, loading, setLoading } = useChatStore();
  const [refreshing, setRefreshing] = useState(false);

  const loadConversations = async () => {
    if (!user?.id) return;

    setLoading(true);
    const data = await getConversations(user.id);
    setConversations(data);
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  };

  useEffect(() => {
    loadConversations();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = subscribeToConversations(user.id, (newConversation) => {
      addConversation(newConversation);
    });

    return () => unsubscribe();
  }, [user?.id]);

  if (loading && conversations.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ConversationItem conversation={item} userId={user?.id || ''} />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="chatbubbles-outline" size={40} color={Colors.secondary} />
            </View>
            <Text style={styles.emptyTitle}>No conversations yet</Text>
            <Text style={styles.emptySubtitle}>Start chatting with someone!</Text>
          </View>
        )}
      />

      {/* New Chat FAB */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => router.push('/modal')}
        activeOpacity={0.8}
      >
        <Ionicons name="create-outline" size={24} color={Colors.background} />
      </TouchableOpacity>
    </View>
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
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
  },
  avatarContainer: {
    marginRight: Spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.primary,
    fontSize: FontSize.medium,
    fontWeight: FontWeight.semibold,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  conversationName: {
    color: Colors.textPrimary,
    fontWeight: FontWeight.semibold,
    fontSize: FontSize.normal,
    flex: 1,
    marginRight: Spacing.sm,
  },
  conversationTime: {
    color: Colors.textSecondary,
    fontSize: FontSize.xsmall,
  },
  lastMessage: {
    color: Colors.textSecondary,
    fontSize: FontSize.small,
    marginTop: Spacing.xs,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 92,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.medium,
    fontWeight: FontWeight.medium,
  },
  emptySubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.small,
    marginTop: Spacing.xs,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: Layout.screenPadding,
    width: 56,
    height: 56,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.large,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});
