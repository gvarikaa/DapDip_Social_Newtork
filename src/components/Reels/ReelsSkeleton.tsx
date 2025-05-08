// src/components/Reels/ReelsSkeleton.tsx
const ReelsSkeleton = ({ count = 1 }: { count?: number }) => {
  return (
    <div className="h-full w-full bg-black overflow-hidden">
      {Array.from({ length: count }).map((_, index) => (
        <div 
          key={index}
          className="h-full w-full flex items-center justify-center bg-background-dark relative"
        >
          {/* მთავარი ჩატვირთვის ინდიკატორი */}
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-gray-700 border-t-accent animate-spin"></div>
            <div className="absolute -bottom-8 text-gray-400 text-sm whitespace-nowrap">იტვირთება...</div>
          </div>
          
          {/* User-ის სქელეტონი */}
          <div className="absolute bottom-4 left-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-800 animate-pulse"></div>
            <div>
              <div className="h-4 w-24 bg-gray-800 rounded-full animate-pulse"></div>
              <div className="h-3 w-16 bg-gray-800 rounded-full animate-pulse mt-2"></div>
            </div>
          </div>
          
          {/* ინტერაქციის ღილაკების სქელეტონი */}
          <div className="absolute right-4 bottom-20 flex flex-col items-center gap-6">
            <div className="w-10 h-10 rounded-full bg-gray-800 animate-pulse"></div>
            <div className="w-10 h-10 rounded-full bg-gray-800 animate-pulse"></div>
            <div className="w-10 h-10 rounded-full bg-gray-800 animate-pulse"></div>
          </div>
          
          {/* გადამრთველის სქელეტონი */}
          <div className="absolute top-4 right-4">
            <div className="h-8 w-32 bg-gray-800 rounded-full animate-pulse"></div>
          </div>
          
          {/* შიმერის ეფექტი მთელს ეკრანზე */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 -inset-x-full h-full w-1/2 bg-gradient-to-r from-transparent via-white/5 to-transparent transform-gpu animate-shimmer"></div>
          </div>
        </div>
      ))}
      
      {/* ანიმაციის ეფექტი გლობალურად */}
      <style jsx global>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default ReelsSkeleton;