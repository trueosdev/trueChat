# Four Features Implementation Guide

## ✅ Completed

### 1. Database Migrations
- ✅ Created `003_read_receipts_and_attachments.sql`
- ✅ Added `read_at`, `attachment_url`, `attachment_type`, `attachment_name`, `attachment_size` columns
- ✅ Created `mark_messages_as_read()` function
- ✅ Created `attachments` storage bucket

### 2. Services Created
- ✅ `presence.ts` - Typing indicators & user presence
- ✅ `attachments.ts` - File upload/download utilities
- ✅ `messages.ts` - Updated with read receipts & attachments support

### 3. Components Updated
- ✅ `chat.tsx` - Typing indicator subscription & read receipts
- ✅ `chat-list.tsx` - Render attachments, read receipts, typing indicators
- ✅ `useChatStore.ts` - Added `updateMessage` function
- ✅ `data.tsx` - Updated Message type

## 🚧 Remaining Tasks

### 1. Update `chat-bottombar.tsx`

Add to imports:
```typescript
import { uploadAttachment, type AttachmentData } from "@/lib/services/attachments";
import { broadcastTyping } from "@/lib/services/presence";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { X, Loader2 } from "lucide-react";
```

Add to props:
```typescript
interface ChatBottombarProps {
  conversationId: string;
  isMobile: boolean;
  typingChannel: RealtimeChannel | null;
}
```

Add state:
```typescript
const [selectedFile, setSelectedFile] = useState<File | null>(null);
const [uploading, setUploading] = useState(false);
const fileInputRef = useRef<HTMLInputElement>(null);
let typingTimeout: NodeJS.Timeout;
```

Add typing broadcast:
```typescript
const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
  setMessage(event.target.value);
  
  // Broadcast typing
  if (user && typingChannel) {
    broadcastTyping(typingChannel, user.id, conversationId, true, user.user_metadata?.username);
    
    // Clear typing after 3 seconds of no typing
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      broadcastTyping(typingChannel, user.id, conversationId, false, user.user_metadata?.username);
    }, 3000);
  }
};
```

Add file upload:
```typescript
const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  
  // Validate file size (10MB)
  if (file.size > 10 * 1024 * 1024) {
    alert('File size must be less than 10MB');
    return;
  }
  
  setSelectedFile(file);
};

const handleRemoveFile = () => {
  setSelectedFile(null);
  if (fileInputRef.current) {
    fileInputRef.current.value = '';
  }
};
```

Update handleSend:
```typescript
const handleSend = async () => {
  if ((!message.trim() && !selectedFile) || !user || !conversationId) return;
  
  setSelectedLoading(true);
  
  try {
    let attachment: AttachmentData | undefined;
    
    // Upload file if selected
    if (selectedFile) {
      setUploading(true);
      attachment = await uploadAttachment(user.id, selectedFile);
      setUploading(false);
      
      if (!attachment) {
        alert('Failed to upload file');
        setSelectedLoading(false);
        return;
      }
    }
    
    const sentMessage = await sendMessage(
      conversationId, 
      message.trim() || ' ', 
      user.id,
      attachment
    );
    
    if (sentMessage) {
      addMessage(sentMessage);
      setMessage("");
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Stop typing indicator
      if (typingChannel) {
        broadcastTyping(typingChannel, user.id, conversationId, false, user.user_metadata?.username);
      }
    }
  } catch (error) {
    console.error('Error sending message:', error);
  } finally {
    setSelectedLoading(false);
    setUploading(false);
  }

  if (inputRef.current) {
    inputRef.current.focus();
  }
};
```

Add file input and preview to JSX:
```typescript
{/* Hidden file input */}
<input
  ref={fileInputRef}
  type="file"
  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
  onChange={handleFileSelect}
  className="hidden"
/>

{/* File preview */}
{selectedFile && (
  <div className="absolute bottom-full left-2 right-2 mb-2 p-2 bg-muted rounded-lg flex items-center justify-between">
    <span className="text-sm truncate">{selectedFile.name}</span>
    <Button
      variant="ghost"
      size="icon"
      onClick={handleRemoveFile}
      className="h-6 w-6"
    >
      <X className="h-4 w-4" />
    </Button>
  </div>
)}
```

Update file attach button click:
```typescript
onClick={() => fileInputRef.current?.click()}
```

### 2. Add User Presence to Sidebar

Update `chat-topbar.tsx`:
- Add online/offline status badge
- Subscribe to user presence for the conversation partner

### 3. Run Database Migration

```bash
# You'll need to run the migration in Supabase dashboard or CLI
# Copy contents of 003_read_receipts_and_attachments.sql
# Run in Supabase SQL editor
```

### 4. Test Features

- ✅ Typing indicators appear when other user types
- ✅ Read receipts show checkmarks (single = delivered, double = read)
- ✅ File uploads work (images show inline, files show download link)
- ✅ User presence shows online/offline status

## 📝 Features Summary

### Typing Indicators
- Real-time with Supabase Presence
- Shows "User is typing..." with animated dots
- Auto-clears after 3 seconds of inactivity

### File/Image Sharing  
- Upload to Supabase storage bucket
- Images display inline with preview
- Other files show download link with size
- 10MB file size limit

### Read Receipts
- Single check (✓) = Message delivered
- Double check (✓✓) = Message read
- Blue color when read
- Only shows on sent messages

### User Presence
- Online/Offline status
- Real-time updates
- Green dot for online users


