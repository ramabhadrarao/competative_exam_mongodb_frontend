export const formatDate = (date: string | Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
};

export const formatDateTime = (date: string | Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

export const formatRelativeTime = (date: string | Date): string => {
  const now = new Date();
  const target = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - target.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  
  return formatDate(date);
};

export const getDifficultyColor = (difficulty: string): string => {
  const colors = {
    easy: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    hard: 'bg-red-100 text-red-800',
  };
  return colors[difficulty as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

export const getTypeIcon = (type: string): string => {
  const icons = {
    'multiple-choice': '🔘',
    'true-false': '✅',
    'short-answer': '✏️',
    'essay': '📝',
  };
  return icons[type as keyof typeof icons] || '❓';
};

export const calculateTimeRemaining = (endTime: Date, startTime: Date): {
  minutes: number;
  seconds: number;
  isExpired: boolean;
} => {
  const now = new Date();
  const diffInSeconds = Math.floor((endTime.getTime() - now.getTime()) / 1000);
  
  if (diffInSeconds <= 0) {
    return { minutes: 0, seconds: 0, isExpired: true };
  }
  
  return {
    minutes: Math.floor(diffInSeconds / 60),
    seconds: diffInSeconds % 60,
    isExpired: false,
  };
};

export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};