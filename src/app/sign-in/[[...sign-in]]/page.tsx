"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function RedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  
  useEffect(() => {
    // If there was a redirect parameter, forward it to the new auth page
    const redirectUrl = redirectParam 
      ? `/auth/signin?redirect=${encodeURIComponent(redirectParam)}`
      : "/auth/signin";
      
    router.push(redirectUrl);
  }, [router, redirectParam]);
  
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p>Redirecting to /auth/signin...</p>
    </div>
  );
}