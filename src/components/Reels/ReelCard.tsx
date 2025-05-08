// src/components/Reels/ReelCard.tsx
import { useState, useRef, useEffect } from "react";
import { Heart, MessageCircle, Bookmark, Share2, Volume2, VolumeX, Pause, Play, User, ChevronDown, ChevronUp, MoreHorizontal, ExternalLink } from "lucide-react";
import ProfileAvatar from "../Avatar/ProfileAvatar";
import Link from "next/link";
import Image from "../PostMaker/Image";
import FormattedText from "../PostMaker/FormattedText";

interface ReelCardProps {
  reel: any;
  isActive: boolean;
  isLoading: boolean;
  onLoad: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

const ReelCard = ({ reel, isActive, isLoading, onLoad, onNext, onPrevious }: ReelCardProps) => {
  const [isLiked, setIsLiked] = useState(!!reel.likes?.length);
  const [isSaved, setIsSaved] = useState(!!reel.saves?.length);
  const [likeCount, setLikeCount] = useState(reel._count.likes);
  const [commentCount, setCommentCount] = useState(reel._count.comments);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);
  
  // როცა რილსი აქტიური ხდება
  useEffect(() => {
    if (isActive) {
      setIsVisible(true);
      
      if (videoRef.current) {
        videoRef.current.muted = isMuted;
        
        if (isPaused) {
          videoRef.current.pause();
        } else {
          // დავიცადოთ ვიდეოს ჩატვირთვა
          if (videoRef.current.readyState >= 3) {
            videoRef.current.play().catch(err => {
              console.error("ვიდეოს გაშვების შეცდომა:", err);
              setIsPaused(true);
            });
          } else {
            // თუ ჯერ არ ჩატვირთულა, oncanplay ივენთზე გავუშვათ
            videoRef.current.oncanplay = () => {
              videoRef.current?.play().catch(err => {
                console.error("ვიდეოს გაშვების შეცდომა:", err);
                setIsPaused(true);
              });
            };
          }
        }
      }
    } else {
      // შევაჩეროთ როცა არააქტიურია
      if (videoRef.current) {
        videoRef.current.pause();
      }
      
      // დროით გავანულოთ
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isActive, isPaused, isMuted]);
  
  // ვიდეოს დასრულება
  const handleVideoEnd = () => {
    // გადავიდეთ შემდეგ რილსზე
    onNext();
  };
  
  // ვიდეოს დაწყება/შეჩერება
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPaused) {
        videoRef.current.play().catch(console.error);
      } else {
        videoRef.current.pause();
      }
      setIsPaused(!isPaused);
    }
  };
  
  // ხმის ჩართვა/გამორთვა
  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };
  
  // ლაიქის ფუნქცია
  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    setIsLiked(!isLiked);
    setLikeCount((prev: number) => isLiked ? prev - 1 : prev + 1);
    
    try {
      const response = await fetch(`/api/reels/${reel.id}/like`, {
        method: "POST"
      });
      
      if (!response.ok) {
        // უკან დავაბრუნოთ ლაიქის სტატუსი შეცდომის შემთხვევაში
        setIsLiked(isLiked);
        setLikeCount((prev: number) => isLiked ? prev + 1 : prev - 1);
      }
    } catch (error) {
      console.error("ლაიქის შეცდომა:", error);
      setIsLiked(isLiked);
      setLikeCount((prev: number) => isLiked ? prev + 1 : prev - 1);
    }
  };
  
  // შენახვის ფუნქცია
  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    setIsSaved(!isSaved);
    
    try {
      const response = await fetch(`/api/reels/${reel.id}/save`, {
        method: "POST"
      });
      
      if (!response.ok) {
        setIsSaved(isSaved);
      }
    } catch (error) {
      console.error("შენახვის შეცდომა:", error);
      setIsSaved(isSaved);
    }
  };
  
  // სქრინზე ორ კლიკზე ლაიქი
  const handleDoubleTap = (e: React.MouseEvent) => {
    if (!isLiked) {
      handleLike(e);
      
      // ლაიქის ანიმაცია
      const heartAnimation = document.createElement('div');
      heartAnimation.className = 'like-animation';
      heartAnimation.style.position = 'absolute';
      heartAnimation.style.top = '50%';
      heartAnimation.style.left = '50%';
      heartAnimation.style.transform = 'translate(-50%, -50%)';
      heartAnimation.style.color = '#ff0033';
      heartAnimation.style.fontSize = '100px';
      heartAnimation.style.opacity = '0';
      heartAnimation.style.animation = 'likeAnimation 1s ease-in-out forwards';
      heartAnimation.innerHTML = '❤️';
      
      const container = e.currentTarget as HTMLElement;
      container.appendChild(heartAnimation);
      
      setTimeout(() => {
        container.removeChild(heartAnimation);
      }, 1000);
    }
  };

  // რესპონსიული UI კლასები
  const sideButtonClass = "p-2 rounded-full bg-black/40 text-white backdrop-blur-sm pointer-events-auto transition-transform hover:scale-110 active:scale-95 sm:p-3";
  const sideButtonTextClass = "text-white text-xs block mt-1 text-center sm:text-sm";

  // ოპციების გარეთ კლიკის დამუშავება
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isOptionsOpen && !e.target) {
        setIsOptionsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOptionsOpen]);

  return (
    <div 
      className="h-full w-full relative overflow-hidden bg-black"
      onClick={togglePlay}
      onDoubleClick={handleDoubleTap}
    >
      {/* ვიდეოს კონტეინერი */}
      <div className="h-full w-full flex items-center justify-center">
        {isVisible && (
          <>
            {/* ვიდეო - სრული ზომით მობილურზე, 90vh დესკტოპზე */}
            <video
              ref={videoRef}
              src={reel.videoUrl}
              className="h-full w-full object-contain lg:max-h-[90vh] lg:max-w-[90%]"
              playsInline
              loop
              muted={isMuted}
              onEnded={handleVideoEnd}
              onCanPlay={onLoad}
            />
            
            {/* ჩატვირთვის ინდიკატორი */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                <div className="w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin"></div>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* კონტროლები */}
      <div className="absolute inset-0 pointer-events-none">
        {/* პაუზის ინდიკატორი */}
        {isPaused && (
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <div className="p-4 bg-black/40 rounded-full backdrop-blur-sm">
              <Play className="w-8 h-8 text-white sm:w-10 sm:h-10" fill="white" />
            </div>
          </div>
        )}
      </div>
      
      {/* ინფორმაცია და ქმედებების ღილაკები */}
      <div 
        ref={infoRef}
        className={`absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-t from-black/80 via-black/50 to-transparent pointer-events-none transition-all duration-300 ${
          isInfoExpanded ? 'pb-8 sm:pb-10' : 'max-h-48 sm:max-h-52'
        }`}
      >
        {/* დეტალები */}
        <div className="flex items-center gap-3 mb-2 sm:mb-4">
          <Link 
            href={`/${reel.user.username}`}
            className="pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white sm:w-12 sm:h-12">
              <ProfileAvatar
                imageUrl={reel.user.img}
                username={reel.user.username}
                avatarProps={reel.user.avatarProps}
                size="sm"
              />
            </div>
          </Link>
          
          <div className="flex-1">
            <Link 
              href={`/${reel.user.username}`}
              className="text-white font-bold hover:underline pointer-events-auto text-sm sm:text-base"
              onClick={(e) => e.stopPropagation()}
            >
              {reel.user.displayName || reel.user.username}
            </Link>
            
            {reel.title && (
              <h3 className="text-white font-medium text-sm sm:text-base">{reel.title}</h3>
            )}
            
            {/* გაყოლის ღილაკი */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                // აქ უნდა დაემატოს გაყოლის ლოგიკა
                alert('Follow function will be implemented');
              }}
              className="mt-1 bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm pointer-events-auto transition-colors sm:text-sm"
            >
              გაყოლა
            </button>
          </div>
          
          {/* ოპციების ღილაკი */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsOptionsOpen(!isOptionsOpen);
              }}
              className="p-2 rounded-full hover:bg-white/10 text-white backdrop-blur-sm pointer-events-auto"
            >
              <MoreHorizontal size={20} />
            </button>
            
            {/* ოპციების მენიუ */}
            {isOptionsOpen && (
              <div className="absolute bottom-full right-0 mb-2 bg-secondary rounded-lg shadow-menu overflow-hidden z-30 w-40 pointer-events-auto">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // აქ დაემატება მომავალში რეპორტის ფუნქცია
                    alert('Report function will be implemented');
                    setIsOptionsOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-white hover:bg-secondary-light transition-colors text-sm"
                >
                  რეპორტი
                </button>
                <Link
                  href={`/reels/${reel.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full text-left px-4 py-2 text-white hover:bg-secondary-light transition-colors text-sm flex items-center gap-2"
                >
                  <ExternalLink size={14} />
                  <span>გახსნა ახალ ფანჯარაში</span>
                </Link>
              </div>
            )}
          </div>
        </div>
        
        {/* აღწერა */}
        {reel.desc && (
          <div className="mb-2 pointer-events-auto">
            <FormattedText 
              text={reel.desc} 
              maxLength={isInfoExpanded ? 2000 : 80}
            />
          </div>
        )}
        
        {/* ჰეშთეგები */}
        {reel.hashtags && reel.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {reel.hashtags.map((h: any) => (
              <Link 
                key={h.hashtagId}
                href={`/hashtag/${h.hashtag.name}`}
                className="text-accent text-xs hover:underline pointer-events-auto sm:text-sm"
                onClick={(e) => e.stopPropagation()}
              >
                #{h.hashtag.name}
              </Link>
            ))}
          </div>
        )}
        
        {/* "მეტის ნახვა" ღილაკი */}
        {(reel.desc?.length > 80 || (reel.hashtags && reel.hashtags.length > 3)) && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsInfoExpanded(!isInfoExpanded);
            }}
            className="flex items-center gap-1 text-gray-300 text-xs hover:text-white pointer-events-auto sm:text-sm"
          >
            {isInfoExpanded ? (
              <>
                <ChevronUp size={16} />
                <span>ნაკლები</span>
              </>
            ) : (
              <>
                <ChevronDown size={16} />
                <span>მეტი</span>
              </>
            )}
          </button>
        )}
      </div>
      
      {/* მარჯვენა მხარის ქმედებების პანელი - რესპონსიული */}
      <div className="absolute right-2 bottom-20 flex flex-col items-center gap-3 sm:right-4 sm:gap-6 sm:bottom-28">
        {/* ლაიქი */}
        <button 
          onClick={handleLike}
          className={sideButtonClass}
        >
          <Heart 
            className={isLiked ? "text-accent" : "text-white"} 
            fill={isLiked ? "#ff0033" : "none"} 
            size={24} 
          />
          <span className={sideButtonTextClass}>{likeCount}</span>
        </button>
        
        {/* კომენტარი */}
        <Link
          href={`/reels/${reel.id}/comments`}
          className={sideButtonClass}
          onClick={(e) => e.stopPropagation()}
        >
          <MessageCircle size={24} />
          <span className={sideButtonTextClass}>{commentCount}</span>
        </Link>
        
        {/* შენახვა */}
        <button 
          onClick={handleSave}
          className={sideButtonClass}
        >
          <Bookmark 
            className={isSaved ? "text-yellow-400" : "text-white"} 
            fill={isSaved ? "#fbbf24" : "none"} 
            size={24} 
          />
        </button>
        
        {/* გაზიარება */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            if (navigator.share) {
              navigator.share({
                title: reel.title || `Reel by ${reel.user.displayName}`,
                text: reel.desc || '',
                url: `${window.location.origin}/reels/${reel.id}`
              }).catch(console.error);
            } else {
              // ფოლბექი მობილურისთვის, როცა navigator.share არ არის ხელმისაწვდომი
              navigator.clipboard.writeText(`${window.location.origin}/reels/${reel.id}`)
                .then(() => alert('ბმული დაკოპირებულია!'))
                .catch(() => alert('ბმულის დაკოპირება ვერ მოხერხდა'));
            }
          }}
          className={sideButtonClass}
        >
          <Share2 size={24} />
        </button>
      </div>
      
      {/* ზედა კონტროლები */}
      <div className="absolute top-2 right-2 flex items-center gap-2 sm:top-4 sm:right-4">
        {/* ხმის კონტროლის ღილაკი */}
        <button 
          onClick={toggleMute}
          className="p-2 rounded-full bg-black/40 text-white backdrop-blur-sm pointer-events-auto hover:bg-black/60 transition-colors"
        >
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
      </div>
      
      {/* სტილები */}
      <style jsx global>{`
        @keyframes likeAnimation {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.5);
          }
          70% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.2);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default ReelCard;