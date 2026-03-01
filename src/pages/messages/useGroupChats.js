import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

function authHeaders() {
  const token =
    localStorage.getItem('token') ||
    localStorage.getItem('auth_token') ||
    axios.defaults.headers.common?.['Authorization']?.replace('Bearer ', '') ||
    null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function useGroupChats() {
  const [groups, setGroups]     = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [msgMap, setMsgMap]     = useState({});
  const pollRef                 = useRef(null);
  const lastIdRef               = useRef({});

  const fetchGroups = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/group-chats', { headers: authHeaders() });
      setGroups(data.groups ?? []);
    } catch (e) {
      if (e.response?.status === 401) {
        clearInterval(pollRef.current);
      }
    }
  }, []);

  const fetchMessages = useCallback(async (groupId, afterId = null) => {
    try {
      const params = afterId ? { after_id: afterId } : {};
      const { data } = await axios.get(`/api/group-chats/${groupId}/messages`, {
        params,
        headers: authHeaders(),
      });
      const incoming = data.messages ?? [];
      if (incoming.length === 0) return;

      setMsgMap(prev => {
        const existing = prev[groupId] ?? [];
        const existingIds = new Set(existing.map(m => m.id));
        const fresh = incoming.filter(m => !existingIds.has(m.id));
        if (fresh.length === 0) return prev;
        return { ...prev, [groupId]: [...existing, ...fresh] };
      });

      const last = incoming[incoming.length - 1];
      if (last) lastIdRef.current[groupId] = last.id;
    } catch { /* silent */ }
  }, []);

  const loadGroupMessages = useCallback(async (groupId) => {
    setLoading(true);
    await fetchMessages(groupId, null);
    setLoading(false);
  }, [fetchMessages]);

  const createGroup = useCallback(async (name, memberIds, avatarColor) => {
    setError(null);
    try {
      const { data } = await axios.post('/api/group-chats',
        { name, member_ids: memberIds, avatar_color: avatarColor },
        { headers: authHeaders() }
      );
      setGroups(prev => [data.group, ...prev]);
      return data.group;
    } catch (e) {
      setError('Failed to create group.');
      return null;
    }
  }, []);

  const updateGroup = useCallback(async (groupId, payload) => {
    try {
      const { data } = await axios.patch(`/api/group-chats/${groupId}`, payload, { headers: authHeaders() });
      setGroups(prev => prev.map(g => g.id === groupId ? { ...g, ...data.group } : g));
      return data.group;
    } catch { return null; }
  }, []);

  const addMembers = useCallback(async (groupId, userIds) => {
    try {
      const { data } = await axios.post(`/api/group-chats/${groupId}/members`,
        { user_ids: userIds },
        { headers: authHeaders() }
      );
      setGroups(prev => prev.map(g => g.id === groupId ? { ...g, ...data.group } : g));
      return true;
    } catch { return false; }
  }, []);

  const removeMember = useCallback(async (groupId, userId) => {
    try {
      await axios.delete(`/api/group-chats/${groupId}/members/${userId}`, { headers: authHeaders() });
      await fetchGroups();
      return true;
    } catch { return false; }
  }, [fetchGroups]);

  const sendMessage = useCallback(async (groupId, text, imageFile) => {
    try {
      const form = new FormData();
      if (text?.trim()) form.append('message', text.trim());
      if (imageFile)    form.append('image', imageFile);

      const { data } = await axios.post(`/api/group-chats/${groupId}/messages`, form, {
        headers: { ...authHeaders(), 'Content-Type': 'multipart/form-data' },
      });

      const msg = data.message;
      setMsgMap(prev => ({
        ...prev,
        [groupId]: [...(prev[groupId] ?? []), msg],
      }));
      lastIdRef.current[groupId] = msg.id;

      setGroups(prev => prev.map(g => g.id === groupId
        ? { ...g, last_message: msg.image_url ? '📷 Image' : msg.message, last_time: msg.created_at }
        : g
      ));

      return true;
    } catch { return false; }
  }, []);

  const getGroupMessages = useCallback((groupId) => {
    return msgMap[groupId] ?? [];
  }, [msgMap]);

  const activeGroupRef = useRef(null);
  const setActiveGroup = useCallback((groupId) => {
    activeGroupRef.current = groupId;
  }, []);

  useEffect(() => {
    fetchGroups();

    pollRef.current = setInterval(() => {
      fetchGroups();
      const gid = activeGroupRef.current;
      if (gid) {
        const lastId = lastIdRef.current[gid] ?? null;
        fetchMessages(gid, lastId);
      }
    }, 4000);

    return () => clearInterval(pollRef.current);
  }, []);

  return {
    groups,
    loading,
    error,
    fetchGroups,
    loadGroupMessages,
    getGroupMessages,
    setActiveGroup,
    createGroup,
    updateGroup,
    addMembers,
    removeMember,
    sendMessage,
  };
}