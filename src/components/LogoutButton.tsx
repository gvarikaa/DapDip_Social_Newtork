"use client";

import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";

interface LogoutButtonProps {
  className?: string;
  redirectTo?: string;
  children?: React.ReactNode;
}

export default function LogoutButton({
  className = "bg-black text-white rounded-md px-4 py-2",
  redirectTo = "/auth/signin",
  children = "Sign Out",
}: LogoutButtonProps) {
  const { signOut } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.push(redirectTo);
  };

  return (
    <button className={className} onClick={handleLogout}>
      {children}
    </button>
  );
}