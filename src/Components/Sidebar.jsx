import React, { useEffect, useState } from "react";
import { getUsers } from "../Services/API";
import { useNavigate } from "react-router-dom";
import { FaWhatsapp } from "react-icons/fa6";

const Sidebar = ({ currentUser, onUserClick, onClose }) => {
  const [users, setUsers] = useState([]);
  const [activeUserId, setActiveUserId] = useState(null);
  const navigate = useNavigate();

  const handleCloseChat = () => {
    setActiveUserId(null);
    onClose("Chat closed by user");
  };

  useEffect(() => {
    const fetchUsers = async () => {
      const response = await getUsers();
      const filteredUsers = response.data.filter(
        (user) => user.uid !== currentUser?.uid
      );
      setUsers(filteredUsers);
    };

    if (currentUser) {
      fetchUsers();
    } else {
      setUsers([]);
    }
  }, [currentUser]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUsers([]);
    navigate("/");
  };

  const handleUserClick = (user) => {
    setActiveUserId(user.uid);
    onUserClick(user);
  };

  return (
    <>
      <div className="min-w-max bg-gray-900 text-white p-4 flex flex-col h-screen">
        <div className="flex items-center mb-6">
          <FaWhatsapp className="text-gray-500 text-3xl mr-2" />
          <h2 className="text-xl font-bold">
            <span className="text-green-500 ">
              {currentUser?.displayName} &apos;s
            </span>
            <span> Chats</span>
          </h2>
        </div>
        <ul className="flex-1 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800">
          {users.map((user) => (
            <li
              key={user.uid}
              onClick={() => handleUserClick(user)}
              className={`p-3 cursor-pointer rounded flex items-center gap-2 transition-all ${
                activeUserId === user.uid
                  ? "bg-green-600"
                  : "hover:bg-gray-800 hover:text-white transition-all duration-500 ease-in-out"
              }`}
            >
              <div className="h-10 w-10 bg-gray-700 rounded-full flex items-center justify-center text-white">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="flex-1 capitalize">{user.name}</span>
              <span
                className={`w-3 h-3 rounded-full ${
                  user.online ? "bg-green-400" : "bg-gray-500"
                }`}
              ></span>
            </li>
          ))}
        </ul>

        {activeUserId && (
          <button
            onClick={handleCloseChat}
            className="w-full mt-4 bg-red-500 text-white p-3 rounded-lg font-semibold hover:bg-red-600 transition-all"
          >
            Close Chat
          </button>
        )}

        <button
          onClick={handleLogout}
          className="w-full mt-4 bg-red-500 text-white p-3 rounded-lg font-semibold hover:bg-red-600 transition-all"
        >
          Logout
        </button>
      </div>
    </>
  );
};

export default Sidebar;
