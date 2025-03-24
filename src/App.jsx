import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import Register from "../src/Pages/Register";
import Sidebar from "../src/Components/Sidebar";
import Chat from "../src/Components/Chat";
import Loader from "../src/Components/Loader"
import { FaWhatsapp } from "react-icons/fa6";
import toast, { Toaster } from "react-hot-toast";

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const handleStorageChange = () => {
      const user = JSON.parse(localStorage.getItem("user"));
      setCurrentUser(user);
      setLoading(false);
    };

    handleStorageChange();
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const handleChatClose = (message) => {
    if (message === "Chat closed by user") {
      toast.success("Chat closed successfully!");
      setSelectedUser(null);
    }
  };

  const isAuthenticated = () => {
    return !!currentUser;
  };

  if (loading) {
    return (
      <div>
        <Loader />
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Register />} />
        <Route
          path="/chat"
          element={
            isAuthenticated() ? (
              <div className="flex h-screen">
                <Sidebar
                  currentUser={currentUser}
                  onUserClick={setSelectedUser}
                  onClose={handleChatClose}
                />
                {!selectedUser && (
                  <div className="flex flex-col justify-center items-center w-full gap-5">
                    <FaWhatsapp className="text-8xl text-gray-400 mr-2" />
                    <h2 className="text-2xl font-bold text-gray-500 mb-6 text-center">
                      Select a user to start a chat.
                    </h2>
                  </div>
                )}
                {selectedUser && (
                  <Chat
                    senderId={currentUser}
                    receiverId={selectedUser}
                  />
                )}
              </div>
            ) : (
              <Navigate to="/" />
            )
          }
        />
      </Routes>
      <Toaster position="bottom-center" toastOptions={{ duration: 1000 }} />
    </Router>
  );
};

export default App;
