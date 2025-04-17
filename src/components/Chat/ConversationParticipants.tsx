"use client";

import { useState } from "react";
import Image from "@/components/Image";

type Participant = {
  userId: string;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    img: string | null;
  };
};

type ConversationParticipantsProps = {
  participants: Participant[];
  isGroup: boolean;
  name?: string | null;
};

const ConversationParticipants = ({
  participants,
  isGroup,
  name
}: ConversationParticipantsProps) => {
  const [showParticipants, setShowParticipants] = useState(false);

  if (!isGroup && participants.length < 3) return null;

  return (
    <div className="border-t border-borderGray">
      <div 
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setShowParticipants(!showParticipants)}
      >
        <span className="font-medium">
          {isGroup ? "ჯგუფის მონაწილეები" : "საუბრის მონაწილეები"}
        </span>
        <div className="flex items-center">
          <span className="text-sm text-textGray mr-2">
            {participants.length} მონაწილე
          </span>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="16" 
            height="16" 
            viewBox="0 0 24 24"
            className={`transition-transform ${showParticipants ? "rotate-180" : ""}`}
          >
            <path 
              fill="#71767b" 
              d="M12 15.375l-6-6 1.4-1.4 4.6 4.6 4.6-4.6 1.4 1.4z"
            />
          </svg>
        </div>
      </div>
      
      {showParticipants && (
        <div className="p-4 border-t border-borderGray">
          {participants.map((participant) => (
            <div 
              key={participant.userId}
              className="flex items-center gap-3 py-2"
            >
              <div className="relative w-10 h-10 rounded-full overflow-hidden">
                <Image
                  path={participant.user.img || "general/noAvatar.png"}
                  alt={participant.user.username}
                  w={40}
                  h={40}
                  tr={true}
                />
              </div>
              <div>
                <div className="font-bold">
                  {participant.user.displayName || participant.user.username}
                </div>
                <div className="text-sm text-textGray">
                  @{participant.user.username}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ConversationParticipants;