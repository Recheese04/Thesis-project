export const getInitials = (name = '') =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

export const formatTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs  = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1)   return 'now';
  if (diffMins < 60)  return `${diffMins}m`;
  if (diffHrs  < 24)  return `${diffHrs}h`;
  if (diffDays < 7)   return `${diffDays}d`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

export const formatFullTime = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const formatDateLabel = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const today     = new Date();
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString())     return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { weekday:'long', month:'long', day:'numeric' });
};

export const groupByDate = (messages) => {
  const items = []; let last = null;
  for (const msg of messages) {
    const label = formatDateLabel(msg.created_at);
    if (label !== last) { items.push({ type:'sep', label, key:`s${msg.id}` }); last = label; }
    items.push({ type:'msg', data: msg, key:`m${msg.id}` });
  }
  return items;
};

const COLORS = [
  'from-blue-500 to-blue-600',
  'from-violet-500 to-purple-600',
  'from-rose-500 to-pink-500',
  'from-amber-400 to-orange-500',
  'from-emerald-500 to-teal-500',
  'from-cyan-500 to-sky-500',
  'from-fuchsia-500 to-indigo-500',
];
export const avatarColor = (name = '') =>
  COLORS[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length];