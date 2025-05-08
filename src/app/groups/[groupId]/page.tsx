"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import Link from "next/link";
import dynamic from "next/dynamic";
import { createPortal } from "react-dom";
import ProfileAvatar from "@/components/Avatar/ProfileAvatar";
import PostEmojiPicker from "@/components/PostMaker/PostEmojiPicker";
import GroupCoverEditor from "@/components/Groups/GroupCoverEditor";
import GroupAvatarEditor from "@/components/Groups/GroupAvatarEditor";
import {
  Users,
  Settings,
  Brain,
  Wrench,
  Newspaper,
  PenSquare,
  Lock,
  Unlock,
  UserPlus,
  MessageSquare,
  Sparkles,
  ChartBar,
  Share2,
  ExternalLink,
  Bell,
  BellOff,
  Radio,
  BarChart3,
  Image,
  Video,
  Smile,
  Camera,
}  from "lucide-react";

// დინამიურად ვტვირთავთ მოდალებს კლიენტის მხარეს
const PostPoll = dynamic(() => import("@/components/PostMaker/PostPoll"), { ssr: false });
const PostLiveStream = dynamic(() => import("@/components/PostMaker/PostLiveStream"), { ssr: false });

// ჯგუფების ტიპის იკონები
const groupTypeIcons = {
  standard: <Users className="w-5 h-5" />,
  quantum: <Brain className="w-5 h-5 text-accent" />,
  project: <Wrench className="w-5 h-5" />,
  info: <Newspaper className="w-5 h-5" />,
};

