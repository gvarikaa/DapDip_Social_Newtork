// src/app/(board)/reels/layout.tsx
import ReelsNavigationBars from "@/components/Reels/ReelsNavigationBars";

export default function ReelsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
<div className="min-h-screen w-full bg-background overflow-y-auto flex flex-col">
{/* ნავიგაციის პანელები */}
      <ReelsNavigationBars />
      
      {/* რილსების გვერდის კონტენტი */}
      {children}
    </div>
  );
}