import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // პირველად წავშალოთ არსებული მონაცემები, რომ თავიდან ავიცილოთ უნიკალურობის შეზღუდვის პრობლემები
  console.log('წაიშალა ძველი მონაცემები');
  
  // მონაცემების წაშლა, იმ თანმიმდევრობით, რომ არ დაირღვეს რეფერენციული მთლიანობა
  await prisma.message.deleteMany({});
  await prisma.conversationParticipant.deleteMany({});
  await prisma.conversation.deleteMany({});
  await prisma.savedPosts.deleteMany({});
  await prisma.like.deleteMany({});
  await prisma.follow.deleteMany({});
  
  // წავშალოთ პოსტები უკუ რიგით - ჯერ კომენტარები და რეპოსტები
  const allPosts = await prisma.post.findMany({});
  const postsWithParentOrRepost = allPosts.filter(post => post.parentPostId !== null || post.rePostId !== null);
  const standalonePostIds = allPosts
    .filter(post => post.parentPostId === null && post.rePostId === null)
    .map(post => post.id);
  
  // წავშალოთ ჯერ კომენტარები და რეპოსტები
  for (const post of postsWithParentOrRepost) {
    await prisma.post.delete({ where: { id: post.id } });
  }
  
  // შემდეგ წავშალოთ დამოუკიდებელი პოსტები
  for (const postId of standalonePostIds) {
    await prisma.post.delete({ where: { id: postId } });
  }
  
  // წავშალოთ მომხმარებლები
  await prisma.user.deleteMany({});
  
  // ახლა შევქმნათ ახალი მონაცემები
  
  // შევქმნათ 5 მომხმარებელი უნიკალური დეტალებით
  const users = [];
  for (let i = 1; i <= 5; i++) {
    const user = await prisma.user.create({
      data: {
        id: `user${i}`,
        email: `user${i}@example.com`,
        username: `user${i}`,
        displayName: `User ${i}`,
        bio: `Hi I'm user${i}. Welcome to my profile!`,
        location: `USA`,
        job: `Developer`,
        website: `google.com`,
      },
    });
    users.push(user);
  }
  console.log(`${users.length} მომხმარებელი შეიქმნა.`);

  // შევქმნათ 5 პოსტი თითოეული მომხმარებლისთვის
  const posts = [];
  for (let i = 0; i < users.length; i++) {
    for (let j = 1; j <= 5; j++) {
      const post = await prisma.post.create({
        data: {
          desc: `Post ${j} by ${users[i].username}`,
          userId: users[i].id,
        },
      });
      posts.push(post);
    }
  }
  console.log('პოსტები შეიქმნა.');

  // შევქმნათ გამომწერები (follows)
  await prisma.follow.createMany({
    data: [
      { followerId: users[0].id, followingId: users[1].id },
      { followerId: users[0].id, followingId: users[2].id },
      { followerId: users[1].id, followingId: users[3].id },
      { followerId: users[2].id, followingId: users[4].id },
      { followerId: users[3].id, followingId: users[0].id },
    ],
  });
  console.log('გამომწერები შეიქმნა.');

  // შევქმნათ მოწონებები (likes)
  await prisma.like.createMany({
    data: [
      { userId: users[0].id, postId: posts[0].id },
      { userId: users[1].id, postId: posts[1].id },
      { userId: users[2].id, postId: posts[2].id },
      { userId: users[3].id, postId: posts[3].id },
      { userId: users[4].id, postId: posts[4].id },
    ],
  });
  console.log('მოწონებები შეიქმნა.');

  // შევქმნათ კომენტარები (თითოეული კომენტარი არის პოსტი, დაკავშირებული მშობელ პოსტთან)
  const comments = [];
  for (let i = 0; i < posts.length; i++) {
    const comment = await prisma.post.create({
      data: {
        desc: `Comment on Post ${posts[i].id} by ${users[(i + 1) % 5].username}`,
        userId: users[(i + 1) % 5].id,
        parentPostId: posts[i].id, // კავშირი მშობელ პოსტთან
      },
    });
    comments.push(comment);
  }
  console.log('კომენტარები შეიქმნა.');

  // შევქმნათ რეპოსტები გამოყენებით Post მოდელის rePostId-ის
  const reposts = [];
  for (let i = 0; i < posts.length; i++) {
    const repost = await prisma.post.create({
      data: {
        desc: `Repost of Post ${posts[i].id} by ${users[(i + 2) % 5].username}`,
        userId: users[(i + 2) % 5].id, // მომხმარებელი, რომელიც აკეთებს რეპოსტს
        rePostId: posts[i].id, // კავშირი ორიგინალ პოსტთან
      },
    });
    reposts.push(repost);
  }
  console.log('რეპოსტები შეიქმნა.');

  // შევქმნათ შენახული პოსტები (saved posts)
  await prisma.savedPosts.createMany({
    data: [
      { userId: users[0].id, postId: posts[1].id },
      { userId: users[1].id, postId: posts[2].id },
      { userId: users[2].id, postId: posts[3].id },
      { userId: users[3].id, postId: posts[4].id },
      { userId: users[4].id, postId: posts[0].id },
    ],
  });
  console.log('შენახული პოსტები შეიქმნა.');

  // შევქმნათ რამდენიმე კონვერსაცია
  const conversations = [];
  
  // 1. კონვერსაცია მომხმარებელ 1 და 2 შორის
  const conversation1 = await prisma.conversation.create({
    data: {
      participants: {
        create: [
          { userId: users[0].id },
          { userId: users[1].id }
        ]
      }
    }
  });
  conversations.push(conversation1);
  
  // 2. კონვერსაცია მომხმარებელ 1 და 3 შორის
  const conversation2 = await prisma.conversation.create({
    data: {
      participants: {
        create: [
          { userId: users[0].id },
          { userId: users[2].id }
        ]
      }
    }
  });
  conversations.push(conversation2);
  
  // 3. ჯგუფური ჩატი მომხმარებლებს 2, 3 და 4 შორის
  const conversation3 = await prisma.conversation.create({
    data: {
      name: "დეველოპერების ჯგუფი",
      isGroup: true,
      participants: {
        create: [
          { userId: users[1].id },
          { userId: users[2].id },
          { userId: users[3].id }
        ]
      }
    }
  });
  conversations.push(conversation3);
  
  console.log(`${conversations.length} კონვერსაცია შეიქმნა.`);

  // შევქმნათ მესიჯები თითოეულ კონვერსაციაში
  // კონვერსაცია 1-ში მესიჯები
  await prisma.message.createMany({
    data: [
      {
        content: "გამარჯობა, როგორ ხარ?",
        conversationId: conversation1.id,
        senderId: users[0].id
      },
      {
        content: "გაუმარჯოს! კარგად, შენ?",
        conversationId: conversation1.id,
        senderId: users[1].id
      },
      {
        content: "კარგად ვარ. რას აკეთებ?",
        conversationId: conversation1.id,
        senderId: users[0].id
      },
      {
        content: "ახალ პროექტზე ვმუშაობ Next.js-ით. შენ?",
        conversationId: conversation1.id,
        senderId: users[1].id
      }
    ]
  });

  // კონვერსაცია 2-ში მესიჯები
  await prisma.message.createMany({
    data: [
      {
        content: "გაუმარჯოს! დაგეხმარები ერთ საკითხში?",
        conversationId: conversation2.id,
        senderId: users[0].id
      },
      {
        content: "რა თქმა უნდა! რა გაინტერესებს?",
        conversationId: conversation2.id,
        senderId: users[2].id
      },
      {
        content: "Prisma-ს გამოყენებით შექმნილი მაქვს მოდელები, მაგრამ პრობლემები მაქვს რელაციებთან",
        conversationId: conversation2.id,
        senderId: users[0].id
      }
    ]
  });

  // კონვერსაცია 3-ში (ჯგუფური ჩატი) მესიჯები
  await prisma.message.createMany({
    data: [
      {
        content: "გამარჯობა ყველას ჯგუფში!",
        conversationId: conversation3.id,
        senderId: users[1].id
      },
      {
        content: "გაუმარჯოს! დღეს რაზე ვისაუბროთ?",
        conversationId: conversation3.id,
        senderId: users[2].id
      },
      {
        content: "Next.js 13-ის ახალი ფუნქციების განხილვა კარგი იქნებოდა",
        conversationId: conversation3.id,
        senderId: users[3].id
      },
      {
        content: "კარგი იდეაა! რა მოგწონთ App Directory-ში?",
        conversationId: conversation3.id,
        senderId: users[1].id
      }
    ]
  });

  console.log('მესიჯები შეიქმნა ყველა კონვერსაციისთვის.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });