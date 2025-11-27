export const Users: User[] = [
  {
    id: 1,
    avatar:
      "https://images.freeimages.com/images/large-previews/971/basic-shape-avatar-1632968.jpg?fmt=webp&h=350",
    messages: [],
    name: "Jane Doe",
  },
  {
    id: 2,
    avatar:
      "https://images.freeimages.com/images/large-previews/fdd/man-avatar-1632964.jpg?fmt=webp&h=350",
    messages: [],
    name: "John Doe",
  },
  {
    id: 3,
    avatar:
      "https://images.freeimages.com/images/large-previews/d1f/lady-avatar-1632967.jpg?fmt=webp&h=350",
    messages: [],
    name: "Elizabeth Smith",
  },
  {
    id: 4,
    avatar:
      "https://images.freeimages.com/images/large-previews/023/geek-avatar-1632962.jpg?fmt=webp&h=350",
    messages: [],
    name: "John Smith",
  },
  {
    id: 5,
    avatar:
      "https://avatars.githubusercontent.com/u/114422072?s=400&u=8a176a310ca29c1578a70b1c33bdeea42bf000b4&v=4",
    messages: [],
    name: "Jakob Hoeg",
  },
];

export const userData: User[] = [
  {
    id: 1,
    avatar:
      "https://images.freeimages.com/images/large-previews/971/basic-shape-avatar-1632968.jpg?fmt=webp&h=350",
    messages: [
      {
        id: 1,
        avatar:
          "https://images.freeimages.com/images/large-previews/971/basic-shape-avatar-1632968.jpg?fmt=webp&h=350",
        name: "Jane Doe",
        message: "Hey, Jakob",
        timestamp: "10:00 AM",
      },
      {
        id: 2,
        avatar:
          "https://avatars.githubusercontent.com/u/114422072?s=400&u=8a176a310ca29c1578a70b1c33bdeea42bf000b4&v=4",
        name: "Jakob Hoeg",
        message: "Hey!",
        timestamp: "10:01 AM",
      },
      {
        id: 3,
        avatar:
          "https://images.freeimages.com/images/large-previews/971/basic-shape-avatar-1632968.jpg?fmt=webp&h=350",
        name: "Jane Doe",
        message: "How are you?",
        timestamp: "10:02 AM",
      },
      {
        id: 4,
        avatar:
          "https://avatars.githubusercontent.com/u/114422072?s=400&u=8a176a310ca29c1578a70b1c33bdeea42bf000b4&v=4",
        name: "Jakob Hoeg",
        message: "I am good, you?",
        timestamp: "10:03 AM",
      },
      {
        id: 5,
        avatar:
          "https://images.freeimages.com/images/large-previews/971/basic-shape-avatar-1632968.jpg?fmt=webp&h=350",
        name: "Jane Doe",
        message: "I am good too!",
        timestamp: "10:04 AM",
      },
      {
        id: 6,
        avatar:
          "https://avatars.githubusercontent.com/u/114422072?s=400&u=8a176a310ca29c1578a70b1c33bdeea42bf000b4&v=4",
        name: "Jakob Hoeg",
        message: "That is good to hear!",
        timestamp: "10:05 AM",
        isLiked: true,
      },
      {
        id: 7,
        avatar:
          "https://images.freeimages.com/images/large-previews/971/basic-shape-avatar-1632968.jpg?fmt=webp&h=350",
        name: "Jane Doe",
        message: "How has your day been so far?",
        timestamp: "10:06 AM",
      },
      {
        id: 8,
        avatar:
          "https://avatars.githubusercontent.com/u/114422072?s=400&u=8a176a310ca29c1578a70b1c33bdeea42bf000b4&v=4",
        name: "Jakob Hoeg",
        message:
          "It has been good. I went for a run this morning and then had a nice breakfast. How about you?",
        timestamp: "10:10 AM",
      },
      {
        id: 9,
        avatar:
          "https://images.freeimages.com/images/large-previews/971/basic-shape-avatar-1632968.jpg?fmt=webp&h=350",
        name: "Jane Doe",
        isLoading: true,
      },
    ],
    name: "Jane Doe",
  },
  {
    id: 2,
    avatar:
      "https://images.freeimages.com/images/large-previews/fdd/man-avatar-1632964.jpg?fmt=webp&h=350",
    name: "John Doe",
    messages: [],
  },
  {
    id: 3,
    avatar:
      "https://images.freeimages.com/images/large-previews/d1f/lady-avatar-1632967.jpg?fmt=webp&h=350",
    name: "Elizabeth Smith",
    messages: [],
  },
  {
    id: 4,
    avatar:
      "https://images.freeimages.com/images/large-previews/023/geek-avatar-1632962.jpg?fmt=webp&h=350",
    name: "John Smith",
    messages: [],
  },
];

export type UserData = (typeof userData)[number];

export const loggedInUserData = {
  id: 5,
  avatar:
    "https://avatars.githubusercontent.com/u/114422072?s=400&u=8a176a310ca29c1578a70b1c33bdeea42bf000b4&v=4",
  name: "Jakob Hoeg",
};

export type LoggedInUserData = typeof loggedInUserData;

// Legacy types for backward compatibility (will be replaced with Supabase types)
export interface Message {
  id: number | string;
  avatar: string;
  name: string;
  message?: string;
  isLoading?: boolean;
  timestamp?: string;
  isLiked?: boolean;
  sender_id?: string;
  conversation_id?: string;
  created_at?: string;
  read_at?: string | null;
  attachment_url?: string | null;
  attachment_type?: string | null;
  attachment_name?: string | null;
  attachment_size?: number | null;
}

export interface User {
  id: number | string;
  avatar: string;
  messages: Message[];
  name: string;
  email?: string;
  username?: string;
  fullname?: string;
  avatar_url?: string;
  bio?: string;
}

// Supabase-compatible types
export interface ConversationWithUser {
  id: string;
  created_at: string;
  user1_id: string;
  user2_id: string;
  is_group: boolean;
  name: string | null;
  created_by: string | null;
  last_message: {
    id: string;
    content: string;
    sender_id: string;
    created_at: string;
  } | null;
  other_user?: {
    id: string;
    username: string | null;
    fullname: string | null;
    avatar_url: string | null;
    email: string;
  };
  participants?: ConversationParticipant[];
  participant_count?: number;
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string;
  role: 'admin' | 'member';
  user: {
    id: string;
    username: string | null;
    fullname: string | null;
    avatar_url: string | null;
    email: string;
  };
}
