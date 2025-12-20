import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import EmojiPicker from 'emoji-picker-react';
import axios from 'axios';
import { 
  Send, Trash2, Shield, Clock, Lock, UserX, 
  Maximize2, Minimize2, Plus, MoreHorizontal, 
  Image as ImageIcon, FileText, Mic, X, Play, Pause, Video, Paperclip
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
  
  // Media & Recording
  const [selectedFile, setSelectedFile] = useState(null); // For Image/Video/Doc preview
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const timerRef = useRef(null);

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
  };

  const cleanupSocketListeners = () => {
    socket.off("receive_message");
    socket.off("message_updated");
    socket.off("message_deleted");
    socket.off("settings_update");
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

          mediaRecorder.ondataavailable = (e) => {
              if (e.data.size > 0) chunks.push(e.data);
          };

          mediaRecorder.onstop = () => {
              const blob = new Blob(chunks, { type: 'audio/webm' });
              setAudioBlob(blob);
              setAudioUrl(URL.createObjectURL(blob));
              setIsRecording(false);
              clearInterval(timerRef.current);
          };

          mediaRecorder.start();
          setIsRecording(true);
          setRecordingDuration(0);
          timerRef.current = setInterval(() => setRecordingDuration(prev => prev + 1), 1000);
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

    // Upload File or Audio if exists
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
            uploadedFileUrl = data.fileUrl; // This will be /uploads/filename.ext
            uploadedFileName = data.fileName;
        } catch (error) {
            console.error("Upload failed", error);
            alert("Upload failed");
            return;
        }
    }

    const messageData = {
      room: ROOM,
      author: user.name,
      authorId: user._id,
      role: user.role,
      message: currentMessage, // Can be caption or empty
      fileUrl: uploadedFileUrl,
      fileType: uploadedFileType,
      fileName: uploadedFileName,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    await socket.emit("send_message", messageData);
    
    // Reset Everything
    setCurrentMessage("");
    cancelAttachment();
  };

  // --- RENDERING MESSAGE CONTENT ---
  const renderMessageContent = (msg) => {
      if(msg.fileType === 'image') {
          return (
              <div className="mt-1">
                  <img src={`${BASE_URL}${msg.fileUrl}`} alt="attachment" className="rounded-lg max-h-60 max-w-full object-cover" />
                  {msg.message && <p className="mt-2 text-sm">{msg.message}</p>}
              </div>
          );
      }
      if(msg.fileType === 'video') {
          return (
              <div className="mt-1">
                  <video src={`${BASE_URL}${msg.fileUrl}`} controls className="rounded-lg max-h-60 max-w-full" />
                  {msg.message && <p className="mt-2 text-sm">{msg.message}</p>}
              </div>
          );
      }
      if(msg.fileType === 'audio') {
          return (
              <div className="mt-1 flex items-center gap-2 min-w-[200px]">
                  <div className="p-2 bg-indigo-100 dark:bg-slate-600 rounded-full text-indigo-600 dark:text-white">
                      <Mic size={16} />
                  </div>
                  <audio src={`${BASE_URL}${msg.fileUrl}`} controls className="h-8 w-48" />
              </div>
          );
      }
      if(msg.fileType === 'file') {
          return (
              <div className="mt-1 bg-slate-100 dark:bg-slate-800 p-2 rounded flex items-center gap-3">
                  <FileText size={24} className="text-red-500" />
                  <div className="overflow-hidden">
                      <p className="text-xs font-bold truncate">{msg.fileName}</p>
                      <a href={`${BASE_URL}${msg.fileUrl}`} target="_blank" rel="noreferrer" className="text-xs text-indigo-500 underline">Download</a>
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
    <div className={`flex flex-col glass rounded-xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700 transition-all duration-300 ${isFullScreen ? 'fixed inset-0 z-50 rounded-none h-[100dvh] w-screen' : 'h-[85vh] md:h-[600px] relative'}`}>
      
      {/* --- HEADER (UNCHANGED) --- */}
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

      {/* --- MESSAGES AREA --- */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50" onClick={(e) => { e.stopPropagation(); setSelectedMsgId(null); setShowEmojiPicker(false); setShowAttachMenu(false); }}>
        {filteredMessages.map((msg, index) => {
          const isMe = msg.author === user.name;
          const isMsgAdmin = msg.role === 'admin';
          return (
            <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'} relative`}>
              <div 
                onClick={(e) => { e.stopPropagation(); setSelectedMsgId(selectedMsgId === msg._id ? null : msg._id); }}
                className={`max-w-[85%] md:max-w-[70%] p-3 rounded-2xl relative cursor-pointer transition transform active:scale-[0.98] ${isMe ? 'bg-indigo-600 text-white rounded-tr-none' : isMsgAdmin ? 'bg-red-50 border border-red-200 text-slate-800' : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-tl-none shadow-sm'}`}
              >
                {!isMe && <p className="text-xs font-bold text-orange-500 mb-1">{msg.author}</p>}
                
                {renderMessageContent(msg)}

                <div className="flex justify-between items-end mt-1 gap-4">
                    <div className="flex -space-x-1">{msg.reactions && msg.reactions.map((r, i) => <span key={i} className="text-[10px] bg-white/20 rounded-full px-1">{r.emoji}</span>)}</div>
                    <p className={`text-[10px] ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>{msg.time}</p>
                </div>
              </div>
              
              {/* DELETE/REACT MENU */}
              {selectedMsgId === msg._id && (
                  <div className={`absolute top-full mt-2 z-30 bg-white dark:bg-slate-800 shadow-2xl rounded-xl border border-slate-200 w-64 ${isMe ? 'right-0' : 'left-0'}`}>
                      <div className="flex justify-between p-2 bg-slate-50 dark:bg-slate-900/50">
                          {REACTION_EMOJIS.map(emoji => <button key={emoji} onClick={() => { socket.emit('add_reaction', { messageId: selectedMsgId, userId: user._id, userName: user.name, emoji }); setSelectedMsgId(null); }} className="hover:scale-125 px-1">{emoji}</button>)}
                      </div>
                      <div className="py-1">
                          <button onClick={() => { socket.emit('delete_message', { messageId: msg._id, userId: user._id, type: 'me', isAdmin }); setSelectedMsgId(null); }} className="w-full px-4 py-2 text-sm flex gap-2 hover:bg-slate-100 dark:hover:bg-slate-700"><Trash2 size={16}/> Delete for Me</button>
                      </div>
                  </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* --- PREVIEW BAR (Shows when Image/Audio selected) --- */}
      {(selectedFile || audioUrl) && (
          <div className="p-3 bg-slate-100 dark:bg-slate-900 border-t border-slate-300 dark:border-slate-700 flex items-center gap-4">
              <button onClick={cancelAttachment} className="p-2 bg-red-100 text-red-500 rounded-full hover:bg-red-200"><X size={20} /></button>
              
              {selectedFile && selectedFile.type.startsWith('image') && <img src={previewUrl} alt="Preview" className="h-16 w-16 object-cover rounded-lg border border-slate-300" />}
              {selectedFile && selectedFile.type.startsWith('video') && <Video className="text-indigo-500" />}
              {selectedFile && !selectedFile.type.startsWith('image') && !selectedFile.type.startsWith('video') && <div className="flex items-center gap-2"><FileText /> <span className="text-xs truncate max-w-[150px]">{selectedFile.name}</span></div>}
              
              {audioUrl && <audio src={audioUrl} controls className="h-8 w-full" />}
              
              {selectedFile && <input type="text" value={currentMessage} onChange={(e) => setCurrentMessage(e.target.value)} placeholder="Add a caption..." className="flex-1 bg-transparent outline-none text-sm" />}
              
              <button onClick={sendMessage} className="p-3 bg-green-500 text-white rounded-full shadow-lg hover:bg-green-600"><Send size={20} /></button>
          </div>
      )}

      {/* --- INPUT AREA (Hidden if previewing) --- */}
      {!selectedFile && !audioUrl && (
      <div className="p-3 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2 sticky bottom-0 z-20">
        
        {/* + Button & Menu */}
        <div className="relative attach-menu">
            <button onClick={() => setShowAttachMenu(!showAttachMenu)} className={`p-2 rounded-full transition ${showAttachMenu ? 'bg-slate-200 rotate-45' : 'hover:bg-slate-100 text-slate-500'}`}>
                <Plus size={24} />
            </button>
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
          placeholder={isRecording ? "Recording audio..." : "Type a message..."}
          disabled={isRecording}
          className="flex-1 p-3 rounded-full bg-slate-100 dark:bg-slate-900 border-none focus:ring-2 focus:ring-indigo-500 transition outline-none dark:text-white"
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          onChange={(event) => setCurrentMessage(event.target.value)}
        />

        {/* Send OR Mic Button */}
        {currentMessage.trim() ? (
            <button onClick={sendMessage} className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 shadow-lg transform active:scale-95"><Send size={20} /></button>
        ) : (
            <button 
                onMouseDown={startRecording} 
                onMouseUp={stopRecording} 
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                className={`p-3 rounded-full text-white shadow-lg transition-all duration-200 ${isRecording ? 'bg-red-500 animate-pulse scale-110' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
                <Mic size={20} />
            </button>
        )}
      </div>
      )}
    </div>
  );
};

export default ChatTab;