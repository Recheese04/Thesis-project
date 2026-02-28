import { useState, useEffect } from 'react';
import useMessages from '../../messages/useMessages';
import MessengerSidebar from '../../messages/MessengerSidebar';
import ChatArea from '../../messages/ChatArea';

/**
 * OfficerMessages — dedicated full-viewport messaging layout.
 *
 * This component deliberately overrides the parent layout's padding/scroll
 * by using fixed positioning relative to the officer layout shell.
 *
 * Mobile  : sidebar fills screen → tap → chat fills screen → back → sidebar
 * Desktop : sidebar (340px) + chat panel side by side, nothing on page scrolls
 */
export default function OfficerMessages() {
  // null  = group chat selected
  // { type:'pm', userId, name, role, position } = PM selected
  const [activeChat, setActiveChat]   = useState(null);
  const [mobileView, setMobileView]   = useState('sidebar'); // 'sidebar' | 'chat'
  const [chatLoaded, setChatLoaded]   = useState(new Set(['group']));

  const {
    members, loading, sending, error,
    getMessages, loadChat, sendMessage,
    refetchMembers, clearError,
  } = useMessages();

  // When a chat is selected, load it if we haven't yet
  const handleSelectChat = (chat) => {
    const key = chat ? `pm-${chat.userId}` : 'group';
    setActiveChat(chat);
    setMobileView('chat');
    if (!chatLoaded.has(key)) {
      loadChat(chat);
      setChatLoaded(prev => new Set([...prev, key]));
    }
  };

  const handleBack = () => setMobileView('sidebar');

  const messages = getMessages(activeChat);

  return (
    /**
     * LAYOUT:
     * We use h-screen and subtract the officer sidebar/topbar height.
     * OfficerLayout typically has a top header of ~64px.
     * Adjust the calc() value if your layout header is a different height.
     */
    <div
      className="flex overflow-hidden bg-white"
      style={{
        height: 'calc(100vh - 64px)',  // adjust 64px to match your OfficerLayout header
      }}
    >
      {/* ── SIDEBAR ──────────────────────────────────────────────────────────
          Mobile : full screen, hidden when mobileView === 'chat'
          Desktop: fixed 340px left column, always visible
      ────────────────────────────────────────────────────────────────────── */}
      <div className={`
        flex flex-col h-full
        w-full md:w-[340px] md:shrink-0
        border-r border-slate-200
        ${mobileView === 'sidebar' ? 'flex' : 'hidden md:flex'}
      `}>
        <MessengerSidebar
          members={members}
          selectedChat={activeChat}
          onSelectChat={handleSelectChat}
          getMessages={getMessages}
        />
      </div>

      {/* ── CHAT ─────────────────────────────────────────────────────────────
          Mobile : full screen, hidden when mobileView === 'sidebar'
          Desktop: fills all remaining width
      ────────────────────────────────────────────────────────────────────── */}
      <div className={`
        flex-1 flex flex-col h-full min-w-0
        ${mobileView === 'chat' ? 'flex' : 'hidden md:flex'}
      `}>
        <ChatArea
          chat={activeChat}
          messages={messages}
          loading={loading}
          sending={sending}
          error={error}
          members={members}
          onSend={sendMessage}
          onRetry={() => loadChat(activeChat)}
          onClearError={clearError}
          onBack={handleBack}
        />
      </div>
    </div>
  );
}