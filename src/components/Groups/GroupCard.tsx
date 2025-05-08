"use client";

import Link from "next/link";
import { Lock, Unlock, Brain, Wrench, Newspaper, Users, ChevronRight } from "lucide-react";

// გრუპის ტიპის იკონები
const groupTypeIcons = {
  standard: <Users className="w-5 h-5" />,
  quantum: <Brain className="w-5 h-5 text-accent" />,
  project: <Wrench className="w-5 h-5" />,
  info: <Newspaper className="w-5 h-5" />
};

// ჯგუფის ტიპების სახელები
const groupTypeNames = {
  standard: "სტანდარტული",
  quantum: "ქვანტური აზროვნების",
  project: "პროექტების",
  info: "საინფორმაციო"
};

type GroupCardProps = {
  group: {
    id: string;
    name: string;
    description: string | null;
    coverImage: string | null;
    type: string;
    icon: string | null;
    isPrivate: boolean;
    _count: {
      members: number;
      posts: number;
    };
    members?: any[]; // შესაძლოა იყოს ან არა
  };
};

const GroupCard = ({ group }: GroupCardProps) => {
  // წევრობის შემოწმების ფუნქცია
  const isMember = (group: any) => {
    return group.members && group.members.length > 0;
  };

  return (
    <div
      className="bg-secondary-dark border border-borderGray-dark rounded-lg overflow-hidden shadow-card hover:shadow-hover transition-all hover:-translate-y-1"
    >
      {/* ჯგუფის სურათი */}
      <div 
        className="h-32 bg-gradient-to-r from-secondary-dark to-secondary bg-cover bg-center"
        style={{ backgroundImage: group.coverImage ? `url(${group.coverImage})` : undefined }}
      >
        <div className="flex justify-between items-start p-3">
          <div 
            className="w-12 h-12 flex items-center justify-center text-2xl bg-secondary-dark rounded-lg shadow-lg"
          >
            {group.icon || groupTypeIcons[group.type as keyof typeof groupTypeIcons]}
          </div>
          <div className="bg-secondary-dark bg-opacity-70 backdrop-blur-sm p-1 rounded-md">
            {group.isPrivate ? (
              <Lock className="w-4 h-4 text-gray-300" />
            ) : (
              <Unlock className="w-4 h-4 text-gray-300" />
            )}
          </div>
        </div>
      </div>
      
      {/* ჯგუფის ინფორმაცია */}
      <div className="p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold text-white truncate">
            {group.name}
          </h3>
          <span className="text-xs px-2 py-0.5 bg-secondary rounded-full text-gray-300">
            {groupTypeNames[group.type as keyof typeof groupTypeNames]}
          </span>
        </div>
        
        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
          {group.description || "ჯგუფის აღწერა არ არის მითითებული"}
        </p>
        
        <div className="flex justify-between items-center text-sm text-gray-400 mb-4">
          <div>
            <span className="font-medium text-white">
              {group._count.members}
            </span>{" "}
            წევრი
          </div>
          <div>
            <span className="font-medium text-white">
              {group._count.posts}
            </span>{" "}
            პოსტი
          </div>
        </div>
        
        <Link 
          href={`/groups/${group.id}`}
          className={`w-full flex justify-center items-center py-2 px-4 rounded-lg text-sm ${
            isMember(group) 
              ? "bg-accent text-white hover:bg-accent-dark" 
              : group.isPrivate 
                ? "bg-secondary text-white hover:bg-secondary-light" 
                : "bg-secondary text-white hover:bg-secondary-light"
          }`}
        >
          {isMember(group) ? (
            <>შესვლა</>
          ) : group.isPrivate ? (
            <>გაწევრიანების მოთხოვნა</>
          ) : (
            <>გაწევრიანება</>
          )}
          <ChevronRight className="w-4 h-4 ml-1" />
        </Link>
      </div>
    </div>
  );
};

export default GroupCard;