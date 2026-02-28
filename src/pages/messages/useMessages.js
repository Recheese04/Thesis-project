import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

export const getToken = () =>
  localStorage.getItem('token') ||
  localStorage.getItem('auth_token') ||
  axios.defaults.headers.common?.['Authorization']?.replace('Bearer ', '') ||
  null;

export const authHeaders = () => {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
};

export const getCurrentUser = () => {
  try { return JSON.parse(localStorage.getItem('user') || 'null'); }
  catch { return null; }
};

// chat key: 'group' | 'pm-<userId>'
const chatKey = (chat) => chat?.type === 'pm' ? `pm-${chat.userId}` : 'group';

export default function useMessages() {
  const [chats, setChats]     = useState({}); // { 'group': [...], 'pm-3': [...] }
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError]     = useState(null);
  const lastIds               = useRef({});  // { 'group': 5, 'pm-3': 12 }
  const pollRef               = useRef(null);
  const activeChat            = useRef(null);

  const fetchMembers = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/messages/members', { headers: authHeaders() });
      setMembers(data.members ?? []);
    } catch { /* non-critical */ }
  }, []);

  const loadChat = useCallback(async (chat) => {
    setLoading(true);
    setError(null);
    activeChat.current = chat;
    const key = chatKey(chat);
    try {
      const params = chat?.type === 'pm'
        ? { type: 'pm', with: chat.userId }
        : { type: 'group' };
      const { data } = await axios.get('/api/messages', {
        headers: authHeaders(), params,
      });
      const msgs = data.messages ?? [];
      setChats(prev => ({ ...prev, [key]: msgs }));
      lastIds.current[key] = msgs.length ? msgs[msgs.length - 1].id : 0;
    } catch {
      setError('Could not load messages.');
    } finally {
      setLoading(false);
    }
  }, []);

  const pollActive = useCallback(async () => {
    const chat = activeChat.current;
    if (!chat && chat !== null) return;  // nothing selected yet
    const key    = chatKey(chat);
    const lastId = lastIds.current[key] ?? 0;
    try {
      const params = chat?.type === 'pm'
        ? { type: 'pm', with: chat.userId, after_id: lastId }
        : { type: 'group', after_id: lastId };
      const { data } = await axios.get('/api/messages', {
        headers: authHeaders(), params,
      });
      const newMsgs = data.messages ?? [];
      if (newMsgs.length) {
        setChats(prev => ({ ...prev, [key]: [...(prev[key] ?? []), ...newMsgs] }));
        lastIds.current[key] = newMsgs[newMsgs.length - 1].id;
        // Refresh member list to update last-message previews
        fetchMembers();
      }
    } catch { /* silent */ }
  }, [fetchMembers]);

  // Send text or image
  const sendMessage = useCallback(async (chat, text, imageFile) => {
    if ((!text?.trim() && !imageFile) || sending) return false;
    setSending(true);
    setError(null);
    try {
      const key  = chatKey(chat);
      const form = new FormData();
      if (text?.trim()) form.append('message', text.trim());
      if (imageFile)    form.append('image',   imageFile);
      if (chat?.type === 'pm') {
        form.append('type',        'pm');
        form.append('receiver_id', String(chat.userId));
      } else {
        form.append('type', 'group');
      }

      const { data } = await axios.post('/api/messages', form, {
        headers: { ...authHeaders(), 'Content-Type': 'multipart/form-data' },
      });
      setChats(prev => ({ ...prev, [key]: [...(prev[key] ?? []), data.message] }));
      lastIds.current[key] = data.message.id;
      fetchMembers();
      return true;
    } catch {
      setError('Failed to send.');
      return false;
    } finally {
      setSending(false);
    }
  }, [sending, fetchMembers]);

  useEffect(() => {
    fetchMembers();
    // Load group chat by default
    loadChat(null);
  }, []);

  useEffect(() => {
    pollRef.current = setInterval(pollActive, 4000);
    return () => clearInterval(pollRef.current);
  }, [pollActive]);

  const getMessages = (chat) => chats[chatKey(chat)] ?? [];

  return {
    members, loading, sending, error,
    getMessages, loadChat, sendMessage,
    refetchMembers: fetchMembers,
    clearError: () => setError(null),
  };
}