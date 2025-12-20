import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import EmojiPicker from 'emoji-picker-react';
import axios from 'axios';
import { 
  Send, Trash2, Shield, Clock, Lock, UserX, 
  Maximize2, Minimize2, Plus, 
  Image as ImageIcon, FileText, Mic, X, Video, Download, ExternalLink
} from 'lucide-react';

// Automatically switches to Production URL when deployed
const BASE_URL = window.location.hostname === "localhost" 
  ? "http://localhost:5001" 
  : "https://society-app-backend.onrender.com"; 

const socket = io(BASE_URL);

const ChatTab = ({ user }) => {
  // --- STATE ---
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const [settings, setSettings] = useState({ adminsOnly: false, globalDisappearingTime: 0 });
  const [localClearTime, setLocalClearTime] = useState(0); 
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  
  // Interactions
  const [selectedMsgId, setSelectedMsgId] = useState(null); 
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  
  // Media
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  // Audio Recording
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  
  // Full Screen Viewer
  const [fullScreenMedia, setFullScreenMedia] = useState(null);

  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);

  const ROOM = "society_general";
  const isAdmin = user && (user.role === 'admin' || user.name === 'Admin');
  const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

  useEffect(() => {
    socket.emit("join_room", ROOM);
    fetchHistory();
    setupSocketListeners();
    document.addEventListener('click', handleClickOutside);
    return () => {
        cleanupSocketListeners();
        document.removeEventListener('click', handleClickOutside);
    };
  }, [user._id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messageList, isFullScreen, previewUrl, audioUrl]);

  // --- HELPERS ---

  const fetchHistory = async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/messages/${ROOM}/${user._id}`);
        const data = await response.json();
        setMessageList(data.messages || []);
        setSettings(data.settings || {});
      } catch (error) { console.error("History Error:", error); }
  };

  const setupSocketListeners = () => {
    socket.on("receive_message", (data) => setMessageList((list) => [...list, data]));
    socket.on("message_updated", (updatedMsg) => setMessageList((list) => list.map(msg => msg._id === updatedMsg._id ? updatedMsg : msg)));
    socket.on("message_deleted", ({ id }) => setMessageList((list) => list.filter((msg) => msg._id !== id)));
    socket.on("settings_update", (newSettings) => setSettings(newSettings));
    
    // NEW: Listen for Ban/Unban alerts
    socket.on("system_notification", (msg) => alert(msg));
  };

  const cleanupSocketListeners = () => {
    socket.off("receive_message");
    socket.off("message_updated");
    socket.off("message_deleted");
    socket.off("settings_update");
    socket.off("system_notification");
  };

  const handleClickOutside = (e) => {
    if(e.target.closest('.emoji-picker-wrapper') || e.target.closest('.attach-menu')) return;
    setSelectedMsgId(null);
    setShowEmojiPicker(false);
    setShowAttachMenu(false);
  };

  // --- FILE HANDLING ---

  const handleFileSelect = (e) => {
      const file = e.target.files[0];
      if(!file) return;
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setShowAttachMenu(false);
  };

  const triggerFileInput = (type) => {
      if(fileInputRef.current) {
          fileInputRef.current.accept = type === 'image' ? "image/*,video/*" : "*/*";
          fileInputRef.current.click();
      }
  };

  // --- AUDIO RECORDING ---

  const startRecording = async () => {
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;
          const chunks = [];

          mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

          mediaRecorder.onstop = () => {
              const blob = new Blob(chunks, { type: 'audio/webm' });
              setAudioBlob(blob);
              setAudioUrl(URL.createObjectURL(blob));
              setIsRecording(false);
          };

          mediaRecorder.start();
          setIsRecording(true);
      } catch (err) {
          alert("Microphone access denied!");
      }
  };

  const stopRecording = () => {
      if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.stop();
      }
  };

  const cancelAttachment = () => {
      setSelectedFile(null);
      setPreviewUrl(null);
      setAudioBlob(null);
      setAudioUrl(null);
      if(fileInputRef.current) fileInputRef.current.value = "";
  };

  // --- SENDING ---

  const sendMessage = async () => {
    if ((currentMessage.trim() === "") && !selectedFile && !audioBlob) return;
    
    let uploadedFileUrl = "";
    let uploadedFileType = "text";
    let uploadedFileName = "";

    if (selectedFile || audioBlob) {
        const formData = new FormData();
        if (selectedFile) {
            formData.append('file', selectedFile);
            uploadedFileType = selectedFile.type.startsWith('image') ? 'image' : selectedFile.type.startsWith('video') ? 'video' : 'file';
        } else if (audioBlob) {
            formData.append('file', audioBlob, "voice_message.webm");
            uploadedFileType = 'audio';
        }

        try {
            const { data } = await axios.post(`${BASE_URL}/api/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            uploadedFileUrl = data.fileUrl;
            uploadedFileName = data.fileName;
        } catch (error) {
            alert("Upload failed");
            return;
        }
    }

    const messageData = {
      room: ROOM,
      author: user.name,
      authorId: user._id,
      role: user.role,
      message: currentMessage,
      fileUrl: uploadedFileUrl,
      fileType: uploadedFileType,
      fileName: uploadedFileName,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    await socket.emit("send_message", messageData);
    setCurrentMessage("");
    cancelAttachment();
  };

  // --- ACTIONS ---
  const handleDelete = (id, type) => {
    socket.emit('delete_message', { 
      messageId: id, 
      userId: user._id, 
      type: type, 
      isAdmin: isAdmin 
    });
    setSelectedMsgId(null);
  };

  // UPDATED BAN FUNCTION
  const handleMute = (targetId, targetName) => {
    if(window.confirm(`Are you sure you want to BAN/UNBAN ${targetName}?`)) {
        // Just send the ID, server toggles the state
        socket.emit('admin_mute_user', { userId: targetId });
    }
  };

  // --- RENDER CONTENT ---
  const renderMessageContent = (msg) => {
      const fullUrl = `${BASE_URL}${msg.fileUrl}`;
      
      if(msg.fileType === 'image') {
          return (
              <div className="mt-1 group cursor-pointer" onClick={(e) => { e.stopPropagation(); setFullScreenMedia({ url: fullUrl, type: 'image' }); }}>
                  <img src={fullUrl} alt="attachment" className="rounded-lg max-h-60 max-w-full object-cover border border-slate-200 dark:border-slate-600" />
                  {msg.message && <p className="mt-2 text-sm">{msg.message}</p>}
              </div>
          );
      }
      if(msg.fileType === 'video') {
          return (
              <div className="mt-1 cursor-pointer" onClick={(e) => { e.stopPropagation(); setFullScreenMedia({ url: fullUrl, type: 'video' }); }}>
                  <div className="relative">
                     <video src={fullUrl} className="rounded-lg max-h-60 max-w-full bg-black" />
                     <div className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/10 transition"><span className="p-2 bg-white/20 rounded-full backdrop-blur"><Video className="text-white"/></span></div>
                  </div>
                  {msg.message && <p className="mt-2 text-sm">{msg.message}</p>}
              </div>
          );
      }
      if(msg.fileType === 'audio') {
          return (
              <div className="mt-1 flex items-center gap-2 min-w-[200px] bg-slate-100 dark:bg-slate-800 p-2 rounded-lg" onClick={e => e.stopPropagation()}>
                  <div className="p-2 bg-indigo-500 rounded-full text-white"><Mic size={16} /></div>
                  <audio controls className="h-8 w-48 custom-audio"><source src={fullUrl} type="audio/webm" /></audio>
              </div>
          );
      }
      if(msg.fileType === 'file') {
          return (
              <div 
                className="mt-1 bg-slate-100 dark:bg-slate-800 p-3 rounded flex items-center gap-3 border border-slate-200 dark:border-slate-600 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                onClick={(e) => { e.stopPropagation(); window.open(fullUrl, '_blank'); }}
              >
                  <FileText size={28} className="text-red-500 shrink-0" />
                  <div className="overflow-hidden">
                      <p className="text-sm font-bold truncate max-w-[180px] text-slate-700 dark:text-slate-200">{msg.fileName}</p>
                      <p className="text-[10px] text-slate-500 flex items-center gap-1">TAP TO OPEN <ExternalLink size={10} /></p>
                  </div>
              </div>
          );
      }
      return <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>;
  };

  const filteredMessages = messageList.filter(msg => {
    if (localClearTime === 0) return true;
    const msgTime = new Date(msg.createdAt).getTime();
    return (Date.now() - msgTime) < (localClearTime * 1000);
  });

  return (
    <>
    {/* FULL SCREEN MEDIA OVERLAY */}
    {fullScreenMedia && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn" onClick={() => setFullScreenMedia(null)}>
            <button className="absolute top-4 right-4 text-white p-2 bg-white/10 rounded-full hover:bg-white/20"><X size={24}/></button>
            <div className="max-w-full max-h-full" onClick={e => e.stopPropagation()}>
                {fullScreenMedia.type === 'image' ? (
                    <img src={fullScreenMedia.url} className="max-w-full max-h-[90vh] object-contain rounded-md shadow-2xl" alt="Full view" />
                ) : (
                    <video src={fullScreenMedia.url} controls autoPlay className="max-w-full max-h-[90vh] rounded-md shadow-2xl" />
                )}
            </div>
        </div>
    )}

    <div className={`flex flex-col glass rounded-xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700 transition-all duration-300 ${isFullScreen ? 'fixed inset-0 z-50 rounded-none h-[100dvh] w-screen' : 'h-[85vh] md:h-[600px] relative'}`}>
      
      {/* HEADER */}
      <div className="bg-indigo-600 p-3 text-white shadow-md z-10 flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center gap-3">
          {isFullScreen && <button onClick={() => setIsFullScreen(false)} className="hover:bg-indigo-500 p-1 rounded"><Minimize2 size={20}/></button>}
          <div>
            <h3 className="font-bold flex items-center gap-2 text-sm md:text-base">
               Society Chat {settings.adminsOnly && <Lock size={14} className="text-yellow-300" />} {settings.globalDisappearingTime > 0 && <Clock size={14} className="text-red-300" />}
            </h3>
            <p className="text-[10px] text-indigo-200 hidden md:block">
               {settings.adminsOnly ? "Admins Only" : "Public"} {settings.globalDisappearingTime > 0 && ` • Global Auto-Delete: ${settings.globalDisappearingTime}s`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs bg-indigo-700/50 p-1 rounded">
                <Clock size={12} className="text-indigo-200" />
                <select className="bg-transparent font-bold outline-none cursor-pointer text-xs text-white" value={localClearTime} onChange={(e) => setLocalClearTime(Number(e.target.value))}>
                    <option value="0" className="text-black">History: Forever</option>
                    <option value="600" className="text-black">10m</option>
                    <option value="3600" className="text-black">1h</option>
                    <option value="86400" className="text-black">24h</option>
                </select>
            </div>
            {isAdmin && <button onClick={() => setShowAdminPanel(!showAdminPanel)} className={`p-2 rounded hover:bg-indigo-500 transition ${showAdminPanel ? 'bg-indigo-800' : ''}`}><Shield size={18} /></button>}
            {!isFullScreen && <button onClick={() => setIsFullScreen(true)} className="p-2 hover:bg-indigo-500 rounded"><Maximize2 size={18}/></button>}
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50" onClick={(e) => { e.stopPropagation(); setSelectedMsgId(null); setShowEmojiPicker(false); setShowAttachMenu(false); }}>
        {filteredMessages.map((msg, index) => {
          const isMe = msg.author === user.name;
          const isMsgAdmin = msg.role === 'admin';
          const isRecent = (Date.now() - new Date(msg.createdAt).getTime()) < (60 * 60 * 1000); 

          return (
            <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'} relative`}>
              <div 
                onClick={(e) => { e.stopPropagation(); setSelectedMsgId(selectedMsgId === msg._id ? null : msg._id); }}
                className={`max-w-[85%] md:max-w-[70%] p-3 rounded-2xl relative cursor-pointer transition transform active:scale-[0.98] ${isMe ? 'bg-indigo-600 text-white rounded-tr-none' : isMsgAdmin ? 'bg-red-50 border border-red-200 text-slate-800' : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-tl-none shadow-sm'}`}
              >
                {/* --- RESTORED BAN BUTTON HEADER --- */}
                {!isMe && (
                   <div className="flex justify-between items-start">
                       <p className="text-xs font-bold text-orange-500 mb-1">{msg.author}</p>
                       {/* ADMIN ONLY: Show Ban Button (if target is not also admin) */}
                       {isAdmin && !isMsgAdmin && (
                           <button 
                             onClick={(e) => { 
                               e.stopPropagation(); 
                               handleMute(msg.authorId, msg.author); 
                             }} 
                             className="text-slate-300 hover:text-red-500 p-1 rounded"
                             title="Ban/Unban this user"
                           >
                               <UserX size={12} />
                           </button>
                       )}
                   </div>
                )}
                
                {renderMessageContent(msg)}

                <div className="flex justify-between items-end mt-1 gap-4">
                    <div className="flex -space-x-1">{msg.reactions && msg.reactions.map((r, i) => <span key={i} className="text-[10px] bg-white/20 rounded-full px-1">{r.emoji}</span>)}</div>
                    <p className={`text-[10px] ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>{msg.time}</p>
                </div>
              </div>
              
              {/* MENU */}
              {selectedMsgId === msg._id && (
                  <div className={`absolute top-full mt-2 z-30 bg-white dark:bg-slate-800 shadow-2xl rounded-xl border border-slate-200 w-64 ${isMe ? 'right-0' : 'left-0'}`}>
                      <div className="flex justify-between p-2 bg-slate-50 dark:bg-slate-900/50">
                          {REACTION_EMOJIS.map(emoji => <button key={emoji} onClick={() => { socket.emit('add_reaction', { messageId: selectedMsgId, userId: user._id, userName: user.name, emoji }); setSelectedMsgId(null); }} className="hover:scale-125 px-1">{emoji}</button>)}
                      </div>
                      <div className="py-1">
                          <button onClick={() => handleDelete(msg._id, 'me')} className="w-full px-4 py-2 text-sm flex gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300">
                              <Trash2 size={16}/> Delete for Me
                          </button>

                          {(isAdmin || (isMe && isRecent)) && (
                              <button onClick={() => handleDelete(msg._id, 'everyone')} className="w-full px-4 py-2 text-sm flex gap-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 border-t border-slate-100 dark:border-slate-700">
                                  <Shield size={16}/> Delete for Everyone
                              </button>
                          )}
                          
                          {isMe && !isRecent && !isAdmin && (
                              <div className="px-4 py-1 text-[10px] text-slate-400 italic text-center">
                                  "Everyone" delete expired (1hr)
                              </div>
                          )}
                      </div>
                  </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* PREVIEW BAR */}
      {(selectedFile || audioUrl) && (
          <div className="p-2 md:p-3 bg-slate-100 dark:bg-slate-900 border-t border-slate-300 dark:border-slate-700 flex items-center gap-2 md:gap-4 sticky bottom-0 z-20">
              <button onClick={cancelAttachment} className="p-2 bg-red-100 text-red-500 rounded-full hover:bg-red-200 shrink-0"><X size={20} /></button>
              
              <div className="flex-1 flex items-center gap-2 overflow-hidden">
                  {selectedFile && selectedFile.type.startsWith('image') && <img src={previewUrl} alt="Preview" className="h-10 w-10 md:h-16 md:w-16 object-cover rounded-lg border border-slate-300 shrink-0" />}
                  {selectedFile && selectedFile.type.startsWith('video') && <Video className="text-indigo-500 shrink-0" />}
                  {selectedFile && !selectedFile.type.startsWith('image') && !selectedFile.type.startsWith('video') && (
                      <div className="flex items-center gap-2 overflow-hidden">
                          <FileText className="shrink-0" /> 
                          <span className="text-xs truncate">{selectedFile.name}</span>
                      </div>
                  )}
                  
                  {audioUrl && <audio src={audioUrl} controls className="h-8 w-full min-w-[100px]" />}
                  
                  {selectedFile && (
                      <input 
                        type="text" 
                        value={currentMessage} 
                        onChange={(e) => setCurrentMessage(e.target.value)} 
                        placeholder="Caption..." 
                        className="flex-1 bg-transparent outline-none text-sm min-w-[50px]" 
                      />
                  )}
              </div>
              
              <button onClick={sendMessage} className="p-3 bg-green-500 text-white rounded-full shadow-lg hover:bg-green-600 shrink-0"><Send size={20} /></button>
          </div>
      )}

      {/* INPUT AREA */}
      {!selectedFile && !audioUrl && (
      <div className="p-3 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2 sticky bottom-0 z-20">
        <div className="relative attach-menu">
            <button onClick={() => setShowAttachMenu(!showAttachMenu)} className={`p-2 rounded-full transition ${showAttachMenu ? 'bg-slate-200 rotate-45' : 'hover:bg-slate-100 text-slate-500'}`}><Plus size={24} /></button>
            {showAttachMenu && (
                <div className="absolute bottom-12 left-0 bg-white dark:bg-slate-800 shadow-xl rounded-xl border border-slate-200 dark:border-slate-700 p-2 flex flex-col gap-2 w-40 animate-slideUp">
                    <button onClick={() => triggerFileInput('image')} className="flex items-center gap-3 p-2 hover:bg-indigo-50 dark:hover:bg-slate-700 rounded text-sm text-indigo-600 font-bold"><ImageIcon size={18}/> Photos & Videos</button>
                    <button onClick={() => triggerFileInput('file')} className="flex items-center gap-3 p-2 hover:bg-indigo-50 dark:hover:bg-slate-700 rounded text-sm text-purple-600 font-bold"><FileText size={18}/> Document</button>
                </div>
            )}
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
        </div>

        <input
          type="text"
          value={currentMessage}
          placeholder={isRecording ? "Recording..." : "Message..."}
          disabled={isRecording}
          className="flex-1 p-3 rounded-full bg-slate-100 dark:bg-slate-900 border-none focus:ring-2 focus:ring-indigo-500 transition outline-none dark:text-white"
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          onChange={(event) => setCurrentMessage(event.target.value)}
        />

        {currentMessage.trim() ? (
            <button onClick={sendMessage} className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 shadow-lg transform active:scale-95 shrink-0"><Send size={20} /></button>
        ) : (
            <button 
                onMouseDown={startRecording} 
                onMouseUp={stopRecording} 
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                className={`p-3 rounded-full text-white shadow-lg transition-all duration-200 shrink-0 ${isRecording ? 'bg-red-500 animate-pulse scale-110' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
                <Mic size={20} />
            </button>
        )}
      </div>
      )}
    </div>
    </>
  );
};

export default ChatTab;