export default function GroupPage() {
  const { groupId } = useParams() as { groupId: string };
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [membership, setMembership] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("posts"); // "posts", "members", "about"
  const [joiningStatus, setJoiningStatus] = useState(""); // "", "loading", "success", "error"
  const [joinError, setJoinError] = useState("");
  
  // პოსტის შექმნის სტეიტები
  const [postContent, setPostContent] = useState("");
  const [postMedia, setPostMedia] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [postError, setPostError] = useState("");
  
  // დამატებითი ფუნქციონალის სტეიტები
  const [postType, setPostType] = useState<"regular" | "poll" | "livestream">("regular"); // პოსტის ტიპი
  const [showPollModal, setShowPollModal] = useState(false); // გამოკითხვის მოდალი
  const [showLivestreamModal, setShowLivestreamModal] = useState(false); // ლაივსტრიმის მოდალი
  const [pollData, setPollData] = useState<any>(null); // გამოკითხვის მონაცემები
  const [livestreamData, setLivestreamData] = useState<any>(null); // ლაივსტრიმის მონაცემები
  
  // ედიტორის სტეიტები
  const [showCoverEditor, setShowCoverEditor] = useState(false);
  const [showAvatarEditor, setShowAvatarEditor] = useState(false);
  const [isBrowser, setIsBrowser] = useState(false);
  
  // აქ ვამუშავებთ პორტალს, მხოლოდ ბრაუზერში
  useEffect(() => {
    setIsBrowser(true);
  }, []);

  // ჯგუფის ინფორმაციის ჩატვირთვა - useEffect-დან მოხდება გამოძახება
  const loadGroupDetails = async () => {
    if (!groupId) return;
    
    try {
      setLoading(true);
      
      // ჯგუფის მონაცემების ჩატვირთვა
      const groupResponse = await fetch(`/api/groups/${groupId}`);
      const groupData = await groupResponse.json();

      if (!groupResponse.ok) {
        console.error("Error loading group:", groupData.error);
        // თუ კონკრეტული შეცდომაა
        if (groupData.isPrivate) {
          setGroup({ isPrivate: true, name: "პრივატული ჯგუფი" });
        }
        setLoading(false);
        return;
      }
      
      // ჯგუფის პოსტების ჩატვირთვა
      const postsResponse = await fetch(`/api/groups/${groupId}/posts`);
      const postsData = await postsResponse.json();
      
      if (!postsResponse.ok) {
        console.error("Error loading posts:", postsData.error);
      }
      
      // მონაცემების ერთდროულად განახლება
      setGroup(groupData.group);
      setMembership(groupData.membership);
      if (postsResponse.ok) {
        setPosts(postsData.posts);
      }
    } catch (error) {
      console.error("Failed to load group data:", error);
    } finally {
      setLoading(false);
    }
  };

  // ჯგუფში გაწევრიანების ფუნქცია
  const joinGroup = async () => {
    if (!user) {
      router.push("/sign-in");
      return;
    }

    try {
      setJoiningStatus("loading");
      setJoinError("");

      const response = await fetch(`/api/groups/${groupId}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: "", // მოთხოვნის დროს მესიჯის დამატება შეიძლება
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setJoiningStatus("success");
        // პრივატული ჯგუფის შემთხვევაში მოთხოვნა იგზავნება, ღია ჯგუფის შემთხვევაში პირდაპირ წევრი ხდება
        if (data.memberId) {
          // ასინქრონულად გადავამოწმოთ და ჩავტვირთოთ ინფორმაცია
          (async () => {
            try {
              const groupRes = await fetch(`/api/groups/${groupId}`);
              const groupData = await groupRes.json();
              
              if (groupRes.ok && groupData.group) {
                setGroup(groupData.group);
                setMembership(groupData.membership);
              }
            } catch (err) {
              console.error("Failed to reload group data after joining:", err);
            }
          })();
        }
      } else {
        setJoiningStatus("error");
        setJoinError(data.error || "შეცდომა გაწევრიანების დროს");
      }
    } catch (error) {
      console.error("Failed to join group:", error);
      setJoiningStatus("error");
      setJoinError("შეცდომა კავშირის დროს");
    }
  };
  
  // ემოჯის დამატების ფუნქცია
  const handleAddEmoji = (emoji: string) => {
    setPostContent(prev => prev + emoji);
  };
  
  // პოსტის ტიპის ცვლილება
  const handlePostTypeChange = (type: "regular" | "poll" | "livestream") => {
    if (postType === type) return;
    setPostType(type);
    setPostError("");
  };
  
  // გამოკითხვის შენახვა
  const handleSavePoll = (data: any) => {
    setPollData(data);
    setShowPollModal(false);
    handlePostTypeChange("poll");
  };
  
  // ლაივსტრიმის შენახვა
  const handleSaveLivestream = (data: any) => {
    setLivestreamData(data);
    setShowLivestreamModal(false);
    handlePostTypeChange("livestream");
  };

  // პოსტის ვალიდაცია
  const validatePost = () => {
    if (postType === "regular" && !postContent.trim() && postMedia.length === 0) {
      setPostError("პოსტს უნდა ჰქონდეს ტექსტი ან მედია");
      return false;
    }
    
    if (postType === "poll" && !pollData) {
      setPostError("გამოკითხვის პარამეტრები არ არის განსაზღვრული");
      return false;
    }
    
    if (postType === "livestream" && !livestreamData) {
      setPostError("ლაივ სტრიმის პარამეტრები არ არის განსაზღვრული");
      return false;
    }
    
    return true;
  };
  
  // პოსტის დამატების ფუნქცია
  const createPost = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      router.push("/sign-in");
      return;
    }
    
    // პოსტის ვალიდაცია
    if (!validatePost()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      setPostError("");
      
      let endpoint = `/api/groups/${groupId}/posts`;
      let postData: any = {
        content: postContent.trim(),
        isSensitive: postMedia.some(item => item.settings?.sensitive),
        allowComments: true
      };
      
      // დამატებითი მონაცემები პოსტის ტიპის მიხედვით
      if (postType === "poll" && pollData) {
        // პოლის API-ს ენდპოინტი
        endpoint = `/api/groups/${groupId}/polls`;
        postData = {
          question: pollData.question,
          options: pollData.options.map((opt: any) => opt.text),
          isMultiple: pollData.allowMultipleAnswers,
          isAnonymous: pollData.isAnonymous,
          endDate: pollData.endDate,
          content: postContent.trim() // დამატებითი აღწერა თუ არის
        };
      } else if (postType === "livestream" && livestreamData) {
        // ლაივსტრიმ API-ს ენდპოინტი
        endpoint = `/api/groups/${groupId}/livestreams`;
        postData = {
          title: livestreamData.title,
          description: livestreamData.description || postContent.trim(),
          scheduledStartTime: livestreamData.scheduled ? livestreamData.scheduledDate : new Date().toISOString(),
          visibility: "public", // შეგიძლია ჩაამატო ხილვადობის არჩევა გვერდზე
          settings: {
            allowComments: true
          }
        };
      }
      
      console.log("გაგზავნის მონაცემები:", { endpoint, postData });
      
      // API მოთხოვნა
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // 2. თუ გვაქვს მედია და ჩვეულებრივი პოსტია, ავტვირთოთ
        if (postMedia.length > 0 && postType === "regular" && data.post?.id) {
          try {
            const formData = new FormData();
            formData.append('postId', data.post.id.toString());
            
            // კაპშენების მომზადება
            const captions: Record<string, string> = {};
            
            // დავამატოთ გრუპის ID
            formData.append('groupId', groupId);
            
            postMedia.forEach(media => {
              formData.append('files', media.file);
              if (media.settings?.caption) {
                captions[media.file.name] = media.settings.caption;
              }
            });
            
            // კაპშენები
            formData.append('captions', JSON.stringify(captions));
            
            // მედიის პარამეტრები (type, sensitive)
            const mediaSettings = postMedia.map(media => ({
              fileName: media.file.name,
              type: media.settings?.type || 'original',
              sensitive: media.settings?.sensitive || false
            }));
            
            formData.append('mediaSettings', JSON.stringify(mediaSettings));
            
            // მედიის ატვირთვა
            const mediaResponse = await fetch('/api/upload', {
              method: 'POST',
              body: formData,
            });
            
            if (!mediaResponse.ok) {
              throw new Error('მედიის ატვირთვა ვერ მოხერხდა');
            }
          } catch (mediaError) {
            console.error("ფაილების ატვირთვის შეცდომა:", mediaError);
            // გავაგრძელოთ, რადგან პოსტი უკვე შექმნილია
          }
        }
        
        // პოსტის წარმატებით დამატება - გავასუფთავოთ ფორმა
        setPostContent("");
        setPostMedia([]);
        setPostType("regular");
        setPollData(null);
        setLivestreamData(null);
        
        // ახალი პოსტების ჩატვირთვა ასინქრონულად
        // ვიყენებთ მეტ დაცვას და ვრთავთ isMounted შემოწმებას
        (async () => {
          try {
            const res = await fetch(`/api/groups/${groupId}/posts`);
            if (!res.ok) return;
            
            const data = await res.json();
            // ვამოწმებთ კომპონენტი კვლავ მაუნთედია თუ არა და მხოლოდ მაშინ ვანახლებთ state-ს
            if (data.posts) {
              setPosts(prev => {
                // მხოლოდ მაშინ განვაახლოთ state, თუ მართლა შეიცვალა
                if (JSON.stringify(prev) !== JSON.stringify(data.posts)) {
                  return data.posts;
                }
                return prev;
              });
            }
          } catch (err) {
            console.error("Failed to reload posts:", err);
          }
        })();
      } else {
        console.error("API პასუხი:", data);
        setPostError(data.error || "შეცდომა პოსტის დამატებისას");
      }
    } catch (error) {
      console.error("Failed to create post:", error);
      setPostError("სერვერთან დაკავშირების შეცდომა");
    } finally {
      setIsSubmitting(false);
    }
  };

  // საწყისი ჩატვირთვა - მხოლოდ კომპონენტის პირველი რენდერის დროს
  // ან როცა groupId იცვლება
  useEffect(() => {
    // განვსაზღვროთ isMounted ცვლადი კომპონენტის მდგომარეობის მისათითებლად
    let isMounted = true;
    
    // დაცვა, რომ კომპონენტის unmount-ის მერე არ მოხდეს state განახლება
    const fetchData = async () => {
      if (!groupId || !isMounted) return;
      
      try {
        setLoading(true);
        
        // ჯგუფის მონაცემების ჩატვირთვა
        const groupResponse = await fetch(`/api/groups/${groupId}`);
        
        // ვამოწმებთ კომპონენტი კვლავ მაუნთედია თუ არა
        if (!isMounted) return;
        
        const groupData = await groupResponse.json();

        if (!groupResponse.ok) {
          console.error("Error loading group:", groupData.error);
          // თუ კონკრეტული შეცდომაა
          if (groupData.isPrivate && isMounted) {
            setGroup({ isPrivate: true, name: "პრივატული ჯგუფი" });
          }
          if (isMounted) {
            setLoading(false);
          }
          return;
        }
        
        // ჯგუფის პოსტების ჩატვირთვა
        const postsResponse = await fetch(`/api/groups/${groupId}/posts`);
        
        // ვამოწმებთ კომპონენტი კვლავ მაუნთედია თუ არა
        if (!isMounted) return;
        
        const postsData = await postsResponse.json();
        
        if (!postsResponse.ok) {
          console.error("Error loading posts:", postsData.error);
        }
        
        // მხოლოდ მაშინ ვანახლებთ state-ს, თუ კომპონენტი მაუნთედია
        if (isMounted) {
          // მონაცემების ერთდროულად განახლება
          setGroup(groupData.group);
          setMembership(groupData.membership);
          if (postsResponse.ok) {
            setPosts(postsData.posts);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error("Failed to load group data:", error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchData();
    
    // cleanup ფუნქცია, რომელიც unmount-ის დროს გაეშვება
    return () => {
      isMounted = false;
    };
  }, [groupId]); // მხოლოდ groupId-ზეა დამოკიდებული

  // ამ კომპონენტის რენდერი ხდება, როცა ჯგუფი ჯერ ჩატვირთული არ არის
  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-48 bg-secondary-dark rounded-lg mb-6"></div>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-2/3">
                <div className="h-8 bg-secondary-dark rounded mb-4 w-1/3"></div>
                <div className="h-4 bg-secondary-dark rounded mb-2 w-2/3"></div>
                <div className="h-4 bg-secondary-dark rounded mb-2 w-3/4"></div>
                <div className="h-4 bg-secondary-dark rounded mb-6 w-1/2"></div>
                
                <div className="flex gap-2 mb-6">
                  <div className="h-10 bg-secondary-dark rounded w-20"></div>
                  <div className="h-10 bg-secondary-dark rounded w-20"></div>
                  <div className="h-10 bg-secondary-dark rounded w-20"></div>
                </div>
                
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-secondary-dark rounded-lg p-4">
                      <div className="flex gap-3 mb-3">
                        <div className="w-10 h-10 bg-secondary rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-secondary rounded mb-2 w-1/4"></div>
                          <div className="h-3 bg-secondary rounded w-1/3"></div>
                        </div>
                      </div>
                      <div className="h-4 bg-secondary rounded mb-2 w-full"></div>
                      <div className="h-4 bg-secondary rounded mb-2 w-5/6"></div>
                      <div className="h-4 bg-secondary rounded w-2/3"></div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="w-full md:w-1/3 space-y-4">
                <div className="bg-secondary-dark rounded-lg p-4">
                  <div className="h-5 bg-secondary rounded mb-4 w-1/2"></div>
                  <div className="h-4 bg-secondary rounded mb-2 w-full"></div>
                  <div className="h-4 bg-secondary rounded mb-2 w-5/6"></div>
                  <div className="h-4 bg-secondary rounded w-4/6"></div>
                </div>
                
                <div className="bg-secondary-dark rounded-lg p-4">
                  <div className="h-5 bg-secondary rounded mb-4 w-1/3"></div>
                  <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <div className="w-8 h-8 bg-secondary rounded-full"></div>
                        <div className="h-4 bg-secondary rounded w-2/3"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // თუ ჯგუფი ვერ მოიძებნა
  if (!group) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center bg-secondary-dark p-8 rounded-lg max-w-md">
          <Users className="w-16 h-16 text-accent mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">ჯგუფი ვერ მოიძებნა</h1>
          <p className="text-gray-400 mb-6">
            მოთხოვნილი ჯგუფი არ არსებობს ან არ გაქვთ მასზე წვდომა.
          </p>
          <Link
            href="/groups"
            className="bg-accent text-white px-6 py-2 rounded-lg hover:bg-accent-dark transition-colors"
          >
            ყველა ჯგუფი
          </Link>
        </div>
      </div>
    );
  }

  // პრივატული ჯგუფის შეზღუდული ნახვა
  if (group.isPrivate && !membership) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-secondary-dark rounded-lg p-8 flex flex-col items-center text-center">
            <Lock className="w-16 h-16 text-accent mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">პრივატული ჯგუფი</h1>
            <p className="text-gray-400 mb-6 max-w-md">
              ეს ჯგუფი პრივატულია. მის სანახავად საჭიროა გაწევრიანების მოთხოვნის გაგზავნა და ადმინისტრატორის თანხმობა.
            </p>
            
            {user ? (
              <div className="w-full max-w-sm">
                {joiningStatus === "success" ? (
                  <div className="bg-green-900/30 border border-green-800 text-green-300 p-4 rounded-lg mb-4">
                    თქვენი მოთხოვნა გაგზავნილია! დაელოდეთ ადმინისტრატორის დადასტურებას.
                  </div>
                ) : joiningStatus === "error" ? (
                  <div className="bg-red-900/30 border border-red-800 text-red-300 p-4 rounded-lg mb-4">
                    {joinError || "შეცდომა მოთხოვნის გაგზავნისას. სცადეთ მოგვიანებით."}
                  </div>
                ) : (
                  <button
                    onClick={joinGroup}
                    disabled={joiningStatus === "loading"}
                    className={`w-full bg-accent text-white px-6 py-3 rounded-lg hover:bg-accent-dark transition-colors flex items-center justify-center ${
                      joiningStatus === "loading" ? "opacity-70 cursor-not-allowed" : ""
                    }`}
                  >
                    {joiningStatus === "loading" ? (
                      <>
                        <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                        იგზავნება...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-5 h-5 mr-2" />
                        გაწევრიანების მოთხოვნა
                      </>
                    )}
                  </button>
                )}
                
                <Link
                  href="/groups"
                  className="mt-4 w-full block text-center bg-secondary text-white px-6 py-3 rounded-lg hover:bg-secondary-light transition-colors"
                >
                  დაბრუნება ჯგუფების სიაში
                </Link>
              </div>
            ) : (
              <div className="w-full max-w-sm space-y-4">
                <p className="text-gray-400">ჯგუფში გაწევრიანებისთვის საჭიროა ავტორიზაცია</p>
                <Link
                  href="/sign-in"
                  className="w-full block text-center bg-accent text-white px-6 py-3 rounded-lg hover:bg-accent-dark transition-colors"
                >
                  შესვლა
                </Link>
                <Link
                  href="/groups"
                  className="w-full block text-center bg-secondary text-white px-6 py-3 rounded-lg hover:bg-secondary-light transition-colors"
                >
                  დაბრუნება ჯგუფების სიაში
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // კატეგორიების ჩვენება ქვანტური აზროვნების ჯგუფისთვის
  const renderOpinionSpectrum = () => {
    if (group.type !== "quantum" || !group.categories?.length) return null;
    
    return (
      <div className="mt-4 mb-6">
        <h3 className="text-white text-sm mb-2 flex items-center">
          <Brain className="w-4 h-4 mr-1 text-accent" />
          აზრობრივი სპექტრი
        </h3>
        <div className="h-3 rounded-full flex overflow-hidden">
          {group.categories.map((category: any) => (
            <div
              key={category.id}
              className="h-full transition-all"
              style={{
                backgroundColor: category.color || "#333",
                width: `${100 / group.categories.length}%`
              }}
              title={category.name}
            ></div>
          ))}
        </div>
        <div className="flex justify-between mt-1 text-xs text-gray-400">
          {group.categories.length > 0 && (
            <>
              <div>{group.categories[0].name}</div>
              <div>{group.categories[group.categories.length - 1]?.name}</div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ჯგუფის სათაური */}
      <div 
        className="w-full h-48 md:h-64 bg-gradient-to-b from-secondary-dark to-background bg-cover bg-center relative group"
        style={{ backgroundImage: group.coverImage ? `url(${group.coverImage})` : undefined }}
      >
        {/* ქავერის ედიტორი - მხოლოდ ადმინისა და მოდერატორისთვის */}
        {membership && (membership.role === "admin" || membership.role === "moderator") && (
          <>
            {showCoverEditor && isBrowser ? createPortal(
              <div 
                className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm overflow-auto"
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    setShowCoverEditor(false);
                  }
                }}
                style={{ top: 0, left: 0, right: 0, bottom: 0, position: 'fixed' }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setShowCoverEditor(false);
                  }
                }}
                tabIndex={-1}
              >
                <div className="w-full max-w-2xl relative z-[10000]">
                  <GroupCoverEditor 
                    groupId={groupId}
                    initialCover={group.coverImage}
                    onSuccess={(coverUrl) => {
                      // წარმატების შემთხვევაში პირდაპირ განვაახლოთ group ობიექტი
                      setShowCoverEditor(false);
                      // ჯგუფის ობიექტს ვანახლებთ პირდაპირ ახალი URL-ით
                      // ნაცვლად API-დან თავიდან ჩატვირთვისა
                      setGroup(prevGroup => ({
                        ...prevGroup,
                        coverImage: coverUrl
                      }));
                    }} 
                    onCancel={() => setShowCoverEditor(false)}
                  />
                </div>
              </div>, 
              document.body
            ) : (
              <button
                onClick={() => setShowCoverEditor(true)}
                className="absolute right-4 top-4 p-3 bg-black/70 rounded-full text-white hover:bg-accent transition-all duration-200 z-20 opacity-0 group-hover:opacity-100 shadow-lg hover:shadow-accent/30"
                title="ქავერის შეცვლა"
              >
                <Camera className="w-6 h-6 drop-shadow-lg" />
              </button>
            )}
          </>
        )}
        
        <div className="max-w-6xl mx-auto px-4 h-full relative">
          <div className="absolute bottom-0 left-4 transform translate-y-1/2 flex items-end">
            <div className="w-24 h-24 md:w-32 md:h-32 bg-secondary-dark border-4 border-background rounded-2xl flex items-center justify-center text-4xl shadow-xl relative group overflow-hidden z-10">
              <div className="absolute inset-0 bg-secondary flex items-center justify-center overflow-hidden">
                {group.icon ? (
                  <img 
                    src={group.icon} 
                    alt={group.name} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '';
                      console.error("Failed to load group icon");
                    }}
                  />
                ) : (
                  <div className="text-gray-300 transform scale-150">
                    {groupTypeIcons[group.type as keyof typeof groupTypeIcons]}
                  </div>
                )}
              </div>
              
              {/* აიქონის ედიტორი - მხოლოდ ადმინისა და მოდერატორისთვის */}
              {membership && (membership.role === "admin" || membership.role === "moderator") && (
                <>
                  {showAvatarEditor && isBrowser ? createPortal(
                    <div 
                      className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm overflow-auto"
                      onClick={(e) => {
                        if (e.target === e.currentTarget) {
                          setShowAvatarEditor(false);
                        }
                      }}
                      style={{ top: 0, left: 0, right: 0, bottom: 0, position: 'fixed' }}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          setShowAvatarEditor(false);
                        }
                      }}
                      tabIndex={-1}
                    >
                      <div className="w-full max-w-md relative z-[10000]">
                        <GroupAvatarEditor
                          groupId={groupId}
                          initialIcon={group.icon}
                          groupType={group.type}
                          onSuccess={(iconUrl) => {
                            setShowAvatarEditor(false);
                            // ჯგუფის ობიექტს ვანახლებთ პირდაპირ ახალი URL-ით
                            // ნაცვლად API-დან თავიდან ჩატვირთვისა
                            setGroup(prevGroup => ({
                              ...prevGroup,
                              icon: iconUrl
                            }));
                          }}
                          onCancel={() => setShowAvatarEditor(false)}
                        />
                      </div>
                    </div>, 
                    document.body
                  ) : (
                    <button
                      onClick={() => setShowAvatarEditor(true)}
                      className="absolute inset-0 flex items-center justify-center bg-black/70 z-20 transition-all duration-200 group-hover:opacity-100 opacity-0 rounded-2xl"
                      title="აიქონის შეცვლა"
                    >
                      <Camera className="w-10 h-10 text-white drop-shadow-lg transform transition-transform duration-200 group-hover:scale-110" />
                    </button>
                  )}
                </>
              )}
            </div>
            <div className="ml-4 pb-4">
              <div className="flex items-center">
                <h1 className="text-3xl font-bold text-white">{group.name}</h1>
                {group.isPrivate && (
                  <Lock className="w-4 h-4 ml-2 text-gray-300" />
                )}
              </div>
              <div className="flex items-center text-sm text-gray-300">
                <span className="flex items-center">
                  {groupTypeIcons[group.type as keyof typeof groupTypeIcons]}
                  <span className="ml-1">
                    {group.type === "standard" ? "სტანდარტული ჯგუფი" :
                     group.type === "quantum" ? "ქვანტური აზროვნების ჯგუფი" :
                     group.type === "project" ? "პროექტების ჯგუფი" : 
                     "საინფორმაციო ჯგუფი"}
                  </span>
                </span>
                <span className="mx-2">•</span>
                <span>{group._count.members} წევრი</span>
              </div>
            </div>
          </div>
          
          {/* გაწევრიანების/დატოვების ღილაკები */}
          {user && !loading && (
            <div className="absolute right-4 bottom-0 transform translate-y-1/2">
              {membership ? (
                <div className="flex gap-2">
                  {/* მოდერატორის ფუნქციები */}
                  {(membership.role === "admin" || membership.role === "moderator") && (
                    <Link
                      href={`/groups/${groupId}/settings`}
                      className="bg-secondary text-white px-4 py-2 rounded-lg hover:bg-secondary-light transition-colors flex items-center"
                    >
                      <Settings className="w-4 h-4 mr-1" />
                      <span className="hidden sm:inline">მართვა</span>
                    </Link>
                  )}
                  
                  {/* ნოტიფიკაციების ღილაკი */}
                  <button
                    className="bg-secondary text-white p-2 rounded-lg hover:bg-secondary-light transition-colors"
                    title="ნოტიფიკაციების მართვა"
                  >
                    <Bell className="w-5 h-5" />
                  </button>
                  
                  {/* პოსტის დამატების ღილაკი */}
                  <Link
                    href={`/groups/${groupId}/create-post`}
                    className="bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent-dark transition-colors flex items-center"
                  >
                    <PenSquare className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">პოსტის დამატება</span>
                  </Link>
                </div>
              ) : (
                <button
                  onClick={joinGroup}
                  disabled={joiningStatus === "loading"}
                  className={`bg-accent text-white px-6 py-2 rounded-lg hover:bg-accent-dark transition-colors flex items-center ${
                    joiningStatus === "loading" ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                >
                  {joiningStatus === "loading" ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      იგზავნება...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5 mr-2" />
                      {group.isPrivate ? "გაწევრიანების მოთხოვნა" : "გაწევრიანება"}
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* ჯგუფის მთავარი კონტენტი */}
      <div className="max-w-6xl mx-auto px-4 mt-16 flex flex-col md:flex-row gap-6">
        {/* მარცხენა ნაწილი - პოსტები და ტაბები */}
        <div className="w-full md:w-2/3">
          {/* ტაბები */}
          <div className="border-b border-borderGray-dark mb-6">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("posts")}
                className={`px-4 py-2 font-medium text-sm relative ${
                  activeTab === "posts" ? "text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                პოსტები
                {activeTab === "posts" && (
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-accent rounded-t-md"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab("members")}
                className={`px-4 py-2 font-medium text-sm relative ${
                  activeTab === "members" ? "text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                წევრები
                {activeTab === "members" && (
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-accent rounded-t-md"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab("about")}
                className={`px-4 py-2 font-medium text-sm relative ${
                  activeTab === "about" ? "text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                ჯგუფის შესახებ
                {activeTab === "about" && (
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-accent rounded-t-md"></div>
                )}
              </button>
            </div>
          </div>
          
          {/* ტაბის შიგთავსი */}
          {activeTab === "posts" && (
            <div>
              {/* ქვანტური აზრების სპექტრის ვიზუალიზაცია */}
              {group.type === "quantum" && renderOpinionSpectrum()}
              
              {/* პოსტები */}
              {/* პოსტის შექმნის ფორმა - ყოველთვის ჩანს */}
              {user && membership && (
                <div className="bg-secondary-dark rounded-lg p-4 border border-borderGray-dark mb-4">
                  <form onSubmit={createPost}>
                    <div className="flex items-center gap-3 mb-3">
                      <ProfileAvatar
                        imageUrl={user.user_metadata?.avatar_url}
                        username={user.user_metadata?.username || user.email?.split('@')[0] || "user"}
                        avatarProps={null}
                        gender={user.user_metadata?.gender}
                        size="sm"
                      />
                      <div className="font-medium text-white">
                        {user.user_metadata?.name || user.user_metadata?.username || user.email?.split('@')[0] || "მომხმარებელი"}
                      </div>
                    </div>
                    
                    {/* ტექსტის შეყვანის ველი */}
                    <textarea
                      value={postContent}
                      onChange={(e) => setPostContent(e.target.value)}
                      className="w-full bg-secondary border border-borderGray-dark rounded-lg p-3 text-white min-h-[100px] focus:outline-none focus:ring-1 focus:ring-accent placeholder:text-gray-500"
                      placeholder="რას ფიქრობთ? გაუზიარეთ თქვენი აზრები ჯგუფს..."
                      disabled={isSubmitting}
                    ></textarea>
                    
                    {/* მედიის პრევიუ */}
                    {postMedia.length > 0 && (
                      <div className="mt-3 relative border border-borderGray-dark rounded-lg p-3 bg-secondary">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {postMedia.slice(0, 6).map((item, index) => (
                            <div 
                              key={item.id} 
                              className="relative aspect-square rounded-lg overflow-hidden bg-secondary-dark"
                            >
                              {item.type === 'image' ? (
                                <img 
                                  src={item.previewURL} 
                                  alt="" 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                                    <polygon points="23 7 16 12 23 17 23 7"></polygon>
                                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                                  </svg>
                                </div>
                              )}
                              
                              {/* წაშლის ღილაკი */}
                              <button 
                                onClick={() => {
                                  setPostMedia(prev => prev.filter(media => media.id !== item.id));
                                  URL.revokeObjectURL(item.previewURL);
                                }}
                                className="absolute top-1 right-1 p-1 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                                title="წაშლა"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                                  <line x1="18" y1="6" x2="6" y2="18"></line>
                                  <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                              </button>
                              
                              {index === 5 && postMedia.length > 6 && (
                                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                                  <span className="text-white font-bold text-xl">+{postMedia.length - 6}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        
                        {/* მედიის რაოდენობის ჩვენება */}
                        <div className="mt-2 text-sm text-gray-400">
                          {postMedia.length} {postMedia.length === 1 ? 'მედია' : 'მედია'} არჩეულია
                          {postMedia.length > 0 && (
                            <button 
                              type="button"
                              onClick={() => {
                                postMedia.forEach(media => URL.revokeObjectURL(media.previewURL));
                                setPostMedia([]);
                              }}
                              className="ml-2 text-red-400 hover:text-red-300"
                            >
                              გასუფთავება
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* შეცდომის გამოტანა */}
                    {postError && (
                      <div className="mt-2 text-red-400 text-sm">
                        {postError}
                      </div>
                    )}
                    
                    {/* მედიის ატვირთვის და დაპოსტვის ღილაკები */}
                    <div className="mt-3 flex justify-between items-center">
                      <div className="flex gap-3">
                        {/* ფაილის ინფუთი */}
                        <input
                          type="file"
                          id="media-upload"
                          accept="image/*,video/*"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              const newMediaItems = Array.from(e.target.files).map(file => {
                                const id = Math.random().toString(36).substring(2, 9);
                                const isImage = file.type.startsWith('image/');
                                return {
                                  id,
                                  file,
                                  type: isImage ? 'image' : 'video',
                                  previewURL: URL.createObjectURL(file),
                                  settings: {
                                    type: 'original',
                                    sensitive: false
                                  }
                                };
                              });
                              setPostMedia(prev => [...prev, ...newMediaItems]);
                            }
                            e.target.value = '';
                          }}
                        />
                        
                        {/* მედიის დამატება (სურათი/ვიდეო) */}
                        <div className="relative group">
                          <button
                            type="button"
                            className={`p-2 ${postMedia.length > 0 
                              ? 'text-accent bg-secondary-light shadow-md shadow-accent/20' 
                              : 'text-gray-300 hover:text-white hover:bg-secondary-light'
                            } rounded-full transition-all duration-200 flex items-center justify-center`}
                            title="ფოტო/ვიდეოს დამატება"
                            disabled={isSubmitting}
                            onClick={() => {
                              const fileInput = document.getElementById('media-upload') as HTMLInputElement;
                              if (fileInput) {
                                fileInput.accept = 'image/*,video/*';
                                fileInput.click();
                              }
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:scale-110">
                              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
                              <circle cx="12" cy="13" r="3"></circle>
                            </svg>
                            {postMedia.length > 0 && (
                              <span className="absolute -top-1 -right-1 bg-accent text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                {postMedia.length}
                              </span>
                            )}
                          </button>
                        </div>
                        
                        {/* ემოჯის დამატება */}
                        <div className="inline-block relative group">
                          <PostEmojiPicker 
                            onEmojiSelect={handleAddEmoji}
                            buttonClass="p-2.5 text-gray-300 hover:text-white hover:bg-secondary-light rounded-full transition-all duration-200 !px-2.5 !py-2.5 !flex-row group-hover:shadow-md group-hover:shadow-accent/10" 
                          />
                        </div>
                        
                        {/* გამოკითხვის დამატება */}
                        <div className="relative group">
                          <button
                            type="button"
                            onClick={() => setShowPollModal(true)}
                            className={`p-2.5 ${
                              postType === "poll" 
                                ? "text-accent bg-secondary-light shadow-md shadow-accent/20" 
                                : "text-gray-300 hover:text-white hover:bg-secondary-light"
                            } rounded-full transition-all duration-200 flex items-center justify-center`}
                            title="გამოკითხვის დამატება"
                            disabled={isSubmitting}
                          >
                            <BarChart3 className="w-5 h-5 transition-transform group-hover:scale-110" />
                          </button>
                        </div>
                        
                        {/* ლაივ სტრიმის დამატება */}
                        <div className="relative group">
                          <button
                            type="button"
                            onClick={() => setShowLivestreamModal(true)}
                            className={`p-2.5 ${
                              postType === "livestream" 
                                ? "text-red-400 bg-secondary-light shadow-md shadow-red-500/20" 
                                : "text-gray-300 hover:text-red-400 hover:bg-secondary-light"
                            } rounded-full transition-all duration-200 flex items-center justify-center`}
                            title="ლაივ სტრიმის დამატება"
                            disabled={isSubmitting}
                          >
                            <Radio className="w-5 h-5 transition-transform group-hover:scale-110" />
                            {postType === "livestream" && (
                              <span className="absolute -top-1 -right-1 bg-red-500 animate-pulse w-2 h-2 rounded-full"></span>
                            )}
                          </button>
                        </div>
                      </div>
                      
                      <button
                        type="submit"
                        className={`px-5 py-2.5 bg-accent text-white rounded-lg hover:bg-accent-dark transition-all duration-200 flex items-center shadow-lg shadow-accent/20 hover:shadow-accent/30 hover:scale-105 ${
                          isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                        }`}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                            <span className="font-medium">გთხოვთ მოიცადოთ...</span>
                          </>
                        ) : (
                          <>
                            <PenSquare className="w-5 h-5 mr-2 animate-pulse" />
                            <span className="font-medium">დაპოსტვა</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                  
                  {/* ლაივ სტრიმის მოდალი */}
                  {showLivestreamModal && (
                    <PostLiveStream 
                      onClose={() => setShowLivestreamModal(false)} 
                      onSave={handleSaveLivestream} 
                    />
                  )}
                  
                  {/* გამოკითხვის მოდალი */}
                  {showPollModal && (
                    <PostPoll 
                      onClose={() => setShowPollModal(false)} 
                      onSave={handleSavePoll} 
                    />
                  )}
                </div>
              )}
              
              {posts.length > 0 ? (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <div
                      key={post.id}
                      className="bg-secondary-dark rounded-lg p-4 border border-borderGray-dark hover:border-borderGray transition-colors"
                    >
                      {/* პოსტის ავტორი */}
                      <div className="flex gap-3 mb-3">
                        <ProfileAvatar
                          imageUrl={post.author.img}
                          username={post.author.username}
                          avatarProps={post.author.avatarProps}
                          gender={post.author.gender}
                          size="sm"
                        />
                        <div>
                          <h3 className="text-white font-semibold">
                            {post.author.displayName || post.author.username}
                          </h3>
                          <div className="text-gray-400 text-xs flex items-center">
                            @{post.author.username} · {new Date(post.createdAt).toLocaleDateString()}
                            
                            {/* ქვანტური აზროვნების ჯგუფებში აჩვენებს დომინანტურ კატეგორიას */}
                            {group.type === "quantum" && post.analysis && (
                              <span
                                className="ml-2 px-1.5 py-0.5 rounded text-[10px] flex items-center"
                                style={{ backgroundColor: post.analysis.category?.color || "#333" }}
                              >
                                <Sparkles className="w-2 h-2 mr-0.5" />
                                {post.analysis.category?.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* პოსტის შინაარსი */}
                      <div className="text-white mb-4">
                        {post.content}
                      </div>
                      
                      {/* მედია ფაილები */}
                      {post.media && post.media.length > 0 && (
                        <div className="mb-4">
                          <div className={`grid gap-2 ${
                            post.media.length === 1 ? 'grid-cols-1' :
                            post.media.length === 2 ? 'grid-cols-2' :
                            post.media.length >= 3 ? 'grid-cols-2 sm:grid-cols-3' : ''
                          }`}>
                            {post.media.slice(0, 4).map((media: any, index: number) => (
                              <div 
                                key={media.id}
                                className={`relative rounded-lg overflow-hidden ${
                                  post.media.length === 1 ? 'max-h-96' : 
                                  post.media.length === 2 ? 'h-60' : 
                                  'aspect-square'
                                }`}
                              >
                                {media.type === 'image' ? (
                                  <img 
                                    src={media.url} 
                                    alt={media.caption || ''}
                                    className={`w-full h-full ${
                                      media.displayType === 'original' ? 'object-contain' :
                                      media.displayType === 'wide' ? 'object-cover aspect-video' :
                                      'object-cover aspect-square'
                                    }`}
                                  />
                                ) : (
                                  <video 
                                    src={media.url}
                                    controls
                                    className="w-full h-full object-contain bg-black"
                                  />
                                )}
                                
                                {/* ჩვენება მეტი მედიის შემთხვევაში */}
                                {index === 3 && post.media.length > 4 && (
                                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                                    <span className="text-white text-xl font-bold">+{post.media.length - 4}</span>
                                  </div>
                                )}
                                
                                {/* სენსიტიური კონტენტის დაფარვა */}
                                {media.isSensitive && (
                                  <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4">
                                    <span className="text-red-400 font-semibold mb-2">სენსიტიური შინაარსი</span>
                                    <button className="text-sm bg-secondary px-3 py-1 rounded-full hover:bg-secondary-light">
                                      ნახვა
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* ინტერაქციის ღილაკები */}
                      <div className="flex justify-between text-gray-400 text-sm">
                        <button className="flex items-center hover:text-white">
                          <MessageSquare className="w-4 h-4 mr-1" />
                          {post._count.comments}
                        </button>
                        <div className="flex gap-4">
                          {/* ქვანტური აზროვნების ჯგუფებში საშუალებას აძლევს იხილოს ანალიზი */}
                          {group.type === "quantum" && (
                            <button className="flex items-center hover:text-white">
                              <ChartBar className="w-4 h-4 mr-1" />
                              ანალიზი
                            </button>
                          )}
                          <button className="flex items-center hover:text-white">
                            <Share2 className="w-4 h-4 mr-1" />
                            გაზიარება
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-secondary-dark bg-opacity-50 rounded-lg p-6 text-center">
                  <p className="text-gray-400 mb-4">
                    ამ ჯგუფში ჯერ არ არის პოსტები დამატებული. იყავით პირველი, ვინც აზრს გამოთქვამს!
                  </p>
                </div>
              )}
            </div>
          )}
          
          {activeTab === "members" && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">ჯგუფის წევრები</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {group.members.map((member: any) => (
                  <div 
                    key={member.id}
                    className="bg-secondary-dark rounded-lg p-3 flex items-center gap-3 border border-borderGray-dark hover:border-borderGray transition-colors"
                  >
                    <ProfileAvatar
                      imageUrl={member.user.img}
                      username={member.user.username}
                      avatarProps={member.user.avatarProps}
                      gender={member.user.gender}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold truncate">
                        {member.user.displayName || member.user.username}
                      </h3>
                      <div className="flex items-center text-xs">
                        <span className="text-gray-400 truncate">@{member.user.username}</span>
                        
                        {/* როლების ბეჯები */}
                        {member.role === "admin" && (
                          <span className="ml-2 px-1.5 py-0.5 bg-accent text-white rounded text-[10px]">
                            ადმინი
                          </span>
                        )}
                        {member.role === "moderator" && (
                          <span className="ml-2 px-1.5 py-0.5 bg-secondary-light text-white rounded text-[10px]">
                            მოდერატორი
                          </span>
                        )}
                        
                        {/* დომინანტური კატეგორია ქვანტური აზროვნებისთვის */}
                        {group.type === "quantum" && member.dominantCategory && (
                          <span
                            className="ml-2 px-1.5 py-0.5 rounded text-[10px]"
                            style={{ backgroundColor: "#333" /* კატეგორიის ფერი */ }}
                          >
                            {member.dominantCategory}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* პროფილის ლინკი */}
                    <Link
                      href={`/${member.user.username}`}
                      className="p-1 text-gray-400 hover:text-white"
                      title="პროფილის ნახვა"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {activeTab === "about" && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">ჯგუფის შესახებ</h2>
              <div className="bg-secondary-dark rounded-lg p-6 border border-borderGray-dark mb-6">
                <p className="text-gray-300 mb-4">
                  {group.description || "ჯგუფის აღწერა არ არის მითითებული."}
                </p>
                
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex items-center text-gray-400">
                    <Users className="w-4 h-4 mr-2" />
                    <span>{group._count.members} წევრი</span>
                  </div>
                  <div className="flex items-center text-gray-400">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    <span>{group._count.posts} პოსტი</span>
                  </div>
                  <div className="flex items-center text-gray-400">
                    {group.type === "standard" ? (
                      <Users className="w-4 h-4 mr-2" />
                    ) : group.type === "quantum" ? (
                      <Brain className="w-4 h-4 mr-2 text-accent" />
                    ) : group.type === "project" ? (
                      <Wrench className="w-4 h-4 mr-2" />
                    ) : (
                      <Newspaper className="w-4 h-4 mr-2" />
                    )}
                    <span>
                      {group.type === "standard" ? "სტანდარტული ჯგუფი" :
                      group.type === "quantum" ? "ქვანტური აზროვნების ჯგუფი" :
                      group.type === "project" ? "პროექტების ჯგუფი" : 
                      "საინფორმაციო ჯგუფი"}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-400">
                    {group.isPrivate ? (
                      <>
                        <Lock className="w-4 h-4 mr-2" />
                        <span>პრივატული ჯგუფი</span>
                      </>
                    ) : (
                      <>
                        <Unlock className="w-4 h-4 mr-2" />
                        <span>ღია ჯგუფი</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {/* ქვანტური აზროვნების ჯგუფისთვის აჩვენებს კატეგორიებს */}
              {group.type === "quantum" && group.categories?.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                    <Brain className="w-5 h-5 mr-2 text-accent" />
                    აზრობრივი კატეგორიები
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                    {group.categories.map((category: any) => (
                      <div 
                        key={category.id}
                        className="bg-secondary-dark rounded-lg p-3 border border-borderGray-dark"
                      >
                        <div className="flex items-center mb-2">
                          <div 
                            className="w-4 h-4 rounded-full mr-2"
                            style={{ backgroundColor: category.color || "#333" }}
                          ></div>
                          <h4 className="text-white font-medium">{category.name}</h4>
                        </div>
                        <p className="text-gray-400 text-sm">
                          {category.description || "აღწერა არ არის მითითებული"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* ადმინისტრატორები და მოდერატორები */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">ადმინისტრატორები და მოდერატორები</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {group.members
                    .filter((member: any) => ["admin", "moderator"].includes(member.role))
                    .map((member: any) => (
                      <div 
                        key={member.id}
                        className="bg-secondary-dark rounded-lg p-3 flex items-center gap-3 border border-borderGray-dark"
                      >
                        <ProfileAvatar
                          imageUrl={member.user.img}
                          username={member.user.username}
                          avatarProps={member.user.avatarProps}
                          gender={member.user.gender}
                          size="sm"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-semibold truncate">
                            {member.user.displayName || member.user.username}
                          </h4>
                          <div className="flex items-center text-xs">
                            <span className="text-gray-400 truncate">@{member.user.username}</span>
                            
                            {/* როლების ბეჯები */}
                            {member.role === "admin" && (
                              <span className="ml-2 px-1.5 py-0.5 bg-accent text-white rounded text-[10px]">
                                ადმინი
                              </span>
                            )}
                            {member.role === "moderator" && (
                              <span className="ml-2 px-1.5 py-0.5 bg-secondary-light text-white rounded text-[10px]">
                                მოდერატორი
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <Link
                          href={`/${member.user.username}`}
                          className="p-1 text-gray-400 hover:text-white"
                          title="პროფილის ნახვა"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* მარჯვენა სიდბარი */}
        <div className="w-full md:w-1/3 space-y-6">
          {/* პოპულარული პოსტები */}
          <div className="bg-secondary-dark rounded-lg p-4 border border-borderGray-dark">
            <h3 className="text-white font-semibold mb-3">პოპულარული დისკუსიები</h3>
            {posts.length > 0 ? (
              <div className="space-y-4">
                {posts
                  .sort((a, b) => b._count.comments - a._count.comments)
                  .slice(0, 3)
                  .map((post) => (
                    <div key={`popular-${post.id}`} className="flex gap-2">
                      <div className="flex-shrink-0">
                        <ProfileAvatar
                          imageUrl={post.author.img}
                          username={post.author.username}
                          avatarProps={post.author.avatarProps}
                          gender={post.author.gender}
                          size="xs"
                        />
                      </div>
                      <div>
                        <Link
                          href={`/groups/${groupId}/posts/${post.id}`}
                          className="text-sm text-gray-300 hover:text-white line-clamp-2"
                        >
                          {post.content}
                        </Link>
                        <div className="text-xs text-gray-500 flex items-center mt-1">
                          <MessageSquare className="w-3 h-3 mr-1" />
                          {post._count.comments} კომენტარი
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">ჯერ არ არის პოსტები</p>
            )}
          </div>
          
          {/* აქტიური წევრები */}
          <div className="bg-secondary-dark rounded-lg p-4 border border-borderGray-dark">
            <h3 className="text-white font-semibold mb-3">აქტიური წევრები</h3>
            <div className="space-y-3">
              {group.members
                .slice(0, 5)
                .map((member: any) => (
                  <div key={`active-${member.id}`} className="flex items-center gap-2">
                    <ProfileAvatar
                      imageUrl={member.user.img}
                      username={member.user.username}
                      avatarProps={member.user.avatarProps}
                      gender={member.user.gender}
                      size="xs"
                    />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/${member.user.username}`}
                        className="text-gray-300 hover:text-white text-sm font-medium truncate block"
                      >
                        {member.user.displayName || member.user.username}
                      </Link>
                      <div className="flex items-center text-xs text-gray-500">
                        @{member.user.username}
                        {member.role === "admin" && (
                          <span className="ml-1 px-1 bg-accent/20 text-accent rounded text-[9px]">
                            ადმინი
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              
              <Link
                href={`/groups/${groupId}/members`}
                className="block text-center text-sm text-accent hover:text-accent-light mt-2"
              >
                ყველა წევრის ნახვა
              </Link>
            </div>
          </div>
          
          {/* მსგავსი ჯგუფები */}
          <div className="bg-secondary-dark rounded-lg p-4 border border-borderGray-dark">
            <h3 className="text-white font-semibold mb-3">მსგავსი ჯგუფები</h3>
            <div className="space-y-4">
              <p className="text-gray-400 text-sm">ჯერ არ არის მსგავსი ჯგუფები</p>
              
              <Link
                href="/groups"
                className="block text-center text-sm text-accent hover:text-accent-light"
              >
                ყველა ჯგუფის ნახვა
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}