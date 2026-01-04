export type PostType = 'play' | 'training' | 'match';

export interface Post {
  id: string;
  userId: string;
  username: string;
  userPhoto: string;
  userRole: 'player' | 'coach' | 'club';
  videoUrl: string;
  thumbnailUrl: string;
  caption: string;
  hashtags: string[];
  taggedUsers: string[];
  type: PostType;
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  createdAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  username: string;
  userPhoto: string;
  text: string;
  likes: number;
  isLiked: boolean;
  createdAt: string;
}
