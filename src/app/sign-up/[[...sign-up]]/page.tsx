
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RedirectPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.push("/auth/signup");
  }, [router]);
  
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p>Redirecting to /auth/signup...</p>
    </div>
  );
}
