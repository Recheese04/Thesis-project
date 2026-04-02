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

// chat key: 'pm-<userId>'
const chatKey = (chat) => chat?.type === 'pm' ? `pm-${chat.userId}` : null;

export default function useMessages() {
  const [chats, setChats] = useState({}); // { 'pm-3': [...] }
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const lastIds = useRef({});  // { 'pm-3': 12 }
  const activeChat = useRef(null);

  const fetchMembers = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/messages/members', { headers: authHeaders() });
      setMembers(data.members ?? []);
    } catch { /* non-critical */ }
  }, []);

  const loadChat = useCallback(async (chat) => {
    // Only load PM chats — org group chat is no longer supported via this hook
    if (!chat || chat.type !== 'pm') return;
    setLoading(true);
    setError(null);
    activeChat.current = chat;
    const key = chatKey(chat);
    try {
      const { data } = await axios.get('/api/messages', {
        headers: authHeaders(),
        params: { type: 'pm', with: chat.userId },
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
    // Only poll PM chats
    if (!chat || chat.type !== 'pm') return;
    const key = chatKey(chat);
    const lastId = lastIds.current[key] ?? 0;
    try {
      const { data } = await axios.get('/api/messages', {
        headers: authHeaders(),
        params: { type: 'pm', with: chat.userId, after_id: lastId },
      });
      const newMsgs = data.messages ?? [];
      if (newMsgs.length) {
        setChats(prev => ({ ...prev, [key]: [...(prev[key] ?? []), ...newMsgs] }));
        lastIds.current[key] = newMsgs[newMsgs.length - 1].id;
        fetchMembers();
      }
    } catch { /* silent */ }
  }, [fetchMembers]);

  // Send text or image — only supports PM chats
  const sendMessage = useCallback(async (chat, text, imageFile) => {
    if ((!text?.trim() && !imageFile) || sending) return false;
    if (!chat || chat.type !== 'pm') return false; // guard: must be a DM
    setSending(true);
    setError(null);
    try {
      const key = chatKey(chat);
      const form = new FormData();
      if (text?.trim()) form.append('message', text.trim());
      if (imageFile) form.append('image', imageFile);
      form.append('receiver_id', String(chat.userId));

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
    // No longer auto-loading org group chat on mount (backend no longer supports it)
  }, []);

  const pollActiveRef = useRef(pollActive);
  useEffect(() => { pollActiveRef.current = pollActive; }, [pollActive]);

  useEffect(() => {
    const id = setInterval(() => pollActiveRef.current(), 4000);
    return () => clearInterval(id);
  }, []);

  const getMessages = (chat) => {
    const key = chatKey(chat);
    return key ? (chats[key] ?? []) : [];
  };

  const editMessage = useCallback(async (chat, messageId, newText, removeImage) => {
    try {
      const key = chatKey(chat);
      const payload = {};
      if (newText !== undefined) payload.message = newText;
      if (removeImage) payload.remove_image = true;

      const { data } = await axios.patch(`/api/messages/${messageId}`, payload, { headers: authHeaders() });
      
      if (data.message === 'deleted') {
        setChats(prev => ({
          ...prev,
          [key]: (prev[key] ?? []).filter(m => m.id !== messageId),
        }));
      } else {
        setChats(prev => ({
          ...prev,
          [key]: (prev[key] ?? []).map(m => m.id === messageId ? data.message : m),
        }));
      }
      return true;
    } catch {
      setError('Failed to edit message.');
      return false;
    }
  }, []);

  const deleteMessage = useCallback(async (chat, messageId) => {
    try {
      const key = chatKey(chat);
      await axios.delete(`/api/messages/${messageId}`, { headers: authHeaders() });
      setChats(prev => ({
        ...prev,
        [key]: (prev[key] ?? []).filter(m => m.id !== messageId),
      }));
      return true;
    } catch {
      setError('Failed to unsend message.');
      return false;
    }
  }, []);

  return {
    members, loading, sending, error,
    getMessages, loadChat, sendMessage, editMessage, deleteMessage,
    refetchMembers: fetchMembers,
    clearError: () => setError(null),
  };
}