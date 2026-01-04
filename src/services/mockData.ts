import { User, PlayerProfile, CoachProfile, ClubProfile, Position, CoachCategory, Federation } from '@/src/types/User';
import { Post } from '@/src/types/Post';
import { Notification } from '@/src/types/Notification';

const spanishCities = ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Bilbao', 'Málaga', 'Zaragoza', 'Murcia'];
const federations: Federation[] = ['RFEF', 'Andaluza', 'Catalana', 'Madrileña', 'Vasca', 'Valenciana', 'Aragonesa', 'Gallega', 'Castellana', 'Murciana'];
const clubs = ['Real Madrid', 'FC Barcelona', 'Atlético Madrid', 'Valencia CF', 'Sevilla FC', 'Athletic Bilbao', 'Real Sociedad', 'Betis'];
const positions: Position[] = ['GK', 'RB', 'LB', 'CB', 'DM', 'CM', 'AM', 'RW', 'LW', 'ST'];
const categories: CoachCategory[] = ['Prebenjamín', 'Benjamín', 'Alevín', 'Infantil', 'Cadete', 'Juvenil', 'Senior'];

const firstNames = ['Carlos', 'David', 'Miguel', 'Javier', 'Alejandro', 'Pablo', 'Juan', 'Luis', 'Pedro', 'Diego', 'Sergio', 'Alberto', 'Fernando', 'Antonio'];
const lastNames = ['García', 'Rodríguez', 'Martínez', 'López', 'González', 'Pérez', 'Sánchez', 'Ramírez', 'Torres', 'Flores'];

function generateUsername(firstName: string, lastName: string, index: number): string {
  return `${firstName.toLowerCase()}${lastName.toLowerCase()}${index > 0 ? index : ''}`;
}

function randomFromArray<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generatePlayerStats() {
  return {
    speed: Math.floor(Math.random() * 30) + 70,
    power: Math.floor(Math.random() * 30) + 70,
    sprints: Math.floor(Math.random() * 50) + 20,
    offBallRuns: Math.floor(Math.random() * 80) + 40,
    dribbles: Math.floor(Math.random() * 60) + 30,
    passAccuracy: Math.floor(Math.random() * 20) + 75,
    goals: Math.floor(Math.random() * 25),
    assists: Math.floor(Math.random() * 20),
    minutes: Math.floor(Math.random() * 2000) + 500,
    matchesPlayed: Math.floor(Math.random() * 30) + 10,
    shotsOnTarget: Math.floor(Math.random() * 50) + 20,
  };
}

function generatePlayerRadarStats() {
  return {
    speed: Math.floor(Math.random() * 30) + 70,
    passPercentage: Math.floor(Math.random() * 20) + 75,
    goalPercentage: Math.floor(Math.random() * 30) + 40,
    matchCompletionPercentage: Math.floor(Math.random() * 30) + 60,
    dribbles: Math.floor(Math.random() * 30) + 60,
  };
}

function generateCoachRadarStats() {
  return {
    winPercentage: Math.floor(Math.random() * 30) + 50,
    playerDevelopment: Math.floor(Math.random() * 30) + 60,
    trainingAttendance: Math.floor(Math.random() * 20) + 75,
    tacticsScore: Math.floor(Math.random() * 30) + 60,
    motivation: Math.floor(Math.random() * 30) + 65,
  };
}

function generateClubRadarStats() {
  return {
    winPercentage: Math.floor(Math.random() * 30) + 50,
    goalsPerGame: Math.floor(Math.random() * 15) + 10,
    cleanSheets: Math.floor(Math.random() * 20) + 30,
    youthDevelopment: Math.floor(Math.random() * 30) + 60,
    budgetManagement: Math.floor(Math.random() * 30) + 65,
  };
}

