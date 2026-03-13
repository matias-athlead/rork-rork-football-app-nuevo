import AsyncStorage from '@react-native-async-storage/async-storage';
import { Comment } from '@/src/types/Post';

const LIKED_POSTS_KEY = '@athlead_liked_posts';
const POST_COMMENTS_KEY = '@athlead_post_comments';
const FOLLOWED_USERS_KEY = '@athlead_followed_users';
const REPORTS_KEY = '@athlead_reports';
const BLOCKED_USERS_KEY = '@athlead_blocked_users';
const POSTS_STORAGE_KEY = '@athlead_user_posts';

export const socialService = {
  // ── LIKES ──────────────────────────────────────────────────────────────────

  async getLikedPosts(): Promise<Record<string, boolean>> {
    try {
      const data = await AsyncStorage.getItem(LIKED_POSTS_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  },

  async toggleLike(postId: string): Promise<{ isLiked: boolean; likes: number }> {
    try {
      const liked = await this.getLikedPosts();
      const wasLiked = !!liked[postId];
      liked[postId] = !wasLiked;
      await AsyncStorage.setItem(LIKED_POSTS_KEY, JSON.stringify(liked));

      // Persist updated like count in posts storage
      let newLikeCount = 0;
      const postsData = await AsyncStorage.getItem(POSTS_STORAGE_KEY);
      if (postsData) {
        const allPosts = JSON.parse(postsData);
        for (const userId in allPosts) {
          const idx = allPosts[userId].findIndex((p: any) => p.id === postId);
          if (idx !== -1) {
            const delta = wasLiked ? -1 : 1;
            allPosts[userId][idx].likes = Math.max(0, (allPosts[userId][idx].likes || 0) + delta);
            allPosts[userId][idx].isLiked = !wasLiked;
            newLikeCount = allPosts[userId][idx].likes;
            break;
          }
        }
        await AsyncStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(allPosts));
      }

      return { isLiked: !wasLiked, likes: newLikeCount };
    } catch {
      return { isLiked: false, likes: 0 };
    }
  },

  // ── COMMENTS ───────────────────────────────────────────────────────────────

  async getComments(postId: string): Promise<Comment[]> {
    try {
      const data = await AsyncStorage.getItem(POST_COMMENTS_KEY);
      const all: Record<string, Comment[]> = data ? JSON.parse(data) : {};
      return all[postId] || [];
    } catch {
      return [];
    }
  },

  async addComment(postId: string, comment: Comment): Promise<Comment[]> {
    try {
      const data = await AsyncStorage.getItem(POST_COMMENTS_KEY);
      const all: Record<string, Comment[]> = data ? JSON.parse(data) : {};
      if (!all[postId]) all[postId] = [];
      all[postId] = [comment, ...all[postId]];
      await AsyncStorage.setItem(POST_COMMENTS_KEY, JSON.stringify(all));

      // Update comment count on the post in posts storage
      const postsData = await AsyncStorage.getItem(POSTS_STORAGE_KEY);
      if (postsData) {
        const allPosts = JSON.parse(postsData);
        for (const userId in allPosts) {
          const idx = allPosts[userId].findIndex((p: any) => p.id === postId);
          if (idx !== -1) {
            allPosts[userId][idx].comments = all[postId].length;
            break;
          }
        }
        await AsyncStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(allPosts));
      }

      return all[postId];
    } catch {
      return [];
    }
  },

  async likeComment(postId: string, commentId: string): Promise<Comment[]> {
    try {
      const data = await AsyncStorage.getItem(POST_COMMENTS_KEY);
      const all: Record<string, Comment[]> = data ? JSON.parse(data) : {};
      if (!all[postId]) return [];
      all[postId] = all[postId].map(c =>
        c.id === commentId
          ? { ...c, isLiked: !c.isLiked, likes: c.isLiked ? c.likes - 1 : c.likes + 1 }
          : c
      );
      await AsyncStorage.setItem(POST_COMMENTS_KEY, JSON.stringify(all));
      return all[postId];
    } catch {
      return [];
    }
  },

  // ── FOLLOW ─────────────────────────────────────────────────────────────────

  async getFollowedUsers(): Promise<string[]> {
    try {
      const data = await AsyncStorage.getItem(FOLLOWED_USERS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async isFollowing(userId: string): Promise<boolean> {
    const followed = await this.getFollowedUsers();
    return followed.includes(userId);
  },

  async toggleFollow(userId: string): Promise<{ isFollowing: boolean; followedUsers: string[] }> {
    try {
      const followed = await this.getFollowedUsers();
      const isNowFollowing = !followed.includes(userId);
      const updated = isNowFollowing
        ? [...followed, userId]
        : followed.filter(id => id !== userId);
      await AsyncStorage.setItem(FOLLOWED_USERS_KEY, JSON.stringify(updated));
      return { isFollowing: isNowFollowing, followedUsers: updated };
    } catch {
      return { isFollowing: false, followedUsers: [] };
    }
  },

  // ── REPORT ─────────────────────────────────────────────────────────────────

  async reportPost(postId: string, reason: string, reportedBy: string): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(REPORTS_KEY);
      const reports = data ? JSON.parse(data) : [];
      // Avoid duplicate reports from same user
      const alreadyReported = reports.some(
        (r: any) => r.postId === postId && r.reportedBy === reportedBy
      );
      if (!alreadyReported) {
        reports.push({ postId, reason, reportedBy, createdAt: new Date().toISOString() });
        await AsyncStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
      }
    } catch {}
  },

  async hasReported(postId: string, userId: string): Promise<boolean> {
    try {
      const data = await AsyncStorage.getItem(REPORTS_KEY);
      if (!data) return false;
      const reports = JSON.parse(data);
      return reports.some((r: any) => r.postId === postId && r.reportedBy === userId);
    } catch {
      return false;
    }
  },

  // ── BLOCK ──────────────────────────────────────────────────────────────────

  async getBlockedUserIds(): Promise<string[]> {
    try {
      const data = await AsyncStorage.getItem(BLOCKED_USERS_KEY);
      if (!data) return [];
      const blocked = JSON.parse(data);
      return blocked.map((u: any) => u.id);
    } catch {
      return [];
    }
  },

  async isUserBlocked(userId: string): Promise<boolean> {
    const ids = await this.getBlockedUserIds();
    return ids.includes(userId);
  },

  async blockUser(userId: string, username: string, userPhoto: string, fullName?: string): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(BLOCKED_USERS_KEY);
      const blocked = data ? JSON.parse(data) : [];
      if (!blocked.some((u: any) => u.id === userId)) {
        blocked.push({
          id: userId,
          username,
          fullName: fullName || username,
          profilePhoto: userPhoto,
          blockedAt: new Date().toISOString(),
        });
        await AsyncStorage.setItem(BLOCKED_USERS_KEY, JSON.stringify(blocked));
      }
    } catch {}
  },
};
