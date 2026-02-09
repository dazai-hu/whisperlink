
import { User, Message } from '../types';
import { EPHEMERAL_DURATION_MS } from '../constants';

/**
 * A service that simulates a backend database with LocalStorage.
 * In a real app, this would be an API + WebSocket backend.
 */
class DBService {
  private USERS_KEY = 'whisperlink_users';
  private MESSAGES_KEY = 'whisperlink_messages';

  constructor() {
    this.startCleanupJob();
  }

  private startCleanupJob() {
    setInterval(() => {
      this.cleanupExpiredMessages();
    }, 5000);
  }

  private getUsers(): User[] {
    const data = localStorage.getItem(this.USERS_KEY);
    return data ? JSON.parse(data) : [];
  }

  private saveUsers(users: User[]) {
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
  }

  private getMessages(): Message[] {
    const data = localStorage.getItem(this.MESSAGES_KEY);
    return data ? JSON.parse(data) : [];
  }

  private saveMessages(messages: Message[]) {
    localStorage.setItem(this.MESSAGES_KEY, JSON.stringify(messages));
  }

  // --- PUBLIC API ---

  async createUser(username: string, passwordHash: string): Promise<User> {
    const users = this.getUsers();
    if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
      throw new Error('Username already exists');
    }
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      username,
      passwordHash,
      createdAt: Date.now(),
      bio: 'Whispering in the leaves...'
    };
    users.push(newUser);
    this.saveUsers(users);
    return newUser;
  }

  async findUserByUsername(username: string): Promise<User | null> {
    const users = this.getUsers();
    return users.find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
  }

  async findUserById(id: string): Promise<User | null> {
    const users = this.getUsers();
    return users.find(u => u.id === id) || null;
  }

  async updateUserProfile(userId: string, data: { avatar?: string, bio?: string }): Promise<User> {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx === -1) throw new Error('User not found');
    
    users[idx] = { ...users[idx], ...data };
    this.saveUsers(users);
    
    // Also update current session if it's the same user
    const session = localStorage.getItem('whisperlink_session');
    if (session) {
      const sessionUser = JSON.parse(session);
      if (sessionUser.id === userId) {
        localStorage.setItem('whisperlink_session', JSON.stringify(users[idx]));
      }
    }
    
    return users[idx];
  }

  async sendMessage(senderId: string, receiverId: string, type: 'text' | 'image', content: string): Promise<Message> {
    const messages = this.getMessages();
    const newMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      senderId,
      receiverId,
      type,
      content,
      timestamp: Date.now(),
      viewedAt: null,
      expiresAt: null
    };
    messages.push(newMessage);
    this.saveMessages(messages);
    return newMessage;
  }

  async getChatMessages(userId1: string, userId2: string): Promise<Message[]> {
    const messages = this.getMessages();
    return messages.filter(m => 
      (m.senderId === userId1 && m.receiverId === userId2) ||
      (m.senderId === userId2 && m.receiverId === userId1)
    ).sort((a, b) => a.timestamp - b.timestamp);
  }

  async markAsViewed(messageId: string): Promise<void> {
    const messages = this.getMessages();
    const idx = messages.findIndex(m => m.id === messageId);
    if (idx !== -1 && !messages[idx].viewedAt) {
      const now = Date.now();
      messages[idx].viewedAt = now;
      messages[idx].expiresAt = now + EPHEMERAL_DURATION_MS;
      this.saveMessages(messages);
    }
  }

  private cleanupExpiredMessages() {
    const now = Date.now();
    let messages = this.getMessages();
    const initialCount = messages.length;
    messages = messages.filter(m => {
      if (m.expiresAt && now >= m.expiresAt) return false;
      return true;
    });
    if (messages.length !== initialCount) {
      this.saveMessages(messages);
      window.dispatchEvent(new Event('storage'));
    }
  }

  async getRecentChats(userId: string): Promise<{ otherUser: User, lastMessage: Message | null, unreadCount: number }[]> {
    const allMessages = this.getMessages();
    const users = this.getUsers();
    const interactedUserIds = new Set<string>();
    allMessages.forEach(m => {
      if (m.senderId === userId) interactedUserIds.add(m.receiverId);
      if (m.receiverId === userId) interactedUserIds.add(m.senderId);
    });

    const results = Array.from(interactedUserIds).map(otherId => {
      const otherUser = users.find(u => u.id === otherId)!;
      if (!otherUser) return null;
      const chatMessages = allMessages.filter(m => 
        (m.senderId === userId && m.receiverId === otherId) ||
        (m.senderId === otherId && m.receiverId === userId)
      ).sort((a, b) => b.timestamp - a.timestamp);

      const unreadCount = chatMessages.filter(m => m.receiverId === userId && !m.viewedAt).length;

      return {
        otherUser,
        lastMessage: chatMessages[0] || null,
        unreadCount
      };
    }).filter(x => x !== null) as { otherUser: User, lastMessage: Message | null, unreadCount: number }[];

    return results.sort((a, b) => {
      const timeA = a.lastMessage?.timestamp || 0;
      const timeB = b.lastMessage?.timestamp || 0;
      return timeB - timeA;
    });
  }
}

export const db = new DBService();