export function generateMockUsers(): User[] {
  const users: User[] = [];
  const usedUsernames = new Set<string>();

  for (let i = 0; i < 70; i++) {
    const firstName = randomFromArray(firstNames);
    const lastName = randomFromArray(lastNames);
    let username = generateUsername(firstName, lastName, 0);
    let counter = 1;
    while (usedUsernames.has(username)) {
      username = generateUsername(firstName, lastName, counter++);
    }
    usedUsernames.add(username);

    const age = Math.floor(Math.random() * 15) + 16;
    const birthYear = new Date().getFullYear() - age;
    const birthdate = `${birthYear}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`;

    const player: PlayerProfile = {
      id: `player_${i}`,
      email: `${username}@example.com`,
      username,
      fullName: `${firstName} ${lastName}`,
      role: 'player',
      profilePhoto: `https://i.pravatar.cc/300?img=${i + 1}`,
      coverPhoto: `https://images.unsplash.com/photo-${1540747913346 + i}-${1234567890 + i}?w=800&h=300&fit=crop`,
      bio: `Professional footballer | ${randomFromArray(positions)} | ${randomFromArray(clubs)}`,
      followers: Math.floor(Math.random() * 5000) + 100,
      following: Math.floor(Math.random() * 1000) + 50,
      isPrivate: Math.random() > 0.7,
      isPremium: Math.random() > 0.6,
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      birthdate,
      city: randomFromArray(spanishCities),
      federation: randomFromArray(federations),
      age,
      currentClub: randomFromArray(clubs),
      positions: [randomFromArray(positions), randomFromArray(positions)],
      stats: generatePlayerStats(),
      radarStats: generatePlayerRadarStats(),
    };
    users.push(player);
  }

  for (let i = 0; i < 20; i++) {
    const firstName = randomFromArray(firstNames);
    const lastName = randomFromArray(lastNames);
    let username = generateUsername(firstName, lastName, 0);
    let counter = 1;
    while (usedUsernames.has(username)) {
      username = generateUsername(firstName, lastName, counter++);
    }
    usedUsernames.add(username);

    const coach: CoachProfile = {
      id: `coach_${i}`,
      email: `${username}@example.com`,
      username,
      fullName: `${firstName} ${lastName}`,
      role: 'coach',
      profilePhoto: `https://i.pravatar.cc/300?img=${i + 71}`,
      coverPhoto: `https://images.unsplash.com/photo-${1540747913346 + i + 70}-${1234567890 + i}?w=800&h=300&fit=crop`,
      bio: `Football coach | Specializing in youth development`,
      followers: Math.floor(Math.random() * 3000) + 200,
      following: Math.floor(Math.random() * 800) + 100,
      isPrivate: Math.random() > 0.8,
      isPremium: Math.random() > 0.5,
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      birthdate: `${new Date().getFullYear() - (Math.floor(Math.random() * 20) + 30)}-06-15`,
      city: randomFromArray(spanishCities),
      federation: randomFromArray(federations),
      club: randomFromArray(clubs),
      categories: [randomFromArray(categories), randomFromArray(categories)],
      radarStats: generateCoachRadarStats(),
    };
    users.push(coach);
  }

  for (let i = 0; i < 10; i++) {
    const clubName = `${randomFromArray(['CF', 'UD', 'CD', 'SD'])} ${randomFromArray(spanishCities)}`;
    const username = clubName.toLowerCase().replace(/\s+/g, '');

    const club: ClubProfile = {
      id: `club_${i}`,
      email: `${username}@example.com`,
      username,
      fullName: clubName,
      role: 'club',
      profilePhoto: `https://i.pravatar.cc/300?img=${i + 91}`,
      coverPhoto: `https://images.unsplash.com/photo-${1540747913346 + i + 90}-${1234567890 + i}?w=800&h=300&fit=crop`,
      bio: `Official account of ${clubName}`,
      followers: Math.floor(Math.random() * 10000) + 500,
      following: Math.floor(Math.random() * 500) + 50,
      isPrivate: false,
      isPremium: Math.random() > 0.3,
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      birthdate: `${new Date().getFullYear() - 50}-01-01`,
      city: randomFromArray(spanishCities),
      federation: randomFromArray(federations),
      clubName,
      badge: `https://i.pravatar.cc/200?img=${i + 91}`,
      responsiblePerson: `${randomFromArray(firstNames)} ${randomFromArray(lastNames)}`,
      coaches: [`coach_${i}`, `coach_${(i + 1) % 20}`],
      radarStats: generateClubRadarStats(),
    };
    users.push(club);
  }

  return users;
}

const videoUrls = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4'
];

export function generateMockPosts(users: User[]): Post[] {
  const posts: Post[] = [];
  const captions = [
    'Great training session today! 💪⚽',
    'Match day vibes! Let\'s go! 🔥',
    'Working on my skills #NeverStopLearning',
    'Team goals are everything 👥',
    'Another step closer to the dream ⭐'
  ];

  const hashtags = ['#football', '#training', '#goals', '#soccer', '#athlete', '#passion'];

  for (let i = 0; i < 150; i++) {
    const user = randomFromArray(users);
    const postHashtags = [randomFromArray(hashtags), randomFromArray(hashtags)];

    const post: Post = {
      id: `post_${i}`,
      userId: user.id,
      username: user.username,
      userPhoto: user.profilePhoto,
      userRole: user.role,
      videoUrl: randomFromArray(videoUrls),
      thumbnailUrl: `https://images.unsplash.com/photo-${1540747913346 + i}-${1234567890 + i}?w=400&h=600&fit=crop`,
      caption: randomFromArray(captions),
      hashtags: postHashtags,
      taggedUsers: [],
      type: randomFromArray(['play', 'training', 'match'] as const),
      likes: Math.floor(Math.random() * 1000) + 10,
      comments: Math.floor(Math.random() * 200) + 5,
      shares: Math.floor(Math.random() * 50),
      isLiked: false,
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
    };
    posts.push(post);
  }

  return posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function generateMockNotifications(users: User[]): Notification[] {
  const notifications: Notification[] = [];
  const messages = {
    like: 'liked your post',
    comment: 'commented on your post',
    follow: 'started following you',
    follow_request: 'requested to follow you',
    message: 'sent you a message',
    call: 'is calling you',
    post: 'posted a new video',
    ranking: 'You are in the top 10 scorers this week!',
    mention: 'mentioned you in a post'
  };

  for (let i = 0; i < 30; i++) {
    const user = randomFromArray(users);
    const type = randomFromArray(['like', 'comment', 'follow', 'message', 'post'] as const);

    const notification: Notification = {
      id: `notif_${i}`,
      type,
      userId: user.id,
      username: user.username,
      userPhoto: user.profilePhoto,
      content: messages[type],
      postId: type === 'like' || type === 'comment' ? `post_${i}` : undefined,
      postThumbnail: type === 'like' || type === 'comment' ? `https://images.unsplash.com/photo-${1540747913346 + i}-${1234567890 + i}?w=100&h=150&fit=crop` : undefined,
      isRead: Math.random() > 0.5,
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
    };
    notifications.push(notification);
  }

  return notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export const MOCK_USERS = generateMockUsers();
export const MOCK_POSTS = generateMockPosts(MOCK_USERS);
export const MOCK_NOTIFICATIONS = generateMockNotifications(MOCK_USERS);
