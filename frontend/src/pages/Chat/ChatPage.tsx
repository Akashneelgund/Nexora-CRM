import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { ChatRoom, ChatMessage } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  MessageSquare,
  Send,
  Pin,
  Users,
  Search,
  Smile,
  Paperclip,
  CheckCheck,
  Sparkles,
  ShieldCheck,
  Megaphone
} from 'lucide-react';

export const ChatPage: React.FC = () => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string>('room-announcements');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [sending, setSending] = useState<boolean>(false);
  const { user } = useAuth();
  const { socket } = useSocket();
  const { showToast } = useNotifications();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getChatRooms()
      .then(res => {
        if (res.success) {
          setRooms(res.rooms || []);
          if (res.rooms?.length > 0) {
            setActiveRoomId(res.rooms[0].id);
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const fetchMessages = (roomId: string) => {
    api.getRoomMessages(roomId)
      .then(res => {
        if (res.success) {
          setMessages(res.messages || []);
        }
      })
      .catch(console.error);
  };

  useEffect(() => {
    if (activeRoomId) {
      fetchMessages(activeRoomId);
      if (socket) {
        socket.emit('join_room', activeRoomId);
      }
    }
  }, [activeRoomId, socket]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg: any) => {
      if (msg.roomId === activeRoomId) {
        setMessages(prev => [...prev, msg]);
      }
    };

    socket.on('new_message', handleNewMessage);
    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [socket, activeRoomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeRoomId) return;

    const msgContent = inputText;
    setInputText('');
    setSending(true);

    try {
      const res = await api.sendChatMessage({
        roomId: activeRoomId,
        message: msgContent
      });

      if (res.success) {
        setMessages(prev => [...prev, res.message]);
        if (socket) {
          socket.emit('send_message', {
            roomId: activeRoomId,
            ...res.message
          });
        }
      }
    } catch (err: any) {
      showToast('Chat Error', err.message || 'Failed to send message', 'error');
    } finally {
      setSending(false);
    }
  };

  const activeRoom = rooms.find(r => r.id === activeRoomId) || rooms[0];

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in pb-24">
      <div className="glass-card h-[78vh] flex overflow-hidden shadow-2xl border-white/[0.08]">
        {/* Left: Channels & Pod Lounges */}
        <div className="w-72 sm:w-80 bg-black/40 border-r border-white/[0.08] flex flex-col">
          <div className="p-4 border-b border-white/[0.08]">
            <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <span>Internal Channels</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Real-time team chat & announcements</p>
          </div>

          <div className="p-3 overflow-y-auto space-y-1.5 flex-1">
            {rooms.map(room => {
              const isSelected = room.id === activeRoomId;
              const isAnnouncement = room.room_type === 'announcement';

              return (
                <button
                  key={room.id}
                  onClick={() => setActiveRoomId(room.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                    isSelected
                      ? 'bg-indigo-600/20 border border-indigo-500/40 text-white shadow-md shadow-indigo-600/10'
                      : 'hover:bg-white/[0.04] text-slate-300 border border-transparent'
                  }`}
                >
                  <div className={`p-2 rounded-xl shrink-0 ${
                    isSelected ? 'bg-indigo-600 text-white' : 'bg-white/[0.06] text-slate-400'
                  }`}>
                    {isAnnouncement ? <Megaphone className="w-4 h-4 text-amber-300" /> : <Users className="w-4 h-4" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold truncate text-white">{room.name}</div>
                    <div className={`text-[10px] truncate ${isSelected ? 'text-indigo-300 font-medium' : 'text-slate-500'}`}>
                      {room.last_message || 'Active conversation channel'}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Active Chat Room Window */}
        <div className="flex-1 flex flex-col bg-[#090B10]">
          {/* Channel Header */}
          <div className="h-16 px-6 border-b border-white/[0.08] flex items-center justify-between bg-black/20 backdrop-blur-md">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>{activeRoom?.name}</span>
              </h3>
              <span className="text-[10px] text-slate-400">All authenticated sales staff members connected</span>
            </div>

            <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Socket Live</span>
            </span>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {messages.map((m, idx) => {
              const isMe = m.sender_id === user?.id;

              return (
                <div
                  key={m.id || idx}
                  className={`flex items-start gap-3 ${isMe ? 'flex-row-reverse' : ''}`}
                >
                  <img
                    src={m.sender_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt={m.sender_name}
                    className="w-8 h-8 rounded-xl object-cover border border-white/[0.1] shrink-0 shadow-md"
                  />

                  <div className={`max-w-[70%] ${isMe ? 'items-end text-right' : ''}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-white">{m.sender_name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div
                      className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                        isMe
                          ? 'bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-600/20'
                          : m.is_pinned
                          ? 'bg-amber-500/10 border border-amber-500/30 text-amber-200 rounded-tl-none'
                          : 'bg-[#121726] border border-white/[0.08] text-slate-200 rounded-tl-none shadow-md'
                      }`}
                    >
                      {m.is_pinned === 1 && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-amber-300 uppercase tracking-wider mb-1">
                          <Pin className="w-3 h-3" /> Pinned Announcement
                        </div>
                      )}
                      <p className="whitespace-pre-line">{m.message}</p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-white/[0.08] bg-black/40 flex items-center gap-2">
            <input
              type="text"
              placeholder={`Message ${activeRoom?.name || 'channel'}...`}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              className="flex-1 px-4 py-2.5 glass-input text-xs"
            />
            <button
              type="submit"
              disabled={sending || !inputText.trim()}
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50 active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
