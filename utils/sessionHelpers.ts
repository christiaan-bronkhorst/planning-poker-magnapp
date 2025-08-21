export const validateSessionId = (id: string): boolean => {
  const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return guidRegex.test(id);
};

export const formatSessionTime = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  
  if (minutes < 1) return 'Just now';
  if (minutes === 1) return '1 minute ago';
  if (minutes < 60) return `${minutes} minutes ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return '1 hour ago';
  if (hours < 24) return `${hours} hours ago`;
  
  return new Date(date).toLocaleDateString();
};

export const getTimeRemaining = (lastActivity: Date, timeoutMinutes: number): number => {
  const now = new Date();
  const diff = now.getTime() - new Date(lastActivity).getTime();
  const minutesElapsed = diff / 60000;
  const remaining = timeoutMinutes - minutesElapsed;
  return Math.max(0, Math.floor(remaining));
};

export const generateSessionName = (): string => {
  const adjectives = ['Sprint', 'Feature', 'Epic', 'Story', 'Task'];
  const nouns = ['Planning', 'Estimation', 'Review', 'Refinement', 'Grooming'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adj} ${noun}`;
};