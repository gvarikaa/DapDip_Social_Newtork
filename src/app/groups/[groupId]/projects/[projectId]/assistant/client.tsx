'use client';

import React, { useState } from 'react';
import { ProjectManagementAssistant } from '@/components/AI';
import {
  Info,
  Calendar,
  BarChart,
  Bookmark,
  ListOrdered,
  FileText,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface ProjectAssistantClientProps {
  projectId: string;
}

export function ProjectAssistantClient({ projectId }: ProjectAssistantClientProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    features: true,
    usage: true,
    limitations: false,
  });

  const [aiResponse, setAiResponse] = useState<any>(null);

  // განყოფილების გაშლა/ჩაკეცვა
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // AI-ს პასუხის მიღება
  const handleResponseGenerated = (response: any) => {
    setAiResponse(response);
  };

  return (
    <div className="space-y-8">
      {/* AI ასისტენტის მთავარი კომპონენტი */}
      <ProjectManagementAssistant
        projectId={projectId}
        onResponseGenerated={handleResponseGenerated}
      />

      {/* პროექტის ასისტენტის ფუნქციები */}
      <div className="mt-8 border rounded-lg overflow-hidden">
        <div
          className="p-4 bg-gray-50 dark:bg-gray-900 flex justify-between items-center cursor-pointer"
          onClick={() => toggleSection('features')}
        >
          <h3 className="text-lg font-medium">პროექტის ასისტენტის ფუნქციები</h3>
          <button aria-label="Toggle section">
            {expandedSections.features ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        </div>

        {expandedSections.features && (
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-start">
                  <div className="mr-3 p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                    <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-medium">პროექტის დაგეგმვა</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      გეხმარებათ პროექტის ეფექტურად დაგეგმვაში, ამოცანების სტრუქტურირებაში და რისკების იდენტიფიკაციაში.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-start">
                  <div className="mr-3 p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                    <ListOrdered className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-medium">პრიორიტეტიზაცია</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      გეხმარებათ ამოცანების პრიორიტეტიზაციაში და რესურსების ოპტიმალურ განაწილებაში.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-start">
                  <div className="mr-3 p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                    <BarChart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-medium">პროექტის ანალიზი</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      პროექტის პროგრესის ანალიზი, ტენდენციების იდენტიფიკაცია და შესრულების შეფასება.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-start">
                  <div className="mr-3 p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-medium">ანგარიშგება</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      გეხმარებათ პროექტის ანგარიშების, პრეზენტაციების და დოკუმენტაციის შექმნაში.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* როგორ გამოვიყენოთ */}
      <div className="border rounded-lg overflow-hidden">
        <div
          className="p-4 bg-gray-50 dark:bg-gray-900 flex justify-between items-center cursor-pointer"
          onClick={() => toggleSection('usage')}
        >
          <h3 className="text-lg font-medium">როგორ გამოვიყენოთ ასისტენტი</h3>
          <button aria-label="Toggle section">
            {expandedSections.usage ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        </div>

        {expandedSections.usage && (
          <div className="p-4">
            <div className="space-y-4">
              <div className="flex items-start">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 font-medium mr-3">
                  1
                </span>
                <p className="text-gray-600 dark:text-gray-300">
                  აირჩიეთ ასისტენტის ტიპი ზედა ჩანართებიდან, თქვენი საჭიროებების მიხედვით.
                </p>
              </div>

              <div className="flex items-start">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 font-medium mr-3">
                  2
                </span>
                <p className="text-gray-600 dark:text-gray-300">
                  შეარჩიეთ შეკითხვის მაგალითი ან ჩაწერეთ საკუთარი შეკითხვა შეტყობინების ველში.
                </p>
              </div>

              <div className="flex items-start">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 font-medium mr-3">
                  3
                </span>
                <p className="text-gray-600 dark:text-gray-300">
                  დააჭირეთ "გაგზავნა" ღილაკს და მიიღეთ AI ასისტენტის პასუხი.
                </p>
              </div>

              <div className="flex items-start">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 font-medium mr-3">
                  4
                </span>
                <p className="text-gray-600 dark:text-gray-300">
                  ახალი შეკითხვის დასასმელად, დააჭირეთ "ახალი შეკითხვის დასმა" ღილაკს.
                </p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-start">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-600 dark:text-gray-300">
                ასისტენტი აანალიზებს თქვენი პროექტის მონაცემებს, ამიტომ მისი პასუხები უფრო
                ზუსტი იქნება, თუ პროექტი აღწერილია დეტალურად და ამოცანები კარგად არის განსაზღვრული.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* შეზღუდვები */}
      <div className="border rounded-lg overflow-hidden">
        <div
          className="p-4 bg-gray-50 dark:bg-gray-900 flex justify-between items-center cursor-pointer"
          onClick={() => toggleSection('limitations')}
        >
          <h3 className="text-lg font-medium">ასისტენტის შეზღუდვები</h3>
          <button aria-label="Toggle section">
            {expandedSections.limitations ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        </div>

        {expandedSections.limitations && (
          <div className="p-4">
            <div className="flex items-start mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-500 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium">გაითვალისწინეთ შეზღუდვები</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  AI ასისტენტი არის დამხმარე ინსტრუმენტი და არა ჩამნაცვლებელი ადამიანის მიერ მიღებული გადაწყვეტილებებისა.
                </p>
              </div>
            </div>

            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li className="flex items-start">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 mt-1.5 mr-2"></span>
                <span>
                  ასისტენტი მუშაობს მხოლოდ პროექტის მონაცემებზე დაყრდნობით, და არ ითვალისწინებს გარე ფაქტორებს.
                </span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 mt-1.5 mr-2"></span>
                <span>
                  AI-ს რეკომენდაციები შეიძლება არ იყოს სრულყოფილი და საჭიროებდეს დამატებით განხილვას.
                </span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 mt-1.5 mr-2"></span>
                <span>
                  ასისტენტი ვერ ცვლის სპეციალიზებული პროექტის მენეჯმენტის პროგრამულ უზრუნველყოფას.
                </span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 mt-1.5 mr-2"></span>
                <span>
                  კომპლექსური პრობლემების გადაჭრისას, რეკომენდებულია რამდენიმე წყაროს გამოყენება გადაწყვეტილების მისაღებად.
                </span>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}