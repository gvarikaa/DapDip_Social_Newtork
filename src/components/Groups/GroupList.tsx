"use client";

import { useState, useEffect } from "react";
import GroupCard from "./GroupCard";
import { Filter, UserPlus, Users, Search, Brain, Wrench, Newspaper, Building } from "lucide-react";
import Link from "next/link";

// ჯგუფის ტიპების სახელები
const groupTypeNames = {
  standard: "სტანდარტული",
  quantum: "ქვანტური აზროვნების",
  project: "პროექტების",
  info: "საინფორმაციო"
};

type GroupListProps = {
  initialGroups?: any[];
  showSearch?: boolean;
  showFilters?: boolean;
  showCreateButton?: boolean;
  isLoggedIn?: boolean;
  limit?: number;
  title?: string;
  emptyMessage?: string;
};

const GroupList = ({ 
  initialGroups, 
  showSearch = true, 
  showFilters = true, 
  showCreateButton = true,
  isLoggedIn = false,
  limit,
  title = "ჯგუფები",
  emptyMessage = "ჯგუფები ვერ მოიძებნა"
}: GroupListProps) => {
  const [groups, setGroups] = useState<any[]>(initialGroups || []);
  const [loading, setLoading] = useState(!initialGroups);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all"); // "all", "my", "quantum", etc.
  const [page, setPage] = useState(1);
  const [totalGroups, setTotalGroups] = useState(0);
  
  // ჯგუფების ჩატვირთვის ფუნქცია
  const loadGroups = async (page = 1, filter = activeFilter, search = searchTerm, pageLimit = limit) => {
    try {
      setLoading(true);
      
      let url = `/api/groups?page=${page}&pageSize=${pageLimit || 12}`;
      
      // ფილტრის დამატება
      if (filter === "my") {
        url += "&memberOf=true";
      } else if (filter !== "all") {
        url += `&type=${filter}`;
      }
      
      // ძიების დამატება
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (response.ok) {
        setGroups(data.groups);
        setTotalGroups(data.pagination.total);
      } else {
        console.error("Error loading groups:", data.error);
      }
    } catch (error) {
      console.error("Failed to load groups:", error);
    } finally {
      setLoading(false);
    }
  };

  // ძიების ფუნქცია
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadGroups(1, activeFilter, searchTerm);
  };

  // ფილტრის ცვლილების დამუშავება
  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    setPage(1);
    loadGroups(1, filter, searchTerm);
  };

  // გვერდის ცვლილების დამუშავება
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    loadGroups(newPage, activeFilter, searchTerm);
  };

  // საწყისი ჩატვირთვა თუ initialGroups არ არის მოწოდებული
  useEffect(() => {
    if (!initialGroups) {
      loadGroups(1, "all", "", limit);
    } else {
      setGroups(initialGroups);
    }
  }, [initialGroups, limit]);

  return (
    <div>
      {/* ჰედერი და ფილტრები */}
      {(title || showCreateButton) && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          {title && (
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
              <p className="text-gray-400">აღმოაჩინე ჯგუფები, შეუერთდი დისკუსიას, გაუზიარე შენი მოსაზრებები</p>
            </div>
          )}
          
          {showCreateButton && isLoggedIn && (
            <Link
              href="/groups/create"
              className="mt-4 md:mt-0 bg-accent hover:bg-accent-dark text-white py-2 px-4 rounded-lg flex items-center transition-colors"
            >
              <Users className="w-5 h-5 mr-2" />
              შექმენი ჯგუფი
            </Link>
          )}
        </div>
      )}
      
      {/* ძიება და ფილტრები */}
      {(showSearch || showFilters) && (
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          {showSearch && (
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="მოძებნე ჯგუფები..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-secondary-dark border border-borderGray-dark rounded-lg py-2 pl-10 pr-4 text-white focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  ძიება
                </button>
              </div>
            </form>
          )}
          
          {showFilters && (
            <div className="flex overflow-x-auto pb-2 gap-2 md:gap-1">
              <button
                onClick={() => handleFilterChange("all")}
                className={`px-3 py-1.5 rounded-lg flex items-center whitespace-nowrap text-sm ${
                  activeFilter === "all"
                    ? "bg-accent text-white"
                    : "bg-secondary text-gray-300 hover:bg-secondary-dark"
                }`}
              >
                <Filter className="w-4 h-4 mr-1" />
                ყველა
              </button>
              
              {isLoggedIn && (
                <button
                  onClick={() => handleFilterChange("my")}
                  className={`px-3 py-1.5 rounded-lg flex items-center whitespace-nowrap text-sm ${
                    activeFilter === "my"
                      ? "bg-accent text-white"
                      : "bg-secondary text-gray-300 hover:bg-secondary-dark"
                  }`}
                >
                  <UserPlus className="w-4 h-4 mr-1" />
                  ჩემი ჯგუფები
                </button>
              )}
              
              {/* ჯგუფის ტიპების ფილტრები */}
              {Object.entries(groupTypeNames).map(([type, name]) => (
                <button
                  key={type}
                  onClick={() => handleFilterChange(type)}
                  className={`px-3 py-1.5 rounded-lg flex items-center whitespace-nowrap text-sm ${
                    activeFilter === type
                      ? "bg-accent text-white"
                      : "bg-secondary text-gray-300 hover:bg-secondary-dark"
                  }`}
                >
                  {type === 'standard' ? (
                    <Users className="w-4 h-4 mr-1" />
                  ) : type === 'quantum' ? (
                    <Brain className="w-4 h-4 mr-1" />
                  ) : type === 'project' ? (
                    <Wrench className="w-4 h-4 mr-1" />
                  ) : (
                    <Newspaper className="w-4 h-4 mr-1" />
                  )}
                  <span className="ml-1">{name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* ჯგუფების ჩვენება */}
      {loading ? (
        // ჩატვირთვის ანიმაცია
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="bg-secondary-dark rounded-lg p-6 h-64 animate-pulse"
            >
              <div className="bg-secondary h-4 w-3/4 rounded mb-4"></div>
              <div className="bg-secondary h-3 w-1/2 rounded mb-2"></div>
              <div className="bg-secondary h-3 w-5/6 rounded mb-2"></div>
              <div className="bg-secondary h-3 w-2/3 rounded mb-6"></div>
              <div className="bg-secondary h-10 w-full rounded-lg"></div>
            </div>
          ))}
        </div>
      ) : groups.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-secondary-dark bg-opacity-50 rounded-lg">
          <Building className="w-16 h-16 mx-auto text-gray-500 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">ჯგუფები ვერ მოიძებნა</h3>
          <p className="text-gray-400 mb-6">
            {searchTerm 
              ? "თქვენი ძიებით ვერაფერი მოიძებნა. სცადეთ სხვა საკვანძო სიტყვა." 
              : activeFilter === "my" 
                ? "თქვენ არ ხართ გაწევრიანებული არცერთ ჯგუფში." 
                : emptyMessage}
          </p>
          {isLoggedIn && showCreateButton && (
            <Link
              href="/groups/create"
              className="bg-accent hover:bg-accent-dark text-white py-2 px-6 rounded-lg transition-colors"
            >
              შექმენი პირველი ჯგუფი
            </Link>
          )}
        </div>
      )}
      
      {/* პაგინაცია */}
      {!loading && groups.length > 0 && !limit && totalGroups > 12 && (
        <div className="flex justify-center mt-8">
          <div className="flex space-x-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className={`px-3 py-1 rounded-md text-sm ${
                page === 1
                  ? "bg-secondary-dark text-gray-500 cursor-not-allowed"
                  : "bg-secondary text-white hover:bg-secondary-light"
              }`}
            >
              წინა
            </button>
            
            {/* გვერდების ღილაკები */}
            {[...Array(Math.min(5, Math.ceil(totalGroups / 12)))].map((_, i) => {
              const pageNumber = i + 1;
              return (
                <button
                  key={i}
                  onClick={() => handlePageChange(pageNumber)}
                  className={`px-3 py-1 rounded-md text-sm ${
                    page === pageNumber
                      ? "bg-accent text-white"
                      : "bg-secondary text-white hover:bg-secondary-light"
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}
            
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= Math.ceil(totalGroups / 12)}
              className={`px-3 py-1 rounded-md text-sm ${
                page >= Math.ceil(totalGroups / 12)
                  ? "bg-secondary-dark text-gray-500 cursor-not-allowed"
                  : "bg-secondary text-white hover:bg-secondary-light"
              }`}
            >
              შემდეგი
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupList;