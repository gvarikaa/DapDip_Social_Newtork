"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ReelsUploadRedirect() {
  const router = useRouter();
  
  // ავტომატურად გადავამისამართოთ ახალ მისამართზე
  useEffect(() => {
    router.push("/reels");
  }, [router]);
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>გადამისამართდება რილსების გვერდზე...</p>
    </div>
  );
}