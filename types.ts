
export interface User {
  id: string;
  username: string;
  passwordHash: string; // Simulated
  createdAt: number;
  avatar?: string; // base64 string
  bio?: string;
}

export type MessageType = 'text' | 'image';

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  type: MessageType;
  content: string; // text or base64 image
  timestamp: number;
  viewedAt: number | null; // null if not yet opened
  expiresAt: number | null; // timestamp when it should be deleted
}

export interface ChatPreview {
  otherUser: User;
  lastMessage: Message | null;
  unreadCount: number;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}
