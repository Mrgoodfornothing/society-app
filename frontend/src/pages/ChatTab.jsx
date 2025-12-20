import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import EmojiPicker from 'emoji-picker-react'; 
import { 
  Send, Trash2, Shield, Clock, Lock, UserX, 
  Maximize2, Minimize2, Plus, MoreHorizontal 
} from 'lucide-react';

// Automatically switches to Production URL when deployed
const BASE_URL = window.location.hostname === "localhost" 
  ? "http://localhost:5001" 
  : "https://society-app-backend.onrender.com"; // <--- MAKE SURE THIS MATCHES YOUR RENDER URL

const socket = io(BASE_URL);

const ChatTab = ({ user }) => {
  // State
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  
  // Settings
  const [settings, setSettings] = useState({ adminsOnly: false, globalDisappearingTime: 0 });
  const [localClearTime, setLocalClearTime] = useState(0); 
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  
  // UI Interaction
  const [selectedMsgId, setSelectedMsgId] = useState(null); 
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const bottomRef = useRef(null);

  const ROOM = "society_general";
  const isAdmin = user && (user.role === 'admin' || user.name === 'Admin');

  // Quick Reactions
  const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

  useEffect(() => {
    socket.emit("join_room", ROOM);

    const fetchHistory = async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/messages/${ROOM}/${user._id}`);
        const data = await response.json();
        setMessageList(data.messages || []);
        setSettings(data.settings || {});
      } catch (error) {
        console.error("Failed to load history:", error);
      }
    };
    if (user._id) fetchHistory();

    socket.on("receive_message", (data) => setMessageList((list) => [...list, data]));
    
    socket.on("message_updated", (updatedMsg) => {
      setMessageList((list) => list.map(msg => msg._id === updatedMsg._id ? updatedMsg : msg));
    });

    socket.on("message_deleted", ({ id, type }) => {
      setMessageList((list) => list.filter((msg) => msg._id !== id));
    });

    socket.on("settings_update", (newSettings) => setSettings(newSettings));
    socket.on("error_message", (msg) => alert(msg));

    const handleClickOutside = (e) => {
        if(e.target.closest('.emoji-picker-wrapper')) return;
        setSelectedMsgId(null);
        setShowEmojiPicker(false);
    };
    document.addEventListener('click', handleClickOutside);

    return () => {
      socket.off("receive_message");
      socket.off("message_updated");
      socket.off("message_deleted");
      socket.off("settings_update");
      socket.off("error_message");
      document.removeEventListener('click', handleClickOutside);
    };
  }, [user._id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messageList, isFullScreen]);

  const sendMessage = async () => {
    if (currentMessage.trim() === "") return;
    
    const messageData = {
      room: ROOM,
      author: user.name,
      authorId: user._id,
      role: user.role,
      message: currentMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    await socket.emit("send_message", messageData);
    setCurrentMessage("");
  };

  const handleDelete = (id, type) => {
    socket.emit('delete_message', { 
      messageId: id, 
      userId: user._id, 
      type: type, 
      isAdmin: isAdmin 
    });
    setSelectedMsgId(null);
  };

  const handleReaction = (emojiObject) => {
    const emoji = emojiObject.emoji ? emojiObject.emoji : emojiObject;
    socket.emit('add_reaction', {
      messageId: selectedMsgId,
      userId: user._id,
      userName: user.name,
      emoji: emoji
    });
    setShowEmojiPicker(false);
    setSelectedMsgId(null);
  };

  const handleMute = (targetId) => {
    if(window.confirm("Ban this user from chatting?")) {
        socket.emit('admin_mute_user', { userId: targetId, isMuted: true });
    }
  };

  const filteredMessages = messageList.filter(msg => {
    if (localClearTime === 0) return true;
    const msgTime = new Date(msg.createdAt).getTime();
    return (Date.now() - msgTime) < (localClearTime * 1000);
  });

  return (
    <div className={`
      flex flex-col glass rounded-xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700 transition-all duration-300
      ${isFullScreen 
        ? 'fixed inset-0 z-50 rounded-none h-[100dvh] w-screen' 
        : 'h-[85vh] md:h-[600px] relative'
      }
    `}>
      
      {/* HEADER */}
      <div className="bg-indigo-600 p-3 text-white shadow-md z-10 flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center gap-3">
          {isFullScreen && (
              <button onClick={() => setIsFullScreen(false)} className="hover:bg-indigo-500 p-1 rounded"><Minimize2 size={20}/></button>
          )}
          <div>
            <h3 className="font-bold flex items-center gap-2 text-sm md:text-base">
               Society Chat
               {settings.adminsOnly && <Lock size={14} className="text-yellow-300" />}
               {settings.globalDisappearingTime > 0 && <Clock size={14} className="text-red-300" />}
            </h3>
            <p className="text-[10px] text-indigo-200 hidden md:block">
               {settings.adminsOnly ? "Admins Only" : "Public"} 
               {settings.globalDisappearingTime > 0 && ` • Global Auto-Delete: ${settings.globalDisappearingTime}s`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
            {/* --- UPDATED: THIS IS NOW VISIBLE ON MOBILE --- */}
            <div className="flex items-center gap-1 text-xs bg-indigo-700/50 p-1 rounded">
                <Clock size={12} className="text-indigo-200" />
                <span className="text-indigo-200 hidden sm:inline">History:</span>
                <select 
                    className="bg-transparent font-bold outline-none cursor-pointer text-xs max-w-[80px] sm:max-w-none"
                    value={localClearTime}
                    onChange={(e) => setLocalClearTime(Number(e.target.value))}
                >
                    <option value="0">Forever</option>
                    <option value="600">10m</option>
                    <option value="3600">1h</option>
                    <option value="86400">24h</option>
                </select>
            </div>

            {isAdmin && (
              <button onClick={() => setShowAdminPanel(!showAdminPanel)} className={`p-2 rounded hover:bg-indigo-500 transition ${showAdminPanel ? 'bg-indigo-800' : ''}`}>
                <Shield size={18} />
              </button>
            )}
            
            {!isFullScreen && (
                <button onClick={() => setIsFullScreen(true)} className="p-2 hover:bg-indigo-500 rounded"><Maximize2 size={18}/></button>
            )}
        </div>
      </div>

      {/* ADMIN PANEL */}
      {showAdminPanel && isAdmin && (
        <div className="bg-slate-100 dark:bg-slate-800 p-3 border-b border-indigo-200 grid grid-cols-2 gap-4 text-xs animate-slideDown shadow-inner">
          <button 
            onClick={() => socket.emit('admin_update_settings', { ...settings, adminsOnly: !settings.adminsOnly })}
            className={`p-2 rounded flex items-center justify-center gap-2 font-bold transition ${settings.adminsOnly ? 'bg-red-500 text-white' : 'bg-white text-slate-800 shadow'}`}
          >
            <Lock size={14} /> {settings.adminsOnly ? "Unlock Chat" : "Lock Chat (Admins Only)"}
          </button>
          
          <div className="flex items-center gap-2 bg-white dark:bg-slate-700 p-2 rounded shadow justify-between">
             <span className="text-slate-500 font-bold">Global Disappear:</span>
             <select 
               className="bg-transparent font-bold outline-none text-indigo-600"
               onChange={(e) => socket.emit('admin_update_settings', { ...settings, globalDisappearingTime: Number(e.target.value) })}
               value={settings.globalDisappearingTime}
             >
               <option value="0">Off (Permanent)</option>
               <option value="30">30s (Test)</option>
               <option value="3600">1 Hour</option>
               <option value="86400">24 Hours</option>
             </select>
          </div>
        </div>
      )}

      {/* MESSAGES AREA */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50" 
        onClick={(e) => { e.stopPropagation(); setSelectedMsgId(null); setShowEmojiPicker(false); }}
      >
        {filteredMessages.map((msg, index) => {
          const isMe = msg.author === user.name;
          const isMsgAdmin = msg.role === 'admin';
          const isRecent = (Date.now() - new Date(msg.createdAt).getTime()) < (60 * 60 * 1000); 

          return (
            <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'} relative`}>
              
              <div 
                onClick={(e) => {
                    e.stopPropagation(); 
                    if(selectedMsgId === msg._id) {
                        setSelectedMsgId(null);
                        setShowEmojiPicker(false);
                    } else {
                        setSelectedMsgId(msg._id);
                        setShowEmojiPicker(false);
                    }
                }}
                className={`max-w-[85%] md:max-w-[70%] p-3 rounded-2xl relative cursor-pointer transition transform active:scale-[0.98] ${
                isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 
                isMsgAdmin ? 'bg-red-50 border border-red-200 text-slate-800' : 
                'bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-tl-none shadow-sm'
              }`}>
                {!isMe && (
                   <div className="flex justify-between items-start">
                       <p className="text-xs font-bold text-orange-500 mb-1">{msg.author}</p>
                       {isAdmin && !isMsgAdmin && (
                           <button onClick={(e) => { e.stopPropagation(); handleMute(msg.authorId); }} className="text-slate-300 hover:text-red-500">
                               <UserX size={12} />
                           </button>
                       )}
                   </div>
                )}
                
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                
                <div className="flex justify-between items-end mt-1 gap-4">
                    <div className="flex -space-x-1">
                        {msg.reactions && msg.reactions.map((r, i) => (
                            <span key={i} className="text-[10px] bg-white/20 dark:bg-black/20 rounded-full px-1 py-0.5 backdrop-blur-sm" title={r.userName}>
                                {r.emoji}
                            </span>
                        ))}
                    </div>
                    <p className={`text-[10px] ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>{msg.time}</p>
                </div>
              </div>

              {/* CONTEXT MENU POPUP */}
              {selectedMsgId === msg._id && (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className={`absolute top-full mt-2 z-30 bg-white dark:bg-slate-800 shadow-2xl rounded-xl border border-slate-200 dark:border-slate-600 w-64 animate-fadeIn ${isMe ? 'right-0' : 'left-0'}`}
                  >
                      {/* 1. Emoji Bar */}
                      <div className="flex items-center justify-between p-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                          {REACTION_EMOJIS.map(emoji => (
                              <button key={emoji} onClick={() => handleReaction(emoji)} className="hover:scale-125 transition text-lg px-1">
                                  {emoji}
                              </button>
                          ))}
                          <button 
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className="bg-slate-200 dark:bg-slate-700 rounded-full p-1 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300"
                          >
                            <Plus size={14} />
                          </button>
                      </div>

                      {/* 2. Full Emoji Picker */}
                      {showEmojiPicker && (
                          <div className="absolute top-12 left-0 z-40 emoji-picker-wrapper">
                              <EmojiPicker 
                                onEmojiClick={handleReaction} 
                                width={300} 
                                height={350} 
                                theme="auto"
                              />
                          </div>
                      )}

                      {/* 3. Actions */}
                      {!showEmojiPicker && (
                          <div className="py-1">
                              <button 
                                onClick={() => handleDelete(msg._id, 'me')}
                                className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-3"
                              >
                                <Trash2 size={16} className="text-slate-400" /> Delete for Me
                              </button>

                              {(isAdmin || (isMe && isRecent)) && (
                                  <button 
                                    onClick={() => handleDelete(msg._id, 'everyone')}
                                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 border-t border-slate-100 dark:border-slate-700"
                                  >
                                    <Shield size={16} /> Delete for Everyone
                                  </button>
                              )}
                          </div>
                      )}
                  </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* INPUT AREA */}
      <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2 sticky bottom-0 z-20">
        <input
          type="text"
          value={currentMessage}
          placeholder={settings.adminsOnly && !isAdmin ? "🔒 Chat locked by Admin" : "Type a message..."}
          disabled={settings.adminsOnly && !isAdmin}
          className="flex-1 p-3 rounded-full bg-slate-100 dark:bg-slate-900 border-none focus:ring-2 focus:ring-indigo-500 transition outline-none dark:text-white disabled:opacity-50"
          onKeyPress={(e) => e.key === "Enter" && !settings.adminsOnly && sendMessage()}
          onChange={(event) => setCurrentMessage(event.target.value)}
        />
        <button 
          onClick={sendMessage} 
          disabled={settings.adminsOnly && !isAdmin}
          className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 shadow-lg disabled:bg-slate-400"
        >
          <Send size={20} />
        </button>
      </div>

      {/* Resize Handle Indicator - Visible only on Desktop */}
      <div className="hidden md:block absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-50 bg-indigo-500 rounded-tl"></div>
    </div>
  );
};

export default ChatTab;