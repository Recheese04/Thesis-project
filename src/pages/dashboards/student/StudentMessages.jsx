import { useState } from 'react';
import { Send, Search, Circle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function StudentMessages() {
  const [selectedChat, setSelectedChat] = useState(1);
  const [messageText, setMessageText] = useState('');

  // Mock data
  const conversations = [
    {
      id: 1,
      name: 'CS Society',
      lastMessage: 'Workshop registration is now open',
      time: '2:30 PM',
      unread: 2,
      isOnline: true,
    },
    {
      id: 2,
      name: 'Student Council',
      lastMessage: 'General Assembly next week',
      time: 'Yesterday',
      unread: 0,
      isOnline: false,
    },
  ];

  const messages = [
    {
      id: 1,
      sender: 'CS Society',
      content: 'Workshop registration is now open',
      time: '2:15 PM',
      isMine: false,
    },
    {
      id: 2,
      sender: 'You',
      content: 'What topics will be covered?',
      time: '2:18 PM',
      isMine: true,
    },
    {
      id: 3,
      sender: 'CS Society',
      content: 'React, Node.js, and MongoDB',
      time: '2:30 PM',
      isMine: false,
    },
  ];

  const currentChat = conversations.find((c) => c.id === selectedChat);

  const handleSend = () => {
    if (messageText.trim()) {
      console.log('Send:', messageText);
      setMessageText('');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Messages</h1>
        <p className="text-slate-600 mt-1">Communicate with organizations</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="flex h-[600px]">
            {/* Chat List */}
            <div className="w-80 border-r flex flex-col">
              <div className="p-4 border-b">
                <Input placeholder="Search..." />
              </div>
              <div className="flex-1 overflow-y-auto">
                {conversations.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => setSelectedChat(chat.id)}
                    className={`w-full p-4 flex items-start gap-3 hover:bg-slate-50 border-b ${
                      selectedChat === chat.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="relative">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                          {chat.name.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      {chat.isOnline && (
                        <Circle className="absolute bottom-0 right-0 w-3 h-3 text-green-500 fill-green-500 ring-2 ring-white" />
                      )}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex justify-between mb-1">
                        <h3 className="font-semibold text-slate-900 truncate">{chat.name}</h3>
                        <span className="text-xs text-slate-500">{chat.time}</span>
                      </div>
                      <p className="text-sm text-slate-600 truncate">{chat.lastMessage}</p>
                    </div>
                    {chat.unread > 0 && (
                      <Badge className="bg-blue-500 text-white">{chat.unread}</Badge>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {/* Header */}
              <div className="p-4 border-b">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                      {currentChat?.name.slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-semibold text-slate-900">{currentChat?.name}</h2>
                    {currentChat?.isOnline && (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <Circle className="w-2 h-2 fill-current" />
                        Online
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.isMine ? 'justify-end' : ''}`}>
                    <div className={`max-w-[70%] ${msg.isMine ? 'items-end' : ''}`}>
                      <div
                        className={`rounded-2xl px-4 py-2 ${
                          msg.isMine
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                            : 'bg-slate-100 text-slate-900'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                      </div>
                      <span className="text-xs text-slate-500 mt-1 block">{msg.time}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input */}
              <div className="p-4 border-t">
                <div className="flex gap-3">
                  <Textarea
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    className="resize-none"
                    rows={1}
                  />
                  <Button onClick={handleSend} className="gap-2">
                    <Send className="w-4 h-4" />
                    Send
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}