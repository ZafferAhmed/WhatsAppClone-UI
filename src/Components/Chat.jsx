import React, { useState, useEffect, useCallback } from "react";
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

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !file) {
      toast.error("Please enter a message or upload a file.");
      return;
    }

    setLoading(true);
    try {
      let fileUrl = null;
      if (file) {
        const response = await uploadFile(file);
        fileUrl = response.data.url;
        setFile(null);
        setFilePreview(null);
      }

      const msg = {
        senderId: senderId.uid,
        receiverId: receiverId.uid,
        message: fileUrl || newMessage.trim(),
      };

      await sendMessage(msg);
      socket.emit("sendMessage", msg);
      setNewMessage("");
      fetchMessages();
    } catch (error) {
      toast.error("Error sending message: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept: "image/*",
    onDrop: (acceptedFiles) => {
      setFile(acceptedFiles[0]);
      setFilePreview(URL.createObjectURL(acceptedFiles[0]));
    },
  });

  useEffect(() => {
    fetchMessages();

    socket.on("receiveMessage", (msg) => {
      console.log('Received message:', msg);
      
      if (
        (msg.senderId === senderId.uid && msg.receiverId === receiverId.uid) ||
        (msg.senderId === receiverId.uid && msg.receiverId === senderId.uid)
      ) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    return () => {
      socket.off("receiveMessage");
    };
  }, [fetchMessages, senderId, receiverId]);

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
                <div className="text-xs text-green-500 font-medium flex items-center">
                  <span>
                    <GoDotFill className="text-green-500" size={16} />
                  </span>
                  <span>Online</span>
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
                  <div key={index}>
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
                        {msg.message.startsWith("http") ? (
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
              onClick={() => setFilePreview(null)}
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
            onChange={(e) => setNewMessage(e.target.value)}
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
            className="bg-green-500 text-white p-2 rounded hover:bg-green-600 flex justify-center items-center transition duration-500 ease-in-out"
            disabled={loading}
          >
            {loading ? (
              <BsFillSendFill />
            ) : (
              <LuSendHorizontal size={20} aria-hidden />
            )}
          </button>
        </div>

        <Toaster position="bottom-center" toastOptions={{ duration: 3000 }} />
      </div>
    </>
  );
};

export default Chat;
