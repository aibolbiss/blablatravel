export default function UnreadChatBadge({ hasUnread }: { hasUnread: boolean }) {
  if (!hasUnread) return null;
  return <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />;
}
