export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  url: string;
  duration: number;
}

export const MUSIC_LIBRARY: MusicTrack[] = [
  {
    id: 'music_1',
    title: 'Epic Sports Motivation',
    artist: 'Sport Music',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    duration: 293,
  },
  {
    id: 'music_2',
    title: 'Victory Theme',
    artist: 'Champion Sounds',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    duration: 286,
  },
  {
    id: 'music_3',
    title: 'Training Beat',
    artist: 'Workout Music',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    duration: 304,
  },
  {
    id: 'music_4',
    title: 'Goal Celebration',
    artist: 'Football Anthems',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    duration: 299,
  },
  {
    id: 'music_5',
    title: 'Match Day Energy',
    artist: 'Stadium Sounds',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    duration: 315,
  },
  {
    id: 'music_6',
    title: 'Champions League',
    artist: 'Elite Football',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
    duration: 281,
  },
  {
    id: 'music_7',
    title: 'Street Football',
    artist: 'Urban Beats',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
    duration: 297,
  },
  {
    id: 'music_8',
    title: 'Tactical Play',
    artist: 'Strategy Sound',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
    duration: 308,
  },
];
