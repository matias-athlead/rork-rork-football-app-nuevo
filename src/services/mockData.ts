import { User } from '@/src/types/User';
import { Post } from '@/src/types/Post';
import { Notification } from '@/src/types/Notification';

// Datos falsos eliminados - App funciona solo con contenido real de usuarios
// Los usuarios y posts se almacenan en AsyncStorage

export function generateMockUsers(): User[] {
  return [];
}

export function generateMockPosts(_users: User[]): Post[] {
  return [];
}

export function generateMockNotifications(_users: User[]): Notification[] {
  return [];
}

// Exportar arrays vacíos para compatibilidad con código existente
export const MOCK_USERS: User[] = [];
export const MOCK_POSTS: Post[] = [];
export const MOCK_NOTIFICATIONS: Notification[] = [];
