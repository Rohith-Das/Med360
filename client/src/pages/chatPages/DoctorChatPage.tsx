import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { chatSocketService } from '@/services/chatSocketServer';
import { 
  searchUsers,
  findOrCreateChatRoom,
  clearSearchResults
} from '@/features/chat/chatSlice';
import { useDebounce } from "use-debounce";

const DoctorChatPage: React.FC = () =>{

const dispatch=useAppDispatch();
const {doctor}=useAppSelector((state)=>state.doctorAuth)
  const { 
    searchResults, 
    searchLoading,
    error 
  } = useAppSelector((state) => state.chat);

  const [showSearchModal,setShowSearchModal]=useState(false);
  const [searchQuery,setSearchQuery]=useState('')
const [debouncedSearchQuery] = useDebounce(searchQuery, 500);


  useEffect(()=>{
    if(doctor?.id){
         console.log('🔌 Initializing chat socket for doctor:', doctor.id);
         chatSocketService.connect(doctor.id,'doctor')

         return ()=>{
            chatSocketService.disconnect()
         }
    }
  },[doctor?.id])

//use debouncing
useEffect(() => {
  if (debouncedSearchQuery.trim()) {
        console.log("🔍 Debounced value triggered:", debouncedSearchQuery);
    dispatch(searchUsers({
      query: debouncedSearchQuery,
      type: "patients",
   
    }));
  } else {
    dispatch(clearSearchResults());
  }
}, [debouncedSearchQuery]);


  const handleSelectPatient=async(patientId:string)=>{
    try {
        const result=await dispatch(
            findOrCreateChatRoom({
                patientId,
                doctorId:doctor.id,
            
            })
        )
        console.log('Chat room result:', result);
        setShowSearchModal(false);
        setSearchQuery('');
        dispatch(clearSearchResults())

        if(result.payload){
              console.log('✅ Chat room created/found:', result.payload);
        }
    } catch (error) {
        console.error('❌ Error creating chat:', error);
    }
  }
   const SearchModal = () => (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Search patient</h2>
            <button
              onClick={() => {
                setShowSearchModal(false);
                setSearchQuery('');
                dispatch(clearSearchResults());
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
  
          {/* Search Input */}
          <div className="relative mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
               
              }}
              placeholder="Enter doctor's name or specialization..."
              className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <svg
              className="absolute left-3 top-3.5 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
  
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
  
          {/* Search Results */}
          <div className="max-h-96 overflow-y-auto">
            {/* Loading State */}
            {searchLoading && (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-3"></div>
                <p className="text-gray-500">Searching patient...</p>
              </div>
            )}
  
            {/* No Results - Empty Search */}
            {!searchLoading && searchResults.length === 0 && !searchQuery && (
              <div className="text-center py-8">
                <svg
                  className="w-16 h-16 mx-auto mb-3 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-gray-400 text-sm">Start typing to search for patient</p>
              </div>
            )}
  
            {/* No Results - After Search */}
            {!searchLoading && searchResults.length === 0 && searchQuery && (
              <div className="text-center py-8">
                <svg
                  className="w-16 h-16 mx-auto mb-3 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-500 font-medium mb-1">No patient found</p>

              </div>
            )}
  
            {/* Results List */}
            {!searchLoading && searchResults.length > 0 && (
              <>
                <p className="text-sm text-gray-500 mb-3">
                  Found {searchResults.length} patient{searchResults.length !== 1 ? 's' : ''}
                </p>
                <ul className="space-y-2">
                  {searchResults.map((patient) => (
                    <li
                      key={patient.id}
                      className="p-3 hover:bg-blue-50 cursor-pointer flex items-center rounded-lg border border-transparent hover:border-blue-200 transition"
                      onClick={() => handleSelectPatient(patient.id)}
                    >
                      <img
                        src={patient.profilePicture || '/default-avatar.png'}
                        alt={patient.name}
                        className="w-14 h-14 rounded-full mr-4 object-cover border-2 border-gray-200"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{patient.name}</p>
                       
                      </div>
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
  
          {/* Close Button */}
          <button
            onClick={() => {
              setShowSearchModal(false);
              setSearchQuery('');
              dispatch(clearSearchResults());
            }}
            className="mt-6 w-full bg-gray-200 text-gray-800 px-4 py-3 rounded-lg hover:bg-gray-300 transition font-medium"
          >
            Close
          </button>
        </div>
      </div>
    );
    
    return(
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar: Chat Rooms List */}
            <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
              <div className="p-4 border-b border-gray-200 flex-shrink-0">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-xl font-semibold">Messages DoctorChatPage</h2>
                  <button
                    onClick={() => setShowSearchModal(true)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition shadow-sm flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    New Chat
                  </button>
                </div>
                
                {/* Connection Status */}
                <div className="flex items-center gap-2 text-xs">
                  {chatSocketService.isSocketConnected() ? (
                    <>
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      <span className="text-green-600 font-medium">Connected</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      <span className="text-red-600 font-medium">Disconnected</span>
                    </>
                  )}
                </div>
              </div>
              
              {/* Chat Rooms List - Empty State */}
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                  <svg
                    className="w-20 h-20 mx-auto mb-4 text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <p className="text-gray-500 font-medium mb-2">No conversations yet</p>
                  <p className="text-sm text-gray-400 mb-4">Start chatting with a patient</p>
                  <button
                    onClick={() => setShowSearchModal(true)}
                    className="text-blue-500 hover:text-blue-600 text-sm font-medium"
                  >
                    Search Patients →
                  </button>
                </div>
              </div>
            </div>
      
            {/* Main Chat Area - Empty State */}
            <div className="flex-1 flex items-center justify-center bg-white">
              <div className="text-center text-gray-500 p-8">
                <svg
                  className="w-32 h-32 mx-auto mb-6 text-gray-200"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <h3 className="text-xl font-semibold mb-2 text-gray-700">Welcome to Med360 Chat</h3>
                <p className="text-gray-500 mb-6">Select a conversation or start a new chat</p>
                <button
                  onClick={() => setShowSearchModal(true)}
                  className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition shadow-sm inline-flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Find a patients
                </button>
              </div>
            </div>
      
            {/* Search Modal */}
            {showSearchModal && <SearchModal />}
          </div>
    )
}


export default DoctorChatPage;