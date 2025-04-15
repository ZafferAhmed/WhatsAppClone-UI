import React, { useState, useEffect, useCallback, useRef } from "react";
import { sendMessage, getMessages, uploadFile } from "../Services/API";
import { useDropzone } from "react-dropzone";
import toast, { Toaster } from "react-hot-toast";
import { HiPaperClip } from "react-icons/hi";
import { IoMdClose } from "react-icons/io";
import { LuSendHorizontal } from "react-icons/lu";
import { BsFillSendFill } from "react-icons/bs";
import { GoDotFill } from "react-icons/go";
import socket from "../Socket";

const Chat = ({ senderId, receiverId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [isInputEmpty, setIsInputEmpty] = useState(true);
  const messagesEndRef = useRef(null);
  const [lastSentTime, setLastSentTime] = useState(0);

  const formatTimestamp = (timestamp) => {
    if (!timestamp?._seconds) return "";
    const date = new Date(timestamp._seconds * 1000);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (timestamp) => {
    if (!timestamp?._seconds) return "";
    const date = new Date(timestamp._seconds * 1000);
    return date.toLocaleDateString([], {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  let lastDisplayedDate = null;

  const fetchMessages = useCallback(async () => {
    try {
      const response = await getMessages(senderId?.uid, receiverId?.uid);
      setMessages(response.data);
    } catch (error) {
      toast.error("Error fetching messages: " + error.message);
    }
  }, [senderId, receiverId]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setNewMessage(value);
    setIsInputEmpty(value.trim() === "" && !file);
  };

  const handleSendMessage = async () => {
    if (isInputEmpty) return;

    const currentTime = Date.now();
    if (currentTime - lastSentTime < 1000) {
      toast.error("Please wait a moment before sending another message");
      return;
    }

    setLoading(true);
    const tempId = Date.now();
    try {
      let fileUrl = null;
      if (file) {
        const response = await uploadFile(file);
        fileUrl = response.data.url;
        setFile(null);
        setFilePreview(null);
      }

      const optimisticMessage = {
        senderId: senderId.uid,
        receiverId: receiverId.uid,
        message: fileUrl || newMessage.trim(),
        timestamp: { _seconds: Math.floor(currentTime / 1000) },
        tempId,
        isOptimistic: true,
      };

      setMessages((prev) => [...prev, optimisticMessage]);
      setNewMessage("");
      setIsInputEmpty(true);
      setLastSentTime(currentTime);

      const response = await sendMessage(optimisticMessage);
      const serverMsg = { ...response.data, tempId };

      // Replace optimistic message with server message
      setMessages((prev) =>
        prev.map((msg) => (msg.tempId === tempId ? serverMsg : msg))
      );

      // Emit to other clients only
      if (socket && socket.connected) {
        socket.emit("sendMessage", serverMsg);
      }
    } catch (error) {
      // Remove the failed optimistic message
      setMessages((prev) => prev.filter((msg) => msg.tempId !== tempId));
      toast.error("Error sending message: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !isInputEmpty) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept: "image/*",
    onDrop: (acceptedFiles) => {
      setFile(acceptedFiles[0]);
      setFilePreview(URL.createObjectURL(acceptedFiles[0]));
      setIsInputEmpty(false);
    },
  });

  useEffect(() => {
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    const onError = (error) => {
      console.error("Socket error:", error);
      toast.error("Connection error. Please refresh.");
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("error", onError);

    const handleReceiveMessage = (msg) => {
      setMessages((prev) => {
        const exists = prev.some(
          (m) =>
            (m.tempId && msg.tempId && m.tempId === msg.tempId) ||
            (m._id && msg._id && m._id === msg._id) ||
            (m.message === msg.message &&
              m.senderId === msg.senderId &&
              m.timestamp?._seconds === msg.timestamp?._seconds)
        );

        return exists ? prev : [...prev, msg];
      });
    };

    socket.on("receiveMessage", handleReceiveMessage);
    fetchMessages();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("error", onError);
      socket.off("receiveMessage", handleReceiveMessage);
    };
  }, [senderId?.uid, receiverId?.uid, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <>
      <div className="flex-1 p-4 bg-gray-100 flex flex-col h-screen">
        <div className="flex-1 overflow-y-auto p-4 bg-chat-pattern rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4 px-4 py-3 bg-white rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-gray-700 rounded-full flex items-center justify-center text-white text-lg font-bold">
                {receiverId.name.charAt(0).toUpperCase()}
              </div>
              <div className="ml-3 flex flex-col">
                <div className="text-base font-semibold text-gray-900">
                  {receiverId.name}
                </div>
                <div className="text-xs font-medium flex items-center">
                  <span>
                    <GoDotFill
                      className={
                        isConnected ? "text-green-500" : "text-gray-500"
                      }
                      size={16}
                    />
                  </span>
                  <span
                    className={isConnected ? "text-green-500" : "text-gray-500"}
                  >
                    {isConnected ? "Online" : "Offline"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
              No messages yet. Say hi! 👋
            </div>
          ) : (
            <div className="w-full flex flex-col space-y-2">
              {messages.map((msg, index) => {
                const messageDate = formatDate(msg.timestamp);
                const shouldShowDate = messageDate !== lastDisplayedDate;
                lastDisplayedDate = messageDate;

                return (
                  <div key={msg.tempId || msg._id || index}>
                    {shouldShowDate && (
                      <div className="text-center text-gray-500 text-xs my-3">
                        {messageDate} - {formatTimestamp(msg.timestamp)}
                      </div>
                    )}

                    <div
                      className={`flex ${
                        msg.senderId === senderId.uid
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`relative p-3 max-w-xs rounded-lg shadow-md text-sm ${
                          msg.senderId === senderId.uid
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200"
                        }`}
                      >
                        {typeof msg.message === "string" &&
                        msg.message.startsWith("http") ? (
                          <img
                            src={msg.message}
                            alt="Uploaded"
                            className="max-w-xs rounded-md"
                          />
                        ) : (
                          msg.message
                        )}
                        <span className="block text-right text-xs opacity-70 mt-1">
                          {formatTimestamp(msg.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {filePreview && (
          <div className="mt-2 w-fit mx-auto flex justify-center items-center relative">
            <img
              src={filePreview}
              alt="Preview"
              className="w-24 h-24 rounded-md border"
            />
            <button
              onClick={() => {
                setFilePreview(null);
                setFile(null);
                setIsInputEmpty(newMessage.trim() === "");
              }}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
            >
              <IoMdClose size={16} className="text-white" aria-hidden />
            </button>
          </div>
        )}

        <div className="mt-4 flex items-center bg-white p-2 rounded-lg shadow-md">
          <input
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            className="flex-1 p-2 border rounded focus:outline-none"
            placeholder="Type a message..."
          />
          <div
            {...getRootProps()}
            className="p-2 cursor-pointer mx-2 text-gray-500"
          >
            <input {...getInputProps()} />
            <HiPaperClip size={24} className="text-gray-500" aria-hidden />
          </div>
          <button
            onClick={handleSendMessage}
            className={`p-2 rounded-lg flex justify-center items-center transition duration-200 ${
              isInputEmpty || !isConnected
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-600 text-white"
            }`}
            disabled={loading || !isConnected || isInputEmpty}
          >
            {loading ? (
              <BsFillSendFill className="animate-pulse" />
            ) : (
              <LuSendHorizontal size={20} />
            )}
          </button>
        </div>

        <Toaster position="bottom-center" toastOptions={{ duration: 3000 }} />
      </div>
    </>
  );
};

export default Chat;
