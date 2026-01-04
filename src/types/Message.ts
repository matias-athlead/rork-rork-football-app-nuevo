export type MessageType = 'text' | 'voice' | 'photo' | 'video' | 'lineup' | 'poll';

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderPhoto: string;
  type: MessageType;
  content: string;
  mediaUrl?: string;
  duration?: number;
  lineup?: LineupData;
  poll?: PollData;
  createdAt: string;
  isRead: boolean;
}

export interface Chat {
  id: string;
  type: 'direct' | 'group';
  name: string;
  photo: string;
  participants: string[];
  lastMessage: Message | null;
  unreadCount: number;
  isPremiumOnly?: boolean;
}

export interface GroupChat extends Chat {
  type: 'group';
  adminIds: string[];
  notes: GroupNote[];
  events: GroupEvent[];
  isPremium: boolean;
}

export interface GroupNote {
  id: string;
  groupId: string;
  authorId: string;
  authorName: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface GroupEvent {
  id: string;
  groupId: string;
  type: 'training' | 'match';
  title: string;
  date: string;
  location: string;
}

export interface LineupData {
  formation: '4-3-3' | '4-4-2' | '3-5-2' | '4-2-3-1';
  players: {
    position: string;
    playerId: string;
    playerName: string;
  }[];
}

export interface PollData {
  question: string;
  options: { id: string; text: string; votes: number }[];
  totalVotes: number;
  userVote?: string;
}
