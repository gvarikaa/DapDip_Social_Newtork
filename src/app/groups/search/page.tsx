import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { GroupSearchPageClient } from './page-client';

export const metadata: Metadata = {
  title: 'ჯგუფების ძიება AI-ს დახმარებით',
  description: 'მოძებნეთ თქვენთვის საინტერესო ჯგუფები ინტელექტუალური AI ძიების გამოყენებით',
};

export default function GroupSearchPage() {
  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">ჯგუფების ძიება AI-ს დახმარებით</h1>
          <Link 
            href="/groups"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            ყველა ჯგუფი
          </Link>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          გამოიყენეთ ჩვენი AI-ზე დაფუძნებული ძიების სისტემა, რომელიც გეხმარებათ მოძებნოთ 
          ჯგუფები არა მხოლოდ საკვანძო სიტყვების, არამედ კონცეფციებისა და თემების მიხედვით.
        </p>
      </div>

      <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">AI ძიების უპირატესობები</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h3 className="font-medium mb-2">სემანტიკური გაგება</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                AI ესმის თქვენი ძიების კონტექსტი და მნიშვნელობა, არა მხოლოდ საკვანძო სიტყვები.
              </p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h3 className="font-medium mb-2">პერსონალიზებული შედეგები</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                შედეგები მორგებულია თქვენს ინტერესებზე და აქტივობაზე პლატფორმაზე.
              </p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h3 className="font-medium mb-2">სინონიმების მხარდაჭერა</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                AI ავტომატურად ეძებს მსგავსი მნიშვნელობის მქონე სიტყვებსა და ფრაზებს.
              </p>
            </div>
          </div>
        </div>
        
        <GroupSearchPageClient />
      </div>
      
      <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>
          ჩვენი AI ძიების ტექნოლოგია იყენებს Google Gemini-ს და შემუშავებულია მომხმარებლისთვის 
          მაქსიმალურად რელევანტური ჯგუფების მოსაძებნად. 
          <Link href="/about/ai-search" className="text-blue-600 hover:underline ml-1">
            გაიგეთ მეტი
          </Link>
        </p>
      </div>
    </div>
  );
}