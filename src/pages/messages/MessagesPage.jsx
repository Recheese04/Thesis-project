import { useState } from 'react';
import { ThemeProvider } from './ThemeContext';
import useMessages from './useMessages';
import MessengerSidebar from './MessengerSidebar';
import ChatArea from './ChatArea';

function MessagesLayout() {
  const [activeChat, setActiveChat] = useState(null);
  const [mobileView, setMobileView] = useState('sidebar');
  const [chatLoaded, setChatLoaded] = useState(new Set(['group']));

  const {
    members, loading, sending, error,
    getMessages, loadChat, sendMessage,
    refetchMembers, clearError,
  } = useMessages();

  const handleSelectChat = (chat) => {
    const key = chat ? `pm-${chat.userId}` : 'group';
    setActiveChat(chat);
    setMobileView('chat');
    if (!chatLoaded.has(key)) {
      loadChat(chat);
      setChatLoaded(prev => new Set([...prev, key]));
    }
  };

  const messages = getMessages(activeChat);

  return (
    // h-full fills whatever the layout gives us — no hardcoded heights
    <div className="flex h-full overflow-hidden">

      {/* Sidebar — full width on mobile, fixed 320px on desktop */}
      <div className={`
        flex flex-col h-full
        w-full md:w-80 md:shrink-0
        ${mobileView === 'sidebar' ? 'flex' : 'hidden md:flex'}
      `}>
        <MessengerSidebar
          members={members}
          selectedChat={activeChat}
          onSelectChat={handleSelectChat}
          getMessages={getMessages}
        />
      </div>

      {/* Chat — fills remaining space */}
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
          onBack={() => setMobileView('sidebar')}
        />
      </div>
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