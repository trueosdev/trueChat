import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth/auth-provider';
import { getMessages, sendMessage, subscribeToMessages, markMessagesAsRead } from '@/lib/services/messages';
import useChatStore from '@/hooks/useChatStore';
import { MessageWithUser } from '@/lib/types';
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

interface MessageBubbleProps {
  message: MessageWithUser;
  isOwn: boolean;
}

function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  return (
    <View style={[styles.messageRow, isOwn && styles.messageRowOwn]}>
      {/* Avatar for other user */}
      {!isOwn && (
        <View style={styles.messageAvatarContainer}>
          {message.sender?.avatar_url ? (
            <Image source={{ uri: message.sender.avatar_url }} style={styles.messageAvatar} />
          ) : (
            <View style={styles.messageAvatarPlaceholder}>
              <Text style={styles.messageAvatarText}>{getInitials(message.name || 'U')}</Text>
            </View>
          )}
        </View>
      )}

      <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
        {!isOwn && <Text style={styles.senderName}>{message.name}</Text>}
        <Text style={[styles.messageText, isOwn && styles.messageTextOwn]}>
          {message.content || message.message}
        </Text>
        <Text style={[styles.timestamp, isOwn && styles.timestampOwn]}>
          {message.timestamp}
        </Text>
      </View>
    </View>
  );
}

export default function ChatScreen() {
  const { id: conversationId } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { messages, setMessages, addMessage, input, setInput, conversations, clearMessages } = useChatStore();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Get conversation details
  const conversation = conversations.find((c) => c.id === conversationId);
  const displayName = conversation?.is_group
    ? conversation.name || 'Group Chat'
    : conversation?.other_user?.fullname ||
      conversation?.other_user?.username ||
      'Chat';

  useEffect(() => {
    if (!conversationId) return;

    // Clear previous messages
    clearMessages();

    // Load messages
    async function loadMessages() {
      setLoading(true);
      const data = await getMessages(conversationId!);
      setMessages(data as any);
      setLoading(false);

      // Mark messages as read
      if (user?.id) {
        markMessagesAsRead(conversationId!, user.id);
      }
    }

    loadMessages();

    // Subscribe to new messages
    const unsubscribe = subscribeToMessages(conversationId!, (newMessage) => {
      addMessage(newMessage as any);
      // Mark as read
      if (user?.id && newMessage.sender_id !== user.id) {
        markMessagesAsRead(conversationId!, user.id);
      }
    });

    return () => {
      unsubscribe();
      clearMessages();
    };
  }, [conversationId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    if (!input.trim() || !conversationId || !user?.id) return;

    const messageText = input.trim();
    setInput('');
    setSending(true);

    await sendMessage(conversationId, messageText, user.id);
    setSending(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          {conversation?.other_user?.avatar_url ? (
            <Image source={{ uri: conversation.other_user.avatar_url }} style={styles.headerAvatar} />
          ) : (
            <View style={styles.headerAvatarPlaceholder}>
              <Text style={styles.headerAvatarText}>
                {conversation?.is_group ? '👥' : getInitials(displayName)}
              </Text>
            </View>
          )}
          <View>
            <Text style={styles.headerTitle}>{displayName}</Text>
            {conversation?.is_group && conversation.participant_count && (
              <Text style={styles.headerSubtitle}>{conversation.participant_count} members</Text>
            )}
          </View>
        </View>

        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="ellipsis-vertical" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.messagesContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <MessageBubble message={item as MessageWithUser} isOwn={item.sender_id === user?.id} />
            )}
            contentContainerStyle={styles.messagesList}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No messages yet.{'\n'}Start the conversation!</Text>
              </View>
            )}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton}>
            <Ionicons name="attach" size={24} color={Colors.secondary} />
          </TouchableOpacity>

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor={Colors.secondary}
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={1000}
            />
          </View>

          <TouchableOpacity
            style={[styles.sendButton, input.trim() && styles.sendButtonActive]}
            onPress={handleSend}
            disabled={!input.trim() || sending}
            activeOpacity={0.8}
          >
            {sending ? (
              <ActivityIndicator size="small" color={Colors.background} />
            ) : (
              <Ionicons name="send" size={20} color={input.trim() ? Colors.background : Colors.secondary} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  backButton: {
    marginRight: Spacing.md,
    padding: Spacing.xs,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.md,
  },
  headerAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  headerAvatarText: {
    color: Colors.primary,
    fontSize: FontSize.small,
    fontWeight: FontWeight.semibold,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontWeight: FontWeight.semibold,
    fontSize: FontSize.normal,
  },
  headerSubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.xsmall,
  },
  menuButton: {
    padding: Spacing.sm,
  },
  messagesContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesList: {
    paddingVertical: Spacing.lg,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    paddingHorizontal: Layout.screenPadding,
    justifyContent: 'flex-start',
  },
  messageRowOwn: {
    justifyContent: 'flex-end',
  },
  messageAvatarContainer: {
    marginRight: Spacing.sm,
    alignSelf: 'flex-end',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  messageAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageAvatarText: {
    color: Colors.primary,
    fontSize: FontSize.xsmall,
    fontWeight: FontWeight.semibold,
  },
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.medium,
  },
  bubbleOwn: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: Spacing.xs,
  },
  bubbleOther: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderBottomLeftRadius: Spacing.xs,
  },
  senderName: {
    color: Colors.secondary,
    fontSize: FontSize.xsmall,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.xs,
  },
  messageText: {
    color: Colors.textPrimary,
    fontSize: FontSize.normal,
  },
  messageTextOwn: {
    color: Colors.background,
  },
  timestamp: {
    fontSize: FontSize.xsmall,
    marginTop: Spacing.xs,
    color: Colors.secondary,
  },
  timestampOwn: {
    color: 'rgba(0, 0, 0, 0.5)',
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
    fontSize: FontSize.normal,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  attachButton: {
    padding: Spacing.sm,
    marginRight: Spacing.sm,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.small,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    minHeight: 44,
    maxHeight: 128,
    justifyContent: 'center',
  },
  input: {
    color: Colors.textPrimary,
    fontSize: FontSize.normal,
  },
  sendButton: {
    padding: Spacing.sm,
    marginLeft: Spacing.sm,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.small,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
});
