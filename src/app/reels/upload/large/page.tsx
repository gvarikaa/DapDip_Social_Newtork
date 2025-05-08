"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LargeReelUpload() {
  const router = useRouter();
  
  // ავტომატურად გადავამისამართოთ
  useEffect(() => {
    router.push("/reels/upload");
  }, [router]);
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>გადამისამართდება რილსის ატვირთვის გვერდზე...</p>
    </div>
  );
}