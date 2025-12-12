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