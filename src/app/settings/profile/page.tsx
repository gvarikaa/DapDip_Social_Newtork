"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "@/components/CustomImage";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";

const ProfileEditPage = () => {
  const { user } = useUser();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  // ფორმის მონაცემები
  const [formData, setFormData] = useState({
    displayName: user?.fullName || user?.username || "",
    bio: "",
    location: "",
    website: "",
    job: "",
    gender: "unspecified" // საწყისი მნიშვნელობა
  });
  
  // ფაილის ინფუთების რეფერენსები
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  
  // მოკლე დაყოვნებით მომხმარებლის მონაცემების მიღება
  useState(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(`/api/users/${user?.id}`);
        if (response.ok) {
          const userData = await response.json();
          
          // განვაახლოთ ფორმის მონაცემები
          setFormData({
            displayName: userData.displayName || user?.fullName || user?.username || "",
            bio: userData.bio || "",
            location: userData.location || "",
            website: userData.website || "",
            job: userData.job || "",
            gender: userData.gender || "unspecified"
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    
    if (user?.id) {
      fetchUserData();
    }
  }, [user?.id]);
  
  // ფორმის ველების ცვლილების ჰენდლერი
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // ავატარის სურათის ატვირთვის ჰენდლერი
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // ფაილის ვალიდაცია
      if (!file.type.includes('image/')) {
        setError("გთხოვთ აირჩიოთ სურათის ფაილი");
        return;
      }
      
      // ზომის ვალიდაცია (მაქს. 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("სურათის ზომა არ უნდა აღემატებოდეს 5MB-ს");
        return;
      }
      
      // პრევიუს შექმნა
      const reader = new FileReader();
      reader.onload = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // ქავერის სურათის ატვირთვის ჰენდლერი
  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // ფაილის ვალიდაცია
      if (!file.type.includes('image/')) {
        setError("გთხოვთ აირჩიოთ სურათის ფაილი");
        return;
      }
      
      // ზომის ვალიდაცია (მაქს. 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("სურათის ზომა არ უნდა აღემატებოდეს 5MB-ს");
        return;
      }
      
      // პრევიუს შექმნა
      const reader = new FileReader();
      reader.onload = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // ფორმის გაგზავნის ჰენდლერი
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      // ფორმის მონაცემების შექმნა
      const submitFormData = new FormData();
      
      // ტექსტური მონაცემების დამატება
      Object.entries(formData).forEach(([key, value]) => {
        submitFormData.append(key, value);
      });
      
      // ავატარის ფაილის დამატება
      if (avatarInputRef.current?.files?.[0]) {
        submitFormData.append('avatar', avatarInputRef.current.files[0]);
      }
      
      // ქავერის ფაილის დამატება
      if (coverInputRef.current?.files?.[0]) {
        submitFormData.append('cover', coverInputRef.current.files[0]);
      }
      
      // API-ზე გაგზავნა
      const response = await fetch("/api/profile/update", {
        method: "POST",
        body: submitFormData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "პროფილის განახლება ვერ მოხერხდა");
      }
      
      // წარმატებული განახლება
      setSuccess(true);
      
      // გადამისამართება მოკლე დაყოვნების შემდეგ
      setTimeout(() => {
        router.push(`/${user?.username}`);
      }, 1500);
      
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(err instanceof Error ? err.message : "პროფილის განახლება ვერ მოხერხდა");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 rounded-full hover:bg-gray-800">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold">პროფილის რედაქტირება</h1>
        </div>
        
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-white text-black font-bold py-2 px-4 rounded-full disabled:opacity-50"
        >
          {loading ? "მიმდინარეობს..." : "შენახვა"}
        </button>
      </div>
      
      {error && (
        <div className="bg-red-500 bg-opacity-20 text-red-300 p-3 rounded-md mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-500 bg-opacity-20 text-green-300 p-3 rounded-md mb-4">
          პროფილი წარმატებით განახლდა!
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        {/* ქავერის სურათი */}
        <div className="mb-6">
          <div className="relative w-full aspect-[3/1] rounded-xl overflow-hidden mb-2 bg-gray-800">
            {coverPreview ? (
              <img src={coverPreview} alt="Cover Preview" className="w-full h-full object-cover" />
            ) : (
              <Image
                path={user?.unsafeMetadata?.cover as string || null}
                isCover={true}
                alt="Cover"
                w={600}
                h={200}
                tr={true}
              />
            )}
            
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                className="bg-black bg-opacity-70 text-white py-2 px-4 rounded-full flex items-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                  <circle cx="12" cy="13" r="3" />
                </svg>
                ფონის შეცვლა
              </button>
            </div>
          </div>
          <input
            type="file"
            ref={coverInputRef}
            onChange={handleCoverUpload}
            accept="image/*"
            className="hidden"
          />
        </div>
        
        {/* ავატარის სურათი */}
        <div className="mb-6 flex justify-center -mt-12">
          <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-black">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
            ) : (
              <Image
                path={user?.imageUrl || null}
                isAvatar={true}
                gender={formData.gender}
                alt="Avatar"
                w={96}
                h={96}
                tr={true}
              />
            )}
            
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="bg-black bg-opacity-70 text-white p-2 rounded-full"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                  <circle cx="12" cy="13" r="3" />
                </svg>
              </button>
            </div>
          </div>
          <input
            type="file"
            ref={avatarInputRef}
            onChange={handleAvatarUpload}
            accept="image/*"
            className="hidden"
          />
        </div>
        
        {/* ფორმის ველები */}
        <div className="space-y-4">
          {/* სახელი */}
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-300 mb-1">
              სახელი
            </label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-inputGray rounded-md border border-borderGray focus:outline-none focus:border-iconBlue"
              maxLength={50}
            />
          </div>
          
          {/* ბიოგრაფია */}
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-300 mb-1">
              ბიოგრაფია
            </label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-inputGray rounded-md border border-borderGray focus:outline-none focus:border-iconBlue"
              rows={3}
              maxLength={160}
            />
          </div>
          
          {/* მდებარეობა */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-300 mb-1">
              მდებარეობა
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-inputGray rounded-md border border-borderGray focus:outline-none focus:border-iconBlue"
              maxLength={30}
            />
          </div>
          
          {/* ვებსაიტი */}
          <div>
            <label htmlFor="website" className="block text-sm font-medium text-gray-300 mb-1">
              ვებსაიტი
            </label>
            <input
              type="text"
              id="website"
              name="website"
              value={formData.website}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-inputGray rounded-md border border-borderGray focus:outline-none focus:border-iconBlue"
              maxLength={100}
              placeholder="example.com"
            />
          </div>
          
          {/* საქმიანობა */}
          <div>
            <label htmlFor="job" className="block text-sm font-medium text-gray-300 mb-1">
              საქმიანობა
            </label>
            <input
              type="text"
              id="job"
              name="job"
              value={formData.job}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-inputGray rounded-md border border-borderGray focus:outline-none focus:border-iconBlue"
              maxLength={50}
            />
          </div>
          
          {/* სქესი (საწყისი სურათისთვის) */}
          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-gray-300 mb-1">
              სქესი (საწყისი ავატარისთვის)
            </label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-inputGray rounded-md border border-borderGray focus:outline-none focus:border-iconBlue"
            >
              <option value="unspecified">არ მსურს მითითება</option>
              <option value="male">მამრობითი</option>
              <option value="female">მდედრობითი</option>
            </select>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProfileEditPage;