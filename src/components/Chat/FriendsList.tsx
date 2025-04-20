"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "../CustomImage";
import { socket } from "@/socket";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";

type FriendType = {
  id: string;
  username: string;
  displayName?: string | null;
  img?: string | null;
  gender?: string;
  isOnline?: boolean;
  lastActive?: string;
};

const FriendsList = () => {
  const [friends, setFriends] = useState<FriendType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const { user } = useUser();

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const response = await fetch("/api/friends");
        if (!response.ok) throw new Error("მეგობრების მიღება ვერ მოხერხდა");
        
        const data = await response.json();
        
        // დავამატოთ არის თუ არა ონლაინ ყოველ მეგობარს
        const friendsWithStatus = data.map((friend: FriendType) => {
          return {
            ...friend,
            isOnline: Math.random() > 0.5, // სიმულაცია - რეალურ API-ში ეს უნდა მოვიდეს სერვერიდან
            lastActive: new Date(Date.now() - Math.floor(Math.random() * 10000000)).toISOString()
          };
        });
        
        setFriends(friendsWithStatus);
      } catch (error) {
        console.error("შეცდომა:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();

    // მოვუსმინოთ ონლაინ სტატუსის ცვლილებებს
    const handleStatusChange = (data: { userId: string; isOnline: boolean }) => {
      setFriends(prevFriends => 
        prevFriends.map(friend => 
          friend.id === data.userId 
          ? {...friend, isOnline: data.isOnline} 
          : friend
        )
      );
    };

    socket.on("userStatusChange", handleStatusChange);

    return () => {
      socket.off("userStatusChange", handleStatusChange);
    };
  }, []);

  // მეგობრების გაფილტვრა საძიებო ველის მიხედვით
  const filteredFriends = friends.filter(friend => 
    friend.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (friend.displayName && friend.displayName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // დავალაგოთ მეგობრები: ჯერ ონლაინ მყოფები, შემდეგ დანარჩენები
  const sortedFriends = [...filteredFriends].sort((a, b) => {
    if (a.isOnline && !b.isOnline) return -1;
    if (!a.isOnline && b.isOnline) return 1;
    return 0;
  });

  const startChat = (friendId: string) => {
    router.push(`/messages/new?recipient=${friendId}`);
  };

  if (loading) {
    return <div className="p-4">იტვირთება...</div>;
  }

  return (
    <div className="border-r border-borderGray h-full">
      <div className="p-4 border-b border-borderGray">
        <h2 className="text-lg font-bold mb-2">მეგობრები</h2>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="მოძებნე მეგობრები..."
            className="w-full bg-inputGray p-2 pl-8 rounded-md outline-none"
          />
          <svg
            className="absolute left-2 top-2.5 text-textGray"
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
      </div>

      <div className="overflow-y-auto h-[calc(100vh-180px)]">
        {sortedFriends.length === 0 ? (
          <div className="p-4 text-center text-textGray">
            {searchQuery ? "მეგობრები ვერ მოიძებნა" : "მეგობრები არ გყავთ ჯერ"}
          </div>
        ) : (
          sortedFriends.map((friend) => (
            <div
              key={friend.id}
              className="flex items-center gap-3 p-4 border-b border-borderGray hover:bg-[#181818] cursor-pointer"
              onClick={() => startChat(friend.id)}
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-full overflow-hidden">
                <Image
  path={user.img}
  alt={`${user.username}'s avatar`}
  w={50}
  h={50}
  tr={true}
  isAvatar={true}
  gender={user.gender}
  className="rounded-full"
/>
                </div>
                <div 
                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-black ${
                    friend.isOnline ? 'bg-green-500' : 'bg-gray-500'
                  }`}
                ></div>
              </div>
              <div className="flex-1">
                <div className="font-semibold">
                  {friend.displayName || friend.username}
                </div>
                <div className="text-sm text-textGray flex items-center">
                  {friend.isOnline ? (
                    <span className="text-green-500">ონლაინ</span>
                  ) : (
                    <span>ბოლოს აქტიური: {new Date(friend.lastActive || "").toLocaleDateString("ka-GE")}</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="p-4 border-t border-borderGray">
        <Link
          href="/find-friends"
          className="block text-center text-iconBlue hover:underline"
        >
          მოძებნე ახალი მეგობრები
        </Link>
      </div>
    </div>
  );
};

export default FriendsList;