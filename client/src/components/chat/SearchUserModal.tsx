import React, { useState } from "react";
import { ChatUser } from "@/features/chat/chatSlice";

interface SearchUserModalProps {
  onClose: () => void;
  onSearch: (query: string) => void;
  onSelect: (id: string) => void;
  searchResults: ChatUser[];
  loading: boolean;
  title: string;
}

const SearchUserModal: React.FC<SearchUserModalProps> = ({
  onClose,
  onSearch,
  onSelect,
  searchResults,
  loading,
  title,
}) => {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) onSearch(query);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-[400px]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="flex mb-4">
          <input
            type="text"
            className="border border-gray-300 rounded-l-lg px-3 py-2 w-full focus:outline-none"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 rounded-r-lg hover:bg-blue-600"
          >
            Search
          </button>
        </form>

        {loading && <p className="text-center text-gray-500">Searching...</p>}

        {!loading && searchResults.length === 0 && (
          <p className="text-center text-gray-400">No results found</p>
        )}

        <ul className="max-h-60 overflow-y-auto">
          {searchResults.map((user) => (
            <li
              key={user.id}
              onClick={() => onSelect(user.id)}
              className="p-3 border-b hover:bg-gray-100 cursor-pointer flex items-center gap-3"
            >
              <img
                src={user.profilePicture || "/default-avatar.png"}
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <p className="font-medium">{user.name}</p>
                {user.specialization && (
                  <p className="text-sm text-gray-500">{user.specialization}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default SearchUserModal;
