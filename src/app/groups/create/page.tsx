"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/utils/supabase/client";
import {
  Users,
  Brain,
  Wrench,
  Newspaper,
  X,
  Plus,
  Lock,
  Unlock,
  Image,
  Info,
  Trash,
  ArrowLeft,
  Upload,
  Settings,
  Sparkles,
} from "lucide-react";

// ჯგუფის ტიპები
const groupTypes = [
  {
    id: "standard",
    name: "სტანდარტული",
    icon: <Users className="w-6 h-6" />,
    description: "ტრადიციული ტიპის ჯგუფი ზოგადი განხილვებისთვის და სოციალური ინტერაქციისთვის",
  },
  {
    id: "quantum",
    name: "ქვანტური აზროვნების",
    icon: <Brain className="w-6 h-6 text-accent" />,
    description: "სპეციალიზებული ჯგუფი განსხვავებული აზრების ვიზუალიზაციისა და დებატებისთვის",
  },
  {
    id: "project",
    name: "პროექტების",
    icon: <Wrench className="w-6 h-6" />,
    description: "თანამშრომლობითი ჯგუფი პროექტების დაგეგმვისა და განხორციელებისთვის",
  },
  {
    id: "info",
    name: "საინფორმაციო",
    icon: <Newspaper className="w-6 h-6" />,
    description: "ჯგუფი სანდო ინფორმაციის გაზიარებისა და ფაქტების შემოწმებისთვის",
  },
];

// ფერების სია
const colorOptions = [
  "#FF5555", // წითელი
  "#FFA500", // ნარინჯისფერი
  "#FFCC00", // ყვითელი
  "#33CC33", // მწვანე
  "#3399FF", // ლურჯი
  "#6666FF", // იისფერი
  "#CC66CC", // მეწამული
  "#FF66CC", // ვარდისფერი
  "#00CCCC", // ტურკიზი
  "#996633", // ყავისფერი
];

