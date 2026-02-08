import { formatDistanceToNow } from "date-fns";

export function formatRelativeTime(dateString: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  return formatDistanceToNow(date, { addSuffix: true });
}

// CHANGED: Removed the 'instance' parameter entirely
export function formatHandle(user.username): string {
  return `@${username}`;
}

export function formatCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}
