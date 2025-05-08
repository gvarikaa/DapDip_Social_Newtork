"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import ProfileAvatar from "@/components/Avatar/ProfileAvatar";
import PostEmojiPicker from "@/components/PostMaker/PostEmojiPicker";
import PostLiveStream, { LiveStreamOptions } from "@/components/PostMaker/PostLiveStream";
import PostPoll, { PollConfig } from "@/components/PostMaker/PostPoll";
import {
  ArrowLeft,
  Image,
  Video,
  Radio,
  BarChart3,
  Brain,
  Eye,
  EyeOff,
  MessageSquare,
  MessageSquareOff,
  X,
  Upload,
  Loader2,
  Sparkles,
} from "lucide-react";

type PostType = "regular" | "poll" | "livestream";

export default function CreateGroupPostPage() {
  const { groupId } = useParams() as { groupId: string };
  const { user } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [group, setGroup] = useState<any>(null);
  const [membership, setMembership] = useState<any>(null);
  
  // პოსტის ტიპი და დამატებითი მონაცემები
  const [postType, setPostType] = useState<PostType>("regular");
  const [pollData, setPollData] = useState<PollConfig | null>(null);
  const [livestreamData, setLivestreamData] = useState<LiveStreamOptions | null>(null);
  const [showLivestreamModal, setShowLivestreamModal] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);
  
  // პოსტის მონაცემები
  const [content, setContent] = useState("");
  const [media, setMedia] = useState<any[]>([]);
  const [isSensitive, setIsSensitive] = useState(false);
  const [allowComments, setAllowComments] = useState(true);
  
  // შეცდომები
  const [error, setError] = useState("");
  const [formError, setFormError] = useState<Record<string, string>>({});

  // ემოჯის დამატება
  const handleAddEmoji = (emoji: string) => {
    setContent(prev => prev + emoji);
  };

  // ჯგუფის ინფორმაციის ჩატვირთვა
  const loadGroupDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/groups/${groupId}`);
      const data = await response.json();

      if (response.ok) {
        setGroup(data.group);
        setMembership(data.membership);
      } else {
        console.error("Error loading group:", data.error);
        setError(data.error || "ჯგუფის ჩატვირთვის შეცდომა");
      }
    } catch (err) {
      console.error("Failed to load group:", err);
      setError("სერვერთან კავშირის შეცდომა");
    } finally {
      setLoading(false);
    }
  };

  // საწყისი ჩატვირთვა
  useEffect(() => {
    loadGroupDetails();
  }, [groupId]);

  // პოსტის ტიპის ცვლილება
  const handlePostTypeChange = (type: PostType) => {
    if (postType === type) return;
    
    setPostType(type);
    
    // გასუფთავება შეცდომების
    setError("");
    setFormError({});
  };

  // პოსტის ვალიდაცია
  const validatePost = () => {
    const errors: Record<string, string> = {};
    
    if (postType === "regular" && !content.trim() && media.length === 0) {
      errors.content = "პოსტს უნდა ჰქონდეს ტექსტი ან მედია";
    }
    
    if (postType === "poll" && !pollData) {
      errors.poll = "გამოკითხვის პარამეტრები არ არის განსაზღვრული";
    }
    
    if (postType === "livestream" && !livestreamData) {
      errors.livestream = "ლაივ სტრიმის პარამეტრები არ არის განსაზღვრული";
    }
    
    setFormError(errors);
    return Object.keys(errors).length === 0;
  };

  // მედიის ატვირთვის სიმულაცია (რეალურ აპში აქ ფაილის ატვირთვის ფუნქციონალი იქნება)
  const simulateMediaUpload = (type: "image" | "video") => {
    const newMedia = {
      id: Date.now(),
      type,
      url: type === "image" 
        ? "https://placehold.co/600x400/333/666" 
        : "https://example.com/video.mp4",
      thumbnailUrl: "https://placehold.co/600x400/333/666",
      width: 600,
      height: 400
    };
    
    setMedia([...media, newMedia]);
  };

  // მედიის წაშლა
  const removeMedia = (id: number) => {
    setMedia(media.filter(item => item.id !== id));
  };

  // ლაივსტრიმის შენახვა
  const handleSaveLivestream = (data: LiveStreamOptions) => {
    setLivestreamData(data);
    setShowLivestreamModal(false);
    handlePostTypeChange("livestream");
  };

  // პოლის შენახვა
  const handleSavePoll = (data: PollConfig) => {
    setPollData(data);
    setShowPollModal(false);
    handlePostTypeChange("poll");
  };

  // პოსტის გამოქვეყნება
  const publishPost = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePost()) {
      return;
    }
    
    setSubmitting(true);
    setError("");
    
    try {
      let endpoint = `/api/groups/${groupId}/posts`;
      let postData: any = {
        content,
        isSensitive,
        allowComments,
        postType
      };
      
      // დამატებითი მონაცემები პოსტის ტიპის მიხედვით
      if (postType === "poll" && pollData) {
        // პოლის API-ს ენდპოინტი
        endpoint = `/api/groups/${groupId}/polls`;
        postData = {
          question: pollData.question,
          options: pollData.options.map(opt => opt.text),
          isMultiple: pollData.allowMultipleAnswers,
          isAnonymous: pollData.isAnonymous,
          endDate: pollData.endDate,
          content // დამატებითი აღწერა თუ არის
        };
      } else if (postType === "livestream" && livestreamData) {
        // ლაივსტრიმ API-ს ენდპოინტი
        endpoint = `/api/groups/${groupId}/livestreams`;
        postData = {
          title: livestreamData.title,
          description: livestreamData.description || content,
          scheduledStartTime: livestreamData.scheduled ? livestreamData.scheduledDate : new Date().toISOString(),
          visibility: "public", // შეგიძლია ჩაამატო ხილვადობის არჩევა გვერდზე
          settings: {
            allowComments
          }
        };
      } else {
        // სტანდარტული პოსტისთვის
        postData = {
          content,
          isSensitive,
          allowComments
        };
        // ეს გვერდი უკვე იყენებს სწორ ენდპოინტს: /api/groups/${groupId}/posts
        console.log("იქმნება სტანდარტული პოსტი ჯგუფში:", groupId);
      }
      
      // თუ მედიაა დამატებული
      if (media.length > 0 && postType === "regular") {
        // მედიის დამატების ლოგიკა აქ შეიძლება დაემატოს
        // ეს მხოლოდ სიმულაციისთვისაა - რეალურ აპში მედიის ატვირთვის ლოგიკა იქნება საჭირო
        postData.media = media;
      }
      
      console.log("გაგზავნის მონაცემები:", { endpoint, postData });
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(postData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // წარმატების შეტყობინება
        console.log("პოსტი წარმატებით შეიქმნა:", data);
        
        // გადავამისამართოთ ჯგუფის გვერდზე
        router.push(`/groups/${groupId}`);
      } else {
        console.error("API პასუხი:", data);
        setError(data.error || "პოსტის დამატების შეცდომა");
      }
    } catch (err) {
      console.error("Failed to create post:", err);
      setError("სერვერთან კავშირის შეცდომა");
    } finally {
      setSubmitting(false);
    }
  };

  // თუ მიმდინარეობს ჩატვირთვა
  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-accent animate-spin mx-auto mb-4" />
          <p className="text-gray-400">ჯგუფის ინფორმაცია იტვირთება...</p>
        </div>
      </div>
    );
  }

  // თუ ჯგუფი ვერ მოიძებნა
  if (!group) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="bg-secondary-dark p-8 rounded-lg max-w-md text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-white mb-4">ჯგუფი ვერ მოიძებნა</h1>
          <p className="text-gray-400 mb-6">{error || "მითითებული ჯგუფი არ არსებობს ან არ გაქვთ მასზე წვდომა."}</p>
          <Link
            href="/groups"
            className="bg-accent text-white px-6 py-2 rounded-lg hover:bg-accent-dark transition-colors inline-flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            ჯგუფების სიაში დაბრუნება
          </Link>
        </div>
      </div>
    );
  }

  // თუ არ არის წევრი
  if (!membership) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="bg-secondary-dark p-8 rounded-lg max-w-md text-center">
          <div className="text-yellow-500 text-4xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-white mb-4">წვდომა შეზღუდულია</h1>
          <p className="text-gray-400 mb-6">პოსტის დასამატებლად საჭიროა იყოთ ჯგუფის წევრი.</p>
          <div className="flex flex-col gap-2">
            <Link
              href={`/groups/${groupId}`}
              className="bg-accent text-white px-6 py-2 rounded-lg hover:bg-accent-dark transition-colors inline-flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              ჯგუფის გვერდზე დაბრუნება
            </Link>
            <Link
              href="/groups"
              className="text-gray-300 px-6 py-2 hover:text-white transition-colors"
            >
              ჯგუფების სიაში დაბრუნება
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-3xl mx-auto">
        {/* ჰედერი */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-2">
            <Link
              href={`/groups/${groupId}`}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-white">ახალი პოსტის დამატება</h1>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <span>ჯგუფი:</span>
            <span className="text-gray-300 font-medium flex items-center gap-1">
              {group.icon && (
                <span className="text-xl" role="img" aria-label="group icon">
                  {group.icon}
                </span>
              )}
              {group.name}
            </span>
            {group.type === "quantum" && (
              <Brain className="w-4 h-4 text-accent ml-1" title="ქვანტური აზროვნების ჯგუფი" />
            )}
          </div>
        </div>
        
        {/* პოსტის ტიპის არჩევა */}
        <div className="bg-secondary-dark rounded-lg border border-borderGray-dark p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handlePostTypeChange("regular")}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                postType === "regular" 
                  ? "bg-secondary-light text-white" 
                  : "bg-secondary text-gray-400 hover:bg-secondary-light hover:text-white"
              } transition-colors`}
            >
              <Sparkles className="w-4 h-4" />
              სტანდარტული
            </button>
            <button
              type="button"
              onClick={() => {
                if (!pollData) setShowPollModal(true);
                else handlePostTypeChange("poll");
              }}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                postType === "poll" 
                  ? "bg-secondary-light text-white" 
                  : "bg-secondary text-gray-400 hover:bg-secondary-light hover:text-white"
              } transition-colors`}
            >
              <BarChart3 className="w-4 h-4" />
              გამოკითხვა
            </button>
            <button
              type="button"
              onClick={() => {
                if (!livestreamData) setShowLivestreamModal(true);
                else handlePostTypeChange("livestream");
              }}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                postType === "livestream" 
                  ? "bg-secondary-light text-white" 
                  : "bg-secondary text-gray-400 hover:bg-secondary-light hover:text-white"
              } transition-colors`}
            >
              <Radio className="w-4 h-4" />
              ლაივ სტრიმი
            </button>
          </div>
        </div>
        
        {/* შეცდომის შეტყობინება */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-900/30 border border-red-800 text-red-300">
            {error}
          </div>
        )}
        
        {/* პოსტის ფორმა */}
        <form onSubmit={publishPost}>
          <div className="bg-secondary-dark rounded-lg border border-borderGray-dark p-6 mb-6">
            {/* მომხმარებლის ინფორმაცია */}
            <div className="flex gap-3 mb-4">
              <ProfileAvatar
                imageUrl={user?.img}
                username={user?.username || "user"}
                gender={user?.gender}
                avatarProps={user?.avatarProps}
                size="sm"
              />
              <div>
                <h3 className="text-white font-semibold">
                  {user?.displayName || user?.username || "მომხმარებელი"}
                </h3>
                <div className="text-gray-400 text-xs">
                  პოსტავს ჯგუფში: {group.name}
                </div>
              </div>
            </div>
            
            {/* პოსტის ტიპის სპეციფიური ინფორმაცია */}
            {postType === "poll" && pollData && (
              <div className="mb-4 p-4 bg-secondary rounded-lg border border-borderGray-dark">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-medium text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-accent" />
                    გამოკითხვა
                  </h3>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowPollModal(true)}
                      className="text-xs text-accent hover:underline"
                    >
                      რედაქტირება
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPollData(null);
                        setPostType("regular");
                      }}
                      className="text-xs text-red-400 hover:underline"
                    >
                      წაშლა
                    </button>
                  </div>
                </div>
                <div className="bg-secondary-dark p-3 rounded-lg mb-2">
                  <p className="text-white font-medium">{pollData.question}</p>
                </div>
                <div className="space-y-1.5">
                  {pollData.options.map(option => (
                    <div key={option.id} className="bg-secondary-dark p-2 rounded-lg text-gray-300 text-sm">
                      {option.text}
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <span>ვარიანტები:</span>
                    <span className="text-white">{pollData.options.length}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>მულტი-არჩევანი:</span>
                    <span className="text-white">{pollData.allowMultipleAnswers ? "კი" : "არა"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>ანონიმური:</span>
                    <span className="text-white">{pollData.isAnonymous ? "კი" : "არა"}</span>
                  </div>
                  {pollData.endDate && (
                    <div className="flex items-center gap-1">
                      <span>დასრულება:</span>
                      <span className="text-white">{new Date(pollData.endDate).toLocaleString('ka-GE')}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {postType === "livestream" && livestreamData && (
              <div className="mb-4 p-4 bg-secondary rounded-lg border border-borderGray-dark">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-medium text-white flex items-center gap-2">
                    <Radio className="w-5 h-5 text-red-500" />
                    ლაივ სტრიმი
                  </h3>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowLivestreamModal(true)}
                      className="text-xs text-accent hover:underline"
                    >
                      რედაქტირება
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLivestreamData(null);
                        setPostType("regular");
                      }}
                      className="text-xs text-red-400 hover:underline"
                    >
                      წაშლა
                    </button>
                  </div>
                </div>
                <div className="bg-secondary-dark p-3 rounded-lg mb-2">
                  <p className="text-white font-medium">{livestreamData.title}</p>
                  {livestreamData.description && (
                    <p className="text-gray-400 text-sm mt-1">{livestreamData.description}</p>
                  )}
                </div>
                <div className="mt-3 flex items-center gap-3 text-xs">
                  <span className={`px-2 py-1 rounded-full ${
                    livestreamData.scheduled 
                      ? "bg-secondary-light text-white" 
                      : "bg-red-500 text-white"
                  }`}>
                    {livestreamData.scheduled ? "დაგეგმილი" : "პირდაპირი"}
                  </span>
                  {livestreamData.scheduled && livestreamData.scheduledDate && (
                    <span className="text-gray-300">
                      {new Date(livestreamData.scheduledDate).toLocaleString('ka-GE')}
                    </span>
                  )}
                </div>
              </div>
            )}
            
            {/* ტექსტის შეყვანის ველი */}
            <div className="mb-4">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={
                  postType === "regular" 
                    ? "რას ფიქრობთ?" 
                    : postType === "poll" 
                      ? "დაამატეთ ტექსტი გამოკითხვასთან ერთად (არაა აუცილებელი)" 
                      : "დაამატეთ ტექსტი ლაივ სტრიმთან ერთად (არაა აუცილებელი)"
                }
                className={`w-full bg-secondary border ${
                  formError.content ? "border-red-500" : "border-borderGray-dark"
                } rounded-lg p-3 text-white focus:outline-none focus:ring-1 focus:ring-accent min-h-32 resize-none`}
              />
              {formError.content && (
                <p className="text-red-500 text-sm mt-1">{formError.content}</p>
              )}
              {group.type === "quantum" && (
                <div className="flex items-center mt-2 text-xs text-accent">
                  <Brain className="w-3 h-3 mr-1" />
                  ეს პოსტი ავტომატურად გაანალიზდება ქვანტური აზროვნების AI-ის მიერ
                </div>
              )}
            </div>
            
            {/* ატვირთული მედია */}
            {media.length > 0 && (
              <div className="mb-4 grid grid-cols-2 gap-2">
                {media.map((item) => (
                  <div key={item.id} className="relative rounded-lg overflow-hidden">
                    <img 
                      src={item.thumbnailUrl} 
                      alt="მედია" 
                      className="w-full h-32 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeMedia(item.id)}
                      className="absolute top-2 right-2 bg-background/80 p-1 rounded-full"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-background/80 py-1 px-2 text-xs text-white">
                      {item.type === "image" ? "სურათი" : "ვიდეო"}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* ღილაკების პანელი */}
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => simulateMediaUpload("image")}
                className="flex flex-col items-center gap-1 px-3 py-2 bg-secondary hover:bg-secondary-light rounded-lg text-gray-300 hover:text-white transition-colors text-sm"
              >
                <Image className="w-5 h-5 mb-1" />
                სურათი
              </button>
              <button
                type="button"
                onClick={() => simulateMediaUpload("video")}
                className="flex flex-col items-center gap-1 px-3 py-2 bg-secondary hover:bg-secondary-light rounded-lg text-gray-300 hover:text-white transition-colors text-sm"
              >
                <Video className="w-5 h-5 mb-1" />
                ვიდეო
              </button>
              <PostEmojiPicker onEmojiSelect={handleAddEmoji} />
              <button
                type="button"
                onClick={() => setShowPollModal(true)}
                className={`flex flex-col items-center gap-1 px-3 py-2 bg-secondary hover:bg-secondary-light rounded-lg text-gray-300 hover:text-white transition-colors text-sm ${
                  postType === "poll" ? "text-accent bg-secondary-light" : ""
                }`}
              >
                <BarChart3 className="w-5 h-5 mb-1" />
                გამოკითხვა
              </button>
              <button
                type="button"
                onClick={() => setShowLivestreamModal(true)}
                className={`flex flex-col items-center gap-1 px-3 py-2 bg-secondary hover:bg-secondary-light rounded-lg text-gray-300 hover:text-white transition-colors text-sm ${
                  postType === "livestream" ? "text-red-500 bg-secondary-light" : ""
                }`}
              >
                <Radio className="w-5 h-5 mb-1" />
                ლაივ სტრიმი
              </button>
            </div>
          </div>
          
          {/* პარამეტრები */}
          <div className="bg-secondary-dark rounded-lg border border-borderGray-dark p-6 mb-6">
            <h3 className="text-white font-semibold mb-4">პოსტის პარამეტრები</h3>
            
            <div className="space-y-4">
              {/* მგრძნობიარე შინაარსი */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-gray-300 font-medium">მგრძნობიარე შინაარსი</div>
                  <div className="text-gray-500 text-sm">მოათავსებს პოსტს "შინაარსის გაფრთხილების" ქვეშ</div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSensitive(!isSensitive)}
                  className={`p-2 rounded-lg ${
                    isSensitive 
                      ? "bg-secondary-light text-white"
                      : "bg-secondary text-gray-400"
                  }`}
                >
                  {isSensitive ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>
              </div>
              
              {/* კომენტარები */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-gray-300 font-medium">კომენტარები</div>
                  <div className="text-gray-500 text-sm">ჩართეთ ან გამორთეთ კომენტარები ამ პოსტზე</div>
                </div>
                <button
                  type="button"
                  onClick={() => setAllowComments(!allowComments)}
                  className={`p-2 rounded-lg ${
                    allowComments 
                      ? "bg-secondary-light text-white"
                      : "bg-secondary text-gray-400"
                  }`}
                >
                  {allowComments ? <MessageSquare className="w-5 h-5" /> : <MessageSquareOff className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
          
          {/* ღილაკები */}
          <div className="flex justify-between">
            <Link
              href={`/groups/${groupId}`}
              className="px-6 py-2 bg-secondary text-gray-300 rounded-lg hover:bg-secondary-light hover:text-white transition-colors"
            >
              გაუქმება
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className={`px-6 py-2 bg-accent text-white rounded-lg hover:bg-accent-dark transition-colors flex items-center ${
                submitting ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  იტვირთება...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  გამოქვეყნება
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      
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
  );
}