export default function CreateGroupPage() {
  const { user } = useAuth();
  const router = useRouter();

  // ბაზისური ინფორმაცია
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [groupType, setGroupType] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [moderationMode, setModerationMode] = useState("auto");
  const [coverImage, setCoverImage] = useState("");
  const [icon, setIcon] = useState("");

  // კატეგორიები (ქვანტური აზროვნების ჯგუფისთვის) - უნიკალური ID-ებით
  const [categories, setCategories] = useState([
    { id: Date.now(), name: "", color: "#FF5555", description: "" },
    { id: Date.now() + 1000, name: "", color: "#3399FF", description: "" }, // საკმარისი განსხვავება ID-ებს შორის
  ]);

  // დამუშავების და შეცდომების სტატუსები
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ავტორიზაციის შემოწმება useEffect-ში
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // ვცადოთ პირდაპირ Supabase-დან სესიის შემოწმება
        const supabase = createClient();
        const { data } = await supabase.auth.getSession();
        
        if (!data.session || !user) {
          console.error("ავტორიზაცია საჭიროა, მიმდინარეობს გადამისამართება...");
          router.push("/sign-in?redirect=" + encodeURIComponent(window.location.pathname));
        }
      } catch (error) {
        console.error("სესიის შემოწმების შეცდომა:", error);
        router.push("/sign-in");
      }
    };

    checkAuth();
  }, [user, router]);

  // ვალიდაცია
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "ჯგუფის სახელი აუცილებელია";
    }

    if (!groupType) {
      newErrors.type = "გთხოვთ აირჩიოთ ჯგუფის ტიპი";
    }

    // ქვანტური აზროვნების ჯგუფისთვის საჭიროა კატეგორიები
    if (groupType === "quantum") {
      // მინიმუმ 2 კატეგორია
      if (categories.length < 2) {
        newErrors.categories = "მინიმუმ 2 კატეგორია აუცილებელია";
      } else {
        // ყველა კატეგორიას უნდა ჰქონდეს სახელი
        const invalidCategories = categories.filter(cat => !cat.name.trim());
        if (invalidCategories.length > 0) {
          newErrors.categories = "ყველა კატეგორიას უნდა ჰქონდეს სახელი";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // კატეგორიის დამატება
  const addCategory = () => {
    if (categories.length >= 10) {
      setErrors(prev => ({ ...prev, categories: "მაქსიმუმ 10 კატეგორიაა დაშვებული" }));
      return;
    }
    
    // შემთხვევითი ფერი
    const randomColor = colorOptions[Math.floor(Math.random() * colorOptions.length)];
    
    // უნიკალური ID-ის შექმნა
    // UUID-ს ვერ გამოვიყენებთ კლიენტის მხარეს, ამიტომ timestamp-სა და შემთხვევით რიცხვის კომბინაციას ვიყენებთ
    const uniqueId = Date.now() + Math.floor(Math.random() * 1000);
    
    setCategories([
      ...categories,
      { id: uniqueId, name: "", color: randomColor, description: "" }
    ]);
  };

  // კატეგორიის წაშლა
  const removeCategory = (id: number) => {
    if (categories.length <= 2) {
      setErrors(prev => ({ ...prev, categories: "მინიმუმ 2 კატეგორია აუცილებელია" }));
      return;
    }
    
    setCategories(categories.filter(cat => cat.id !== id));
  };

  // კატეგორიის განახლება
  const updateCategory = (id: number, field: string, value: string) => {
    setCategories(
      categories.map(cat => 
        cat.id === id ? { ...cat, [field]: value } : cat
      )
    );
  };

  // ჯგუფის შექმნა
  const createGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ეკრანზე გამოვიტანოთ ლოადინგი და გავასუფთაოთ შეცდომების ველი
    setLoading(true);
    setError("");
    setErrors({});
    
    try {
      // ჯერ შევამოწმოთ სესია პირდაპირ Supabase-თან
      const supabase = createClient();
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session) {
        console.error("ავთორიზაციის სესიის შემოწმების შეცდომა:", sessionError);
        setError("სესია ვადაგასულია, გთხოვთ განაახლოთ გვერდი და შეხვიდეთ ხელახლა");
        setTimeout(() => {
          router.push("/sign-in?redirect=" + encodeURIComponent(window.location.pathname));
        }, 1500);
        return;
      }
      
      // ავთენტიფიკაციის შემოწმება
      if (!user) {
        console.error("ავტორიზაცია საჭიროა ჯგუფის შესაქმნელად");
        setError("მომხმარებლის პროფილი არ არის ხელმისაწვდომი, გთხოვთ შეხვიდეთ ხელახლა");
        setTimeout(() => {
          router.push("/sign-in?redirect=" + encodeURIComponent(window.location.pathname));
        }, 1500);
        return;
      }
      
      // ფორმის ვალიდაცია
      if (!validateForm()) {
        setLoading(false);
        return;
      }
      
      // მომზადდეს მოთხოვნის ობიექტი
      const requestData = {
        name: name.trim(),
        description: description.trim(),
        type: groupType,
        isPrivate,
        moderationMode
      };
      
      // არასავალდებულო ველები
      if (coverImage) requestData.coverImage = coverImage;
      if (icon) requestData.icon = icon;
      
      // ქვანტური აზროვნების ჯგუფებისთვის - კატეგორიები
      if (groupType === "quantum") {
        // კატეგორიების მომზადება - მხოლოდ საჭირო ველები
        const cleanedCategories = categories.map(cat => ({
          name: cat.name.trim(),
          color: cat.color,
          description: cat.description ? cat.description.trim() : ""
        }));
        
        requestData.categories = cleanedCategories;
      }
      
      console.log("მიმდინარეობს ჯგუფის შექმნის მოთხოვნის გაგზავნა:", requestData);
      
      // მოთხოვნის გაგზავნა
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestData),
        cache: "no-store", // კეშის მოხსნა
        credentials: "include" // აუცილებელია სესიის ქუქის გაგზავნისთვის
      });
      
      // HTTP სტატუს კოდისა და პასუხის შემოწმება
      console.log("ჯგუფის შექმნის სტატუსი:", response.status);
      
      // პასუხის დამუშავება
      const data = await response.json().catch(e => {
        console.error("JSON parsing error:", e);
        throw new Error("პასუხის დამუშავება ვერ მოხერხდა");
      });
      
      console.log("ჯგუფის შექმნის პასუხი:", data);
      
      // სტატუს კოდის შემოწმება
      if (response.status === 401 || response.status === 403) {
        // ავთენტიფიკაციის პრობლემა - გადავამისამართოთ შესვლის გვერდზე
        console.error("ავთორიზაცია საჭიროა:", data);
        setError("სესია ვადაგასულია, გთხოვთ შეხვიდეთ ხელახლა");
        setTimeout(() => {
          router.push("/sign-in?redirect=" + encodeURIComponent(window.location.pathname));
        }, 1500);
        return;
      }
      
      if (response.ok && data.success && data.group && data.group.id) {
        // წარმატებული პასუხი - გადავამისამართოთ ახალი ჯგუფის გვერდზე
        console.log("ჯგუფი წარმატებით შეიქმნა, ID:", data.group.id);
        router.push(`/groups/${data.group.id}`);
      } else {
        // შეცდომის დამუშავება
        console.error("სერვერის შეცდომა:", data);
        
        // თუ დეტალური შეცდომა არსებობს, გამოვიტანოთ ის
        if (data.details) {
          setError(`${data.error || "შეცდომა ჯგუფის შექმნისას"}: ${data.details}`);
        } else {
          setError(data.error || "შეცდომა ჯგუფის შექმნისას");
        }
      }
    } catch (err) {
      // ქსელის ან სხვა გაუთვალისწინებელი შეცდომა
      console.error("ჯგუფის შექმნის შეცდომა:", err);
      setError(err instanceof Error ? err.message : "სერვერთან კავშირის შეცდომა");
    } finally {
      setLoading(false);
    }
  };

  // სურათის ატვირთვის სიმულაცია - რეალურ აპში აქ ფაილის ატვირთვის ფუნქციონალი იქნება
  const simulateImageUpload = () => {
    // დემო აპისთვის მხოლოდ პლეისჰოლდერ ლინკს ვიყენებთ
    setCoverImage("https://placehold.co/600x200/333/666");
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-3xl mx-auto">
        {/* ჰედერი */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-2">
            <Link
              href="/groups"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-white">ახალი ჯგუფის შექმნა</h1>
          </div>
          <p className="text-gray-400">
            შექმენი ახალი სივრცე დისკუსიებისთვის, იდეების გაზიარებისთვის და თანამშრომლობისთვის
          </p>
        </div>
        
        {/* ძირითადი ფორმა */}
        <form onSubmit={createGroup}>
          {/* შეცდომის შეტყობინება - უფრო მკაფიო */}
          {error && (
            <div className="mb-6 p-4 rounded-lg flex items-center bg-red-900/30 border border-red-800 text-red-300">
              <div className="mr-3 bg-red-800 rounded-full p-2 flex-shrink-0">
                <X className="w-5 h-5 text-red-300" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">შეცდომა</h3>
                <p>{error}</p>
              </div>
            </div>
          )}
          
          {/* ჯგუფის ბაზისური ინფორმაცია */}
          <div className="bg-secondary-dark rounded-lg p-6 border border-borderGray-dark mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">ჯგუფის ინფორმაცია</h2>
            
            {/* სახელი */}
            <div className="mb-4">
              <label htmlFor="group-name" className="block text-white font-medium mb-1">
                ჯგუფის სახელი *
              </label>
              <input
                id="group-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full bg-secondary border ${
                  errors.name ? "border-red-500" : "border-borderGray-dark"
                } rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-accent`}
                placeholder="შეიყვანეთ ჯგუფის სახელი"
                maxLength={50}
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              <p className="text-gray-500 text-xs mt-1">
                {50 - name.length} სიმბოლო დარჩენილია
              </p>
            </div>
            
            {/* აღწერა */}
            <div className="mb-4">
              <label htmlFor="group-description" className="block text-white font-medium mb-1">
                ჯგუფის აღწერა
              </label>
              <textarea
                id="group-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-secondary border border-borderGray-dark rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-accent min-h-20"
                placeholder="აღწერეთ რის შესახებ იქნება ეს ჯგუფი"
                maxLength={500}
              />
              <p className="text-gray-500 text-xs mt-1">
                {500 - description.length} სიმბოლო დარჩენილია
              </p>
            </div>
            
            {/* უსაფრთხოების პარამეტრები */}
            <div className="mb-4">
              <label className="block text-white font-medium mb-1">
                პრივატულობა
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsPrivate(false)}
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg ${
                    !isPrivate
                      ? "bg-secondary-light text-white border-accent border"
                      : "bg-secondary text-gray-300 border-borderGray-dark border"
                  }`}
                >
                  <Unlock className="w-5 h-5" />
                  <span>ღია ჯგუფი</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrivate(true)}
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg ${
                    isPrivate
                      ? "bg-secondary-light text-white border-accent border"
                      : "bg-secondary text-gray-300 border-borderGray-dark border"
                  }`}
                >
                  <Lock className="w-5 h-5" />
                  <span>პრივატული ჯგუფი</span>
                </button>
              </div>
              <p className="text-gray-500 text-xs mt-1">
                {isPrivate
                  ? "პრივატულ ჯგუფში გაწევრიანებისთვის საჭიროა ადმინისტრატორის თანხმობა"
                  : "ღია ჯგუფში ნებისმიერ მომხმარებელს შეუძლია გაწევრიანება"}
              </p>
            </div>
            
            {/* მოდერაციის რეჟიმი */}
            <div className="mb-4">
              <label className="block text-white font-medium mb-1">
                მოდერაციის რეჟიმი
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setModerationMode("auto")}
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg ${
                    moderationMode === "auto"
                      ? "bg-secondary-light text-white border-accent border"
                      : "bg-secondary text-gray-300 border-borderGray-dark border"
                  }`}
                >
                  <Sparkles className="w-5 h-5" />
                  <span>ავტომატური</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModerationMode("manual")}
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg ${
                    moderationMode === "manual"
                      ? "bg-secondary-light text-white border-accent border"
                      : "bg-secondary text-gray-300 border-borderGray-dark border"
                  }`}
                >
                  <Settings className="w-5 h-5" />
                  <span>მანუალური</span>
                </button>
              </div>
              <p className="text-gray-500 text-xs mt-1">
                {moderationMode === "auto"
                  ? "პოსტები ავტომატურად ქვეყნდება დადასტურების გარეშე"
                  : "ყველა პოსტი საჭიროებს ადმინისტრატორის დადასტურებას"}
              </p>
            </div>
            
            {/* სურათის ატვირთვა */}
            <div className="mb-4">
              <label className="block text-white font-medium mb-1">
                ჯგუფის გარეკანი
              </label>
              <div 
                className="w-full h-32 border-2 border-dashed border-borderGray-dark rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-accent transition-colors"
                onClick={simulateImageUpload}
              >
                {coverImage ? (
                  <div className="relative w-full h-full">
                    <img 
                      src={coverImage} 
                      alt="ჯგუფის გარეკანი" 
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      className="absolute top-2 right-2 bg-secondary-dark bg-opacity-70 p-1 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCoverImage("");
                      }}
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Image className="w-6 h-6 text-gray-400 mb-2" />
                    <p className="text-gray-400 text-sm">დააჭირეთ ფოტოს ასატვირთად</p>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* ჯგუფის ტიპის არჩევა */}
          <div className="bg-secondary-dark rounded-lg p-6 border border-borderGray-dark mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">ჯგუფის ტიპი *</h2>
            <p className="text-gray-400 text-sm mb-4">
              აირჩიეთ ჯგუფის ტიპი მისი მიზნიდან გამომდინარე. ტიპი განსაზღვრავს ჯგუფის ფუნქციონალს.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groupTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setGroupType(type.id)}
                  className={`flex items-start p-4 rounded-lg text-left ${
                    groupType === type.id
                      ? "bg-secondary-light border-accent"
                      : "bg-secondary border-borderGray-dark"
                  } border hover:bg-secondary-light transition-colors`}
                >
                  <div className="mr-3 mt-1">{type.icon}</div>
                  <div>
                    <h3 className="text-white font-medium mb-1">{type.name}</h3>
                    <p className="text-gray-400 text-sm">{type.description}</p>
                  </div>
                </button>
              ))}
            </div>
            
            {errors.type && <p className="text-red-500 text-sm mt-2">{errors.type}</p>}
          </div>
          
          {/* ქვანტური აზროვნების ჯგუფისთვის კატეგორიები */}
          {groupType === "quantum" && (
            <div className="bg-secondary-dark rounded-lg p-6 border border-borderGray-dark mb-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-white">აზრობრივი კატეგორიები *</h2>
                  <p className="text-gray-400 text-sm">
                    შექმენით კატეგორიები აზრების კლასიფიკაციისთვის (მინიმუმ 2, მაქსიმუმ 10)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addCategory}
                  className="bg-secondary hover:bg-secondary-light text-white py-1 px-3 rounded-lg flex items-center transition-colors"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  კატეგორია
                </button>
              </div>
              
              {errors.categories && (
                <p className="text-red-500 text-sm mb-4">{errors.categories}</p>
              )}
              
              <div className="space-y-4">
                {categories.map((category) => (
                  <div 
                    key={category.id}
                    className="flex items-start gap-3 bg-secondary p-4 rounded-lg border border-borderGray-dark"
                  >
                    {/* ფერის არჩევა */}
                    <div className="flex-shrink-0">
                      <div
                        className="w-6 h-6 rounded cursor-pointer"
                        style={{ backgroundColor: category.color }}
                        onClick={() => {
                          // მარტივი ფერის არჩევა - რეალურ აპში უფრო კარგი ფერის არჩევა იქნება
                          const randomColor = colorOptions[Math.floor(Math.random() * colorOptions.length)];
                          updateCategory(category.id, "color", randomColor);
                        }}
                      ></div>
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      {/* კატეგორიის სახელი */}
                      <input
                        type="text"
                        value={category.name}
                        onChange={(e) => updateCategory(category.id, "name", e.target.value)}
                        className="w-full bg-secondary-dark border border-borderGray-dark rounded py-1 px-2 text-white focus:outline-none focus:ring-1 focus:ring-accent"
                        placeholder="კატეგორიის სახელი"
                        maxLength={30}
                      />
                      
                      {/* კატეგორიის აღწერა */}
                      <input
                        type="text"
                        value={category.description}
                        onChange={(e) => updateCategory(category.id, "description", e.target.value)}
                        className="w-full bg-secondary-dark border border-borderGray-dark rounded py-1 px-2 text-white focus:outline-none focus:ring-1 focus:ring-accent"
                        placeholder="კატეგორიის აღწერა (არასავალდებულო)"
                        maxLength={100}
                      />
                    </div>
                    
                    {/* წაშლის ღილაკი */}
                    <button
                      type="button"
                      onClick={() => removeCategory(category.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1"
                      title="კატეგორიის წაშლა"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 flex items-center">
                <Info className="w-4 h-4 text-accent mr-2" />
                <p className="text-gray-400 text-xs">
                  AI ავტომატურად გააანალიზებს პოსტებსა და კომენტარებს და მიანიჭებს მათ შესაბამის კატეგორიებს
                </p>
              </div>
            </div>
          )}
          
          {/* ღილაკები */}
          <div className="flex gap-4 justify-end">
            <Link
              href="/groups"
              className={`px-6 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-secondary transition-colors ${loading ? "opacity-50 pointer-events-none" : ""}`}
            >
              გაუქმება
            </Link>
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2 bg-accent text-white rounded-lg hover:bg-accent-dark transition-colors flex items-center ${
                loading ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {loading ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  დამუშავება...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  ჯგუფის შექმნა
                </>
              )}
            </button>
          </div>
          
          {/* ლოადინგის ინდიკატორი გადაფარვით */}
          {loading && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-secondary-dark p-6 rounded-lg shadow-xl flex flex-col items-center">
                <div className="animate-spin mb-4 h-10 w-10 border-4 border-accent border-t-transparent rounded-full"></div>
                <p className="text-white text-lg">ჯგუფის შექმნა მიმდინარეობს...</p>
                <p className="text-gray-400 text-sm mt-2">გთხოვთ მოიცადოთ</p>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}