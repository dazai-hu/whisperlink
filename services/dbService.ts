
import { User, Message } from '../types';
import { io, Socket } from 'socket.io-client';

class DBService {
  private socket: Socket;
  private baseUrl = window.location.origin;

  constructor() {
    this.socket = io(this.baseUrl);
    this.socket.on('db_update', () => {
      window.dispatchEvent(new Event('storage'));
    });
  }

  async createUser(username: string, passwordHash: string): Promise<User> {
    const res = await fetch(`${this.baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password: passwordHash })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to register');
    }
    return res.json();
  }

  async findUserByUsername(username: string): Promise<User | null> {
    const res = await fetch(`${this.baseUrl}/api/users/search/${username}`);
    if (!res.ok) return null;
    return res.json();
  }

  async findUserById(id: string): Promise<User | null> {
    const res = await fetch(`${this.baseUrl}/api/users/${id}`);
    if (!res.ok) return null;
    return res.json();
  }

  async updateUserProfile(userId: string, data: { avatar?: string, bio?: string }): Promise<User> {
    const res = await fetch(`${this.baseUrl}/api/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const updated = await res.json();
    const session = localStorage.getItem('whisperlink_session');
    if (session) {
      const user = JSON.parse(session);
      if (user.id === userId) {
        localStorage.setItem('whisperlink_session', JSON.stringify(updated));
      }
    }
    return updated;
  }

  async sendMessage(senderId: string, receiverId: string, type: 'text' | 'image', content: string): Promise<void> {
    this.socket.emit('send_message', { senderId, receiverId, type, content });
  }

  async getChatMessages(userId1: string, userId2: string): Promise<Message[]> {
    const res = await fetch(`${this.baseUrl}/api/messages/${userId1}/${userId2}`);
    return res.json();
  }

  async markAsViewed(messageId: string): Promise<void> {
    this.socket.emit('mark_viewed', messageId);
  }

  async getRecentChats(userId: string): Promise<{ otherUser: User, lastMessage: Message | null, unreadCount: number }[]> {
    const res = await fetch(`${this.baseUrl}/api/chats/${userId}`);
    return res.json();
  }

  subscribeToMessages(userId: string, callback: () => void) {
    this.socket.emit('join', userId);
    this.socket.on('new_message', callback);
    this.socket.on('message_updated', callback);
    return () => {
      this.socket.off('new_message', callback);
      this.socket.off('message_updated', callback);
    };
  }
}

export const db = new DBService();
