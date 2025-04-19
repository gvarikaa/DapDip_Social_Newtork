"use client";

import { useEffect, useState } from "react";
import Image from "../Image";
import Link from "next/link";

type SharedMedia = {
  id: string;
  type: "image" | "file" | "video";
  url: string;
  filename?: string;
  timestamp: string;
  thumbnailUrl?: string;
};

type UserProfileSidebarProps = {
  userId: string;
  conversationId: string;
};

const UserProfileSidebar = ({ userId, conversationId }: UserProfileSidebarProps) => {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [sharedMedia, setSharedMedia] = useState<SharedMedia[]>([]);
  const [activeTab, setActiveTab] = useState<"media" | "files" | "links">("media");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // ვცდილობთ API-დან მივიღოთ მომხმარებლის პროფილი
        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) throw new Error("პროფილის მიღება ვერ მოხერხდა");
        
        const data = await response.json();
        setUserProfile(data);
      } catch (error) {
        console.error("შეცდომა:", error);
        // თუ API არ მუშაობს, გამოვიყენოთ დაყენებულ მონაცემებს
        setUserProfile({
          id: userId,
          username: "user" + userId.substring(0, 4),
          displayName: "მომხმარებელი " + userId.substring(0, 4),
          img: null,
          bio: "ეს არის მომხმარებლის ბიოგრაფია, რომელიც აღწერს მას და მის ინტერესებს.",
          location: "თბილისი, საქართველო",
          website: "example.com",
          createdAt: new Date().toISOString()
        });
      }

      try {
        // ვცდილობთ API-დან მივიღოთ გაზიარებული მედია
        const mediaResponse = await fetch(`/api/conversations/${conversationId}/media`);
        if (!mediaResponse.ok) throw new Error("მედიის მიღება ვერ მოხერხდა");
        
        const mediaData = await mediaResponse.json();
        setSharedMedia(mediaData);
      } catch (error) {
        console.error("შეცდომა:", error);
        // თუ API არ მუშაობს, გამოვიყენოთ ჩვენებურ მონაცემებს
        // სიმულირებული მონაცემები
        setSharedMedia([
          {
            id: "1",
            type: "image",
            url: "https://ik.imagekit.io/general/landscape.jpg",
            thumbnailUrl: "https://ik.imagekit.io/general/landscape.jpg",
            timestamp: new Date(Date.now() - 86400000 * 2).toISOString() // 2 დღის წინ
          },
          {
            id: "2",
            type: "image",
            url: "https://ik.imagekit.io/general/sunset.jpg",
            thumbnailUrl: "https://ik.imagekit.io/general/sunset.jpg",
            timestamp: new Date(Date.now() - 86400000 * 5).toISOString() // 5 დღის წინ
          },
          {
            id: "3",
            type: "file",
            url: "/documents/report.pdf",
            filename: "ანგარიში.pdf",
            timestamp: new Date(Date.now() - 86400000 * 7).toISOString() // 7 დღის წინ
          },
          {
            id: "4",
            type: "video",
            url: "https://ik.imagekit.io/general/video.mp4",
            thumbnailUrl: "https://ik.imagekit.io/general/video_thumbnail.jpg",
            timestamp: new Date(Date.now() - 86400000 * 10).toISOString() // 10 დღის წინ
          }
        ]);
      }

      setLoading(false);
    };

    fetchUserProfile();
  }, [userId, conversationId]);

  // გაზიარებული მედიის ფილტრაცია არჩეული ტაბის მიხედვით
  const filteredMedia = sharedMedia.filter(item => {
    if (activeTab === "media") return item.type === "image" || item.type === "video";
    if (activeTab === "files") return item.type === "file";
    return false; // links ტაბისთვის ჯერჯერობით ცარიელი
  });

  // მომხმარებლის რეგისტრაციის თარიღის ფორმატირება
  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long' };
    return date.toLocaleDateString('ka-GE', options);
  };

  if (loading) {
    return <div className="p-4 text-center">იტვირთება...</div>;
  }

  return (
    <div className="h-full border-l border-borderGray overflow-y-auto">
      {/* მომხმარებლის პროფილი */}
      <div className="p-4 border-b border-borderGray">
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 rounded-full overflow-hidden mb-4">
            <Image
              path={userProfile.img || "general/noAvatar.png"}
              alt={userProfile.displayName || userProfile.username}
              w={96}
              h={96}
              tr={true}
            />
          </div>
          <h2 className="text-xl font-bold mb-1">{userProfile.displayName || userProfile.username}</h2>
          <p className="text-textGray mb-4">@{userProfile.username}</p>
          
          {userProfile.bio && (
            <p className="text-center text-sm mb-4">{userProfile.bio}</p>
          )}
          
          <div className="w-full space-y-2 text-sm">
            {userProfile.location && (
              <div className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-textGray"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <span>{userProfile.location}</span>
              </div>
            )}
            
            {userProfile.website && (
              <div className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-textGray"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="2" y1="12" x2="22" y2="12"></line>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                </svg>
                <a href={`https://${userProfile.website}`} target="_blank" rel="noopener noreferrer" className="text-iconBlue hover:underline">
                  {userProfile.website}
                </a>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-textGray"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <span>შემოგვიერთდა {formatJoinDate(userProfile.createdAt)}</span>
            </div>
          </div>
          
          <Link href={`/${userProfile.username}`} className="mt-4 text-iconBlue hover:underline text-sm">
            პროფილის ნახვა
          </Link>
        </div>
      </div>
      
      {/* გაზიარებული მედია ტაბები */}
      <div className="border-b border-borderGray">
        <div className="flex">
          <button
            className={`flex-1 py-3 text-center ${activeTab === "media" ? "border-b-2 border-iconBlue text-white" : "text-textGray"}`}
            onClick={() => setActiveTab("media")}
          >
            მედია
          </button>
          <button
            className={`flex-1 py-3 text-center ${activeTab === "files" ? "border-b-2 border-iconBlue text-white" : "text-textGray"}`}
            onClick={() => setActiveTab("files")}
          >
            ფაილები
          </button>
          <button
            className={`flex-1 py-3 text-center ${activeTab === "links" ? "border-b-2 border-iconBlue text-white" : "text-textGray"}`}
            onClick={() => setActiveTab("links")}
          >
            ლინკები
          </button>
        </div>
      </div>
      
      {/* გაზიარებული კონტენტი */}
      <div className="p-4">
        {filteredMedia.length === 0 ? (
          <p className="text-center text-textGray">
            {activeTab === "media" 
              ? "გაზიარებული მედია არ არის" 
              : activeTab === "files" 
                ? "გაზიარებული ფაილები არ არის" 
                : "გაზიარებული ლინკები არ არის"}
          </p>
        ) : (
          <div className={activeTab === "media" ? "grid grid-cols-2 gap-2" : "space-y-3"}>
            {filteredMedia.map(item => (
              <div key={item.id}>
                {/* სურათები და ვიდეოები */}
                {activeTab === "media" && (item.type === "image" || item.type === "video") && (
                  <div className="relative aspect-square bg-gray-800 rounded-md overflow-hidden">
                    {item.type === "video" && (
                      <div className="absolute inset-0 flex items-center justify-center z-10">
                        <div className="w-10 h-10 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="white"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                          </svg>
                        </div>
                      </div>
                    )}
                    <img 
                      src={item.thumbnailUrl || item.url} 
                      alt="Shared media" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                {/* ფაილები */}
                {activeTab === "files" && item.type === "file" && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-3 bg-gray-800 rounded-md hover:bg-gray-700 transition-colors"
                  >
                    <div className="w-10 h-10 bg-iconBlue rounded-md flex items-center justify-center mr-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                      </svg>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate font-medium">{item.filename || "ფაილი"}</p>
                      <p className="text-xs text-textGray">
                        {new Date(item.timestamp).toLocaleDateString('ka-GE')}
                      </p>
                    </div>
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfileSidebar;