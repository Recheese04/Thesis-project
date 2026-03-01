import { useState, useCallback } from 'react';
import { ThemeProvider } from './ThemeContext';
import useMessages from './useMessages';
import useGroupChats from './useGroupChats';
import MessengerSidebar from './MessengerSidebar';
import ChatArea from './ChatArea';
import CreateGroupModal from '../modals/CreateGroupModal';
import GroupSettingsModal from '../modals/GroupSettingsModal';

function MessagesLayout() {
  const [mobileView, setMobileView]         = useState('sidebar');
  const [activeChat, setActiveChat]         = useState(null);
  // activeChat shapes:
  //   null                          → org-wide group chat (original)
  //   { type:'pm', userId, name }   → DM
  //   { type:'gc', groupId }        → custom group chat

  const [showCreateModal, setShowCreateModal]     = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [dmLoaded, setDmLoaded]                   = useState(new Set(['group']));

  // ── Hooks ──────────────────────────────────────────────────────────────────
  const {
    members, loading: dmLoading, sending: dmSending, error: dmError,
    getMessages: getDmMessages, loadChat, sendMessage: sendDm, clearError: clearDmError,
  } = useMessages();

  const {
    groups, loading: gcLoading,
    loadGroupMessages, getGroupMessages, setActiveGroup,
    createGroup, updateGroup, addMembers, removeMember,
    sendMessage: sendGcMessage,
  } = useGroupChats();

  // ── Derived state ──────────────────────────────────────────────────────────
  const isGc      = activeChat?.type === 'gc';
  const isDm      = activeChat?.type === 'pm';
  const isOrgChat = !activeChat;

  const messages = isGc
    ? getGroupMessages(activeChat.groupId)
    : getDmMessages(activeChat);

  const loading = isGc ? gcLoading : dmLoading;
  const sending = isDm ? dmSending : false;
  const error   = isDm ? dmError   : null;

  const activeGroup = isGc
    ? groups.find(g => g.id === activeChat.groupId)
    : null;

  // ── Current user (for GroupSettingsModal) ─────────────────────────────────
  const currentUserId = (() => {
    try {
      const raw = localStorage.getItem('user') ?? sessionStorage.getItem('user');
      return raw ? JSON.parse(raw)?.id : null;
    } catch { return null; }
  })();

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSelectChat = useCallback((chat) => {
    setActiveChat(chat);
    setMobileView('chat');

    if (!chat) return; // org group chat — already loaded

    if (chat.type === 'pm') {
      const key = `pm-${chat.userId}`;
      if (!dmLoaded.has(key)) {
        loadChat(chat);
        setDmLoaded(prev => new Set([...prev, key]));
      }
    } else if (chat.type === 'gc') {
      setActiveGroup(chat.groupId);
      loadGroupMessages(chat.groupId);
    }
  }, [dmLoaded, loadChat, loadGroupMessages, setActiveGroup]);

  const handleSelectGroup = useCallback((group) => {
    handleSelectChat({ type: 'gc', groupId: group.id, name: group.name, avatarColor: group.avatar_color });
  }, [handleSelectChat]);

  const handleSend = useCallback(async (chat, text, image) => {
    if (isGc) return sendGcMessage(chat.groupId, text, image);
    return sendDm(chat, text, image);
  }, [isGc, sendGcMessage, sendDm]);

  const handleCreateGroup = useCallback(async (name, memberIds, color) => {
    const group = await createGroup(name, memberIds, color);
    if (group) {
      setShowCreateModal(false);
      handleSelectGroup(group);
    }
    return group;
  }, [createGroup, handleSelectGroup]);

  const handleRetry = useCallback(() => {
    if (isGc) loadGroupMessages(activeChat.groupId);
    else loadChat(activeChat);
  }, [isGc, activeChat, loadGroupMessages, loadChat]);

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar */}
      <div className={`flex flex-col h-full w-full md:w-80 md:shrink-0 ${mobileView === 'sidebar' ? 'flex' : 'hidden md:flex'}`}>
        <MessengerSidebar
          members={members}
          groups={groups}
          selectedChat={activeChat}
          onSelectChat={handleSelectChat}
          onSelectGroup={handleSelectGroup}
          onCreateGroup={() => setShowCreateModal(true)}
          getMessages={getDmMessages}
          getGroupMessages={getGroupMessages}
        />
      </div>

      {/* Chat area */}
      <div className={`flex-1 flex flex-col h-full min-w-0 ${mobileView === 'chat' ? 'flex' : 'hidden md:flex'}`}>
        <ChatArea
          chat={activeChat}
          messages={messages}
          loading={loading}
          sending={sending}
          error={error}
          members={members}
          activeGroup={activeGroup}
          onSend={handleSend}
          onRetry={handleRetry}
          onClearError={clearDmError}
          onBack={() => setMobileView('sidebar')}
          onOpenGroupSettings={() => setShowSettingsModal(true)}
        />
      </div>

      {/* Create group modal */}
      {showCreateModal && (
        <CreateGroupModal
          members={members}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateGroup}
        />
      )}

      {/* Group settings modal */}
      {showSettingsModal && activeGroup && (
        <GroupSettingsModal
          group={activeGroup}
          allMembers={members}
          currentUserId={currentUserId}
          onClose={() => setShowSettingsModal(false)}
          onUpdate={updateGroup}
          onAddMembers={addMembers}
          onRemoveMember={async (groupId, userId) => {
            const ok = await removeMember(groupId, userId);
            if (ok && userId === currentUserId) {
              setActiveChat(null);
              setMobileView('sidebar');
              setShowSettingsModal(false);
            }
            return ok;
          }}
        />
      )}
    </div>
  );
}

export default function MessagesPage() {
  return (
    <ThemeProvider>
      <MessagesLayout />
    </ThemeProvider>
  );
}