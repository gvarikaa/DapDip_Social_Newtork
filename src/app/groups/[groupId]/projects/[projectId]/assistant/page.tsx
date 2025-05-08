import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { auth } from '@/utils/supabase/server';
import { prisma } from '@/prisma';
import { ProjectAssistantClient } from './client';

interface ProjectAssistantPageProps {
  params: {
    groupId: string;
    projectId: string;
  };
}

export async function generateMetadata({ params }: ProjectAssistantPageProps): Promise<Metadata> {
  try {
    const project = await prisma.groupProject.findUnique({
      where: {
        id: params.projectId,
      },
      select: {
        name: true,
      },
    });

    return {
      title: project ? `${project.name} - პროექტის AI ასისტენტი` : 'პროექტის AI ასისტენტი',
      description: 'პროექტის მენეჯმენტის AI ასისტენტი დაგეხმარებათ პროექტის ეფექტურად დაგეგმვაში, ანალიზში და მართვაში',
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'პროექტის AI ასისტენტი',
      description: 'პროექტის მენეჯმენტის AI ასისტენტი',
    };
  }
}

export default async function ProjectAssistantPage({ params }: ProjectAssistantPageProps) {
  const { groupId, projectId } = params;
  
  // მომხმარებლის ავთენტიფიკაციის შემოწმება
  const { userId } = await auth();
  if (!userId) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg">
        <h1 className="text-xl font-bold mb-4">ავტორიზაცია საჭიროა</h1>
        <p>ამ გვერდის სანახავად გთხოვთ გაიაროთ ავტორიზაცია</p>
        <Link href="/sign-in" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-md">
          ავტორიზაცია
        </Link>
      </div>
    );
  }

  // პროექტის ინფორმაციის მიღება
  const project = await prisma.groupProject.findUnique({
    where: {
      id: projectId,
    },
    include: {
      group: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  // მომხმარებლის წვდომის შემოწმება პროექტზე
  const userAccess = await prisma.groupProjectMember.findFirst({
    where: {
      projectId,
      userId,
    },
  });

  // ჯგუფის ადმინისტრატორის წვდომის შემოწმება
  const isGroupAdmin = await prisma.groupMember.findFirst({
    where: {
      userId,
      groupId,
      role: 'ADMIN',
    },
  });

  if (!project) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg">
        <h1 className="text-xl font-bold mb-4">პროექტი ვერ მოიძებნა</h1>
        <p>მოთხოვნილი პროექტი არ არსებობს</p>
        <Link
          href={`/groups/${groupId}/projects`}
          className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          პროექტების სიაში დაბრუნება
        </Link>
      </div>
    );
  }

  if (!userAccess && !isGroupAdmin) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg">
        <h1 className="text-xl font-bold mb-4">წვდომა შეზღუდულია</h1>
        <p>თქვენ არ გაქვთ წვდომა ამ პროექტზე</p>
        <Link
          href={`/groups/${groupId}/projects`}
          className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          პროექტების სიაში დაბრუნება
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href={`/groups/${groupId}/projects/${projectId}`}
          className="inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          პროექტში დაბრუნება
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="border-b p-6">
          <h1 className="text-2xl font-bold">{project.name} - AI ასისტენტი</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            პროექტის მენეჯმენტის AI ასისტენტი დაგეხმარებათ პროექტის ეფექტურად დაგეგმვაში, 
            ანალიზში, პრიორიტეტების განსაზღვრაში და ანგარიშგებაში.
          </p>
        </div>

        <div className="p-6">
          <ProjectAssistantClient projectId={projectId} />
        </div>

        <div className="p-6 bg-gray-50 dark:bg-gray-900 text-sm text-gray-500 dark:text-gray-400">
          <p>
            AI ასისტენტი ეფუძნება Google Gemini-ს და ანალიზს უკეთებს პროექტის მონაცემებს. 
            ყველა რჩევა და რეკომენდაცია არის საორიენტაციო ხასიათის და შეიძლება მოითხოვდეს ადამიანის განხილვას გადაწყვეტილების მიღებამდე.
          </p>
        </div>
      </div>
    </div>
  );
}