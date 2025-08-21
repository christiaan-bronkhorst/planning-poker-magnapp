export const AVATARS = [
  { id: 'bear', emoji: '🐻', name: 'Bear' },
  { id: 'cat', emoji: '🐱', name: 'Cat' },
  { id: 'dog', emoji: '🐶', name: 'Dog' },
  { id: 'fox', emoji: '🦊', name: 'Fox' },
  { id: 'lion', emoji: '🦁', name: 'Lion' },
  { id: 'monkey', emoji: '🐵', name: 'Monkey' },
  { id: 'panda', emoji: '🐼', name: 'Panda' },
  { id: 'penguin', emoji: '🐧', name: 'Penguin' },
  { id: 'rabbit', emoji: '🐰', name: 'Rabbit' },
  { id: 'tiger', emoji: '🐯', name: 'Tiger' },
  { id: 'unicorn', emoji: '🦄', name: 'Unicorn' },
  { id: 'whale', emoji: '🐳', name: 'Whale' },
  { id: 'alien', emoji: '👽', name: 'Alien' },
  { id: 'ghost', emoji: '👻', name: 'Ghost' },
  { id: 'robot', emoji: '🤖', name: 'Robot' },
  { id: 'wizard', emoji: '🧙', name: 'Wizard' },
] as const;

export type AvatarId = typeof AVATARS[number]['id'];

export function getAvatarById(id: string) {
  return AVATARS.find(avatar => avatar.id === id) || AVATARS[0];
}

export function getRandomAvatar() {
  return AVATARS[Math.floor(Math.random() * AVATARS.length)];
}