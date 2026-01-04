export type NotificationType = 
  | 'like' 
  | 'comment' 
  | 'follow' 
  | 'follow_request'
  | 'message' 
  | 'call' 
  | 'post'
  | 'ranking'
  | 'mention';

export interface Notification {
  id: string;
  type: NotificationType;
  userId: string;
  username: string;
  userPhoto: string;
  content: string;
  postId?: string;
  postThumbnail?: string;
  chatId?: string;
  isRead: boolean;
  createdAt: string;
}
