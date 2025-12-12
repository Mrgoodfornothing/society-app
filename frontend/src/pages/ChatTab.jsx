import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import { Send, User } from 'lucide-react';

// Connect to Backend (Use localhost for dev, Render URL for prod)
// TIP: When deploying to Vercel, change this to your Render URL!
const socket = io.connect("http://localhost:5000"); 

const ChatTab = ({ user }) => {
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const bottomRef = useRef(null);

  const ROOM = "society_general"; // One global room for everyone

  useEffect(() => {
    // Join the room on load
    socket.emit("join_room", ROOM);

    // Listen for incoming messages
    socket.on("receive_message", (data) => {
      setMessageList((list) => [...list, data]);
    });

    // Cleanup listeners
    return () => socket.off("receive_message");
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messageList]);

  const sendMessage = async () => {
    if (currentMessage !== "") {
      const messageData = {
        room: ROOM,
        author: user.name,
        message: currentMessage,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      await socket.emit("send_message", messageData);
      setMessageList((list) => [...list, messageData]); // Add my own msg locally
      setCurrentMessage("");
    }
  };

  useEffect(() => {
    // 1. Join the room
    socket.emit("join_room", ROOM);

    // 2. Fetch old messages from Database (NEW)
    const fetchMessages = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/messages/${ROOM}`);
        const data = await response.json();
        setMessageList(data);
      } catch (error) {
        console.error("Failed to load messages:", error);
      }
    };
    fetchMessages();

    // 3. Listen for new messages
    socket.on("receive_message", (data) => {
      setMessageList((list) => [...list, data]);
    });

    return () => socket.off("receive_message");
  }, []);

  return (
    <div className="flex flex-col h-[600px] glass rounded-xl overflow-hidden shadow-2xl relative z-0">
      
      {/* Chat Header */}
      <div className="bg-indigo-600 p-4 text-white shadow-md z-10">
        <h3 className="font-bold flex items-center gap-2">
           <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
           Society General Chat
        </h3>
        <p className="text-xs text-indigo-200">Live discussion for all residents</p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50">
        {messageList.map((msg, index) => {
          const isMe = msg.author === user.name;
          return (
            <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] p-3 rounded-2xl ${
                isMe 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-tl-none shadow-sm'
              }`}>
                {!isMe && <p className="text-xs font-bold text-orange-500 mb-1">{msg.author}</p>}
                <p className="text-sm">{msg.message}</p>
                <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>{msg.time}</p>
              </div>
            </div>
          );
        })}
        {messageList.length === 0 && (
          <div className="text-center text-slate-400 mt-10">
            <p>👋 Say hello to your neighbors!</p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2">
        <input
          type="text"
          value={currentMessage}
          placeholder="Type a message..."
          className="flex-1 p-3 rounded-full bg-slate-100 dark:bg-slate-900 border-none focus:ring-2 focus:ring-indigo-500 transition outline-none dark:text-white"
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          onChange={(event) => setCurrentMessage(event.target.value)}
        />
        <button 
          onClick={sendMessage} 
          className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition shadow-lg transform active:scale-95"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};

export default ChatTab;

