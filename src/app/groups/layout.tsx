import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft, Home, Users, Brain, Wrench, Newspaper, Compass, PlusCircle } from "lucide-react";

export default function GroupsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* სპეციალური ჰედერი ჯგუფებისთვის */}
      <header className="bg-secondary-dark border-b border-borderGray-dark py-3 px-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            {/* უკან დაბრუნების ღილაკი */}
            <Link href="/" className="mr-3 p-2 rounded-full text-gray-400 hover:text-white hover:bg-secondary">
              <ArrowLeft size={20} />
            </Link>
            
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-primary rounded-lg w-8 h-8 flex items-center justify-center text-white">
                <Users size={18} />
              </div>
              <span className="text-white font-semibold text-lg">ჯგუფები</span>
            </Link>
          </div>
          
          {/* ჯგუფის შექმნის ღილაკი */}
          <Link href="/groups/create" className="bg-accent text-white py-1.5 px-3 rounded-full text-sm flex items-center">
            <PlusCircle size={16} className="mr-1" />
            <span className="hidden sm:inline">შექმენი ჯგუფი</span>
            <span className="sm:hidden">შექმნა</span>
          </Link>
        </div>
      </header>

      {/* ჯგუფის სისტემის ნავიგაცია */}
      <div className="bg-secondary border-b border-borderGray-dark sticky top-[60px] z-[9] overflow-x-auto">
        <div className="max-w-7xl mx-auto px-2 flex space-x-1">
          <Link 
            href="/groups"
            className="py-3 px-3 text-gray-300 hover:text-white border-b-2 border-transparent hover:border-accent-dark flex items-center whitespace-nowrap"
          >
            <Home size={18} className="mr-2" />
            მთავარი
          </Link>
          
          <Link 
            href="/groups?type=standard"
            className="py-3 px-3 text-gray-300 hover:text-white border-b-2 border-transparent hover:border-accent-dark flex items-center whitespace-nowrap"
          >
            <Users size={18} className="mr-2" />
            სტანდარტული
          </Link>
          
          <Link 
            href="/groups?type=quantum"
            className="py-3 px-3 text-gray-300 hover:text-white border-b-2 border-transparent hover:border-accent-dark flex items-center whitespace-nowrap"
          >
            <Brain size={18} className="mr-2" />
            ქვანტური აზროვნების
          </Link>
          
          <Link 
            href="/groups?type=project"
            className="py-3 px-3 text-gray-300 hover:text-white border-b-2 border-transparent hover:border-accent-dark flex items-center whitespace-nowrap"
          >
            <Wrench size={18} className="mr-2" />
            პროექტების
          </Link>
          
          <Link 
            href="/groups?type=info"
            className="py-3 px-3 text-gray-300 hover:text-white border-b-2 border-transparent hover:border-accent-dark flex items-center whitespace-nowrap"
          >
            <Newspaper size={18} className="mr-2" />
            საინფორმაციო
          </Link>
          
          <Link 
            href="/groups?memberOf=true"
            className="py-3 px-3 text-gray-300 hover:text-white border-b-2 border-transparent hover:border-accent-dark flex items-center whitespace-nowrap"
          >
            <Compass size={18} className="mr-2" />
            ჩემი ჯგუფები
          </Link>
        </div>
      </div>

      {/* მთავარი კონტენტი */}
      <div className="flex-1 bg-background">
        <Suspense fallback={<div className="p-4 text-center text-gray-400">იტვირთება...</div>}>
          {children}
        </Suspense>
      </div>
      
      {/* ფუტერი */}
      <footer className="bg-secondary-dark border-t border-borderGray-dark py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-400 text-sm">
          <div className="flex flex-wrap justify-center gap-4 mb-2">
            <Link href="/" className="hover:text-white">მთავარი გვერდი</Link>
            <Link href="/groups" className="hover:text-white">ჯგუფები</Link>
            <Link href="/groups/create" className="hover:text-white">შექმენი ჯგუფი</Link>
            <Link href="/groups?memberOf=true" className="hover:text-white">ჩემი ჯგუფები</Link>
          </div>
          <p>© {new Date().getFullYear()} ქვანტური აზრების ჯგუფები - ყველა უფლება დაცულია</p>
        </div>
      </footer>
    </main>
  );
}