"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { 
  Users, Plus, ChevronRight, Search,
  Filter, Brain, Wrench, Newspaper,
  Building, Lock, Unlock, UserPlus
} from "lucide-react";

// ჯგუფების ტიპის იკონები
const groupTypeIcons = {
  standard: <Users className="w-5 h-5" />,
  quantum: <Brain className="w-5 h-5" />,
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

export default function GroupsPage() {
  const { user, dbUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<any[]>([]);
  const [totalGroups, setTotalGroups] = useState(0);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  
  // URL-დან ფილტრის ამოღება
  const typeParam = searchParams.get("type");
  const memberOfParam = searchParams.get("memberOf") === "true";
  
  // ფილტრის დადგენა URL პარამეტრების მიხედვით
  const getFilterFromParams = useCallback(() => {
    if (memberOfParam) return "my";
    if (typeParam) return typeParam;
    return "all";
  }, [typeParam, memberOfParam]);
  
  const [activeFilter, setActiveFilter] = useState(getFilterFromParams());

  // URL-ის პარამეტრების ცვლილებაზე რეაგირება
  useEffect(() => {
    setActiveFilter(getFilterFromParams());
  }, [getFilterFromParams]);

  // წევრობის შემოწმების ფუნქცია
  const isMember = (group: any) => {
    return group.members && group.members.length > 0;
  };

  // ჯგუფების ჩატვირთვის ფუნქცია
  const loadGroups = async (page = 1, filter = activeFilter, search = searchTerm) => {
    try {
      setLoading(true);
      
      let url = `/api/groups?page=${page}&pageSize=12`;
      
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

  // ფილტრის ცვლილების დამუშავება - ახლა URL-ს ვცვლით
  const handleFilterChange = (filter: string) => {
    if (filter === "all") {
      router.push("/groups");
    } else if (filter === "my") {
      router.push("/groups?memberOf=true");
    } else {
      router.push(`/groups?type=${filter}`);
    }
  };

  // გვერდის ცვლილების დამუშავება
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    loadGroups(newPage, activeFilter, searchTerm);
  };

  // საწყისი ჩატვირთვა და URL პარამეტრების ცვლილებაზე რეაგირება
  useEffect(() => {
    loadGroups(1, activeFilter, searchTerm);
  }, [activeFilter]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white text-center mb-2">აღმოაჩინე ჯგუფები</h1>
          <p className="text-gray-400 text-center">შეუერთდი დისკუსიას, გაუზიარე შენი მოსაზრებები და აღმოაჩინე ახალი პერსპექტივები</p>
        </div>
        
        {/* ძიება */}
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="მოძებნე ჯგუფები სახელით ან აღწერით..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-secondary-dark border border-borderGray-dark rounded-lg py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <button
              type="submit"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-accent hover:bg-accent-dark text-white px-4 py-1.5 rounded-md text-sm transition-colors"
            >
              ძიება
            </button>
          </div>
        </form>
        
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
              <div
                key={group.id}
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
                  : "ამ კატეგორიაში ჯგუფები ვერ მოიძებნა."}
            </p>
            {(user || dbUser) && (
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
        {!loading && groups.length > 0 && (
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
    </div>
  );
}