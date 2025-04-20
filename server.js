import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();
const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

// შევამოწმოთ ImageKit გარემოს ცვლადები
const checkImageKitConfig = () => {
  const hasPublicKey = !!process.env.NEXT_PUBLIC_PUBLIC_KEY;
  const hasPrivateKey = !!process.env.PRIVATE_KEY;
  const hasUrlEndpoint = !!process.env.NEXT_PUBLIC_URL_ENDPOINT;

  if (!hasPublicKey || !hasPrivateKey || !hasUrlEndpoint) {
    console.warn('\x1b[33m%s\x1b[0m', '⚠️  გაფრთხილება: ImageKit კონფიგურაცია არასრულია!');
    console.log('იყენება ალტერნატიული სურათები ლოკალური public საქაღალდიდან.');
    
    // შევამოწმოთ საქაღალდეები და შევქმნათ თუ არ არსებობს
    const imageDirectories = [
      'public/images',
      'public/images/icons',
      'public/images/general',
      'public/images/avatars',
      'public/images/covers'
    ];
    
    imageDirectories.forEach(dir => {
      if (!fs.existsSync(dir)) {
        console.log(`შევქმნათ საქაღალდე: ${dir}`);
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  } else {
    console.log('\x1b[32m%s\x1b[0m', '✅ ImageKit კონფიგურაცია დადასტურებულია!');
  }
};

// ონლაინ მომხმარებლების თრეკინგი
let onlineUsers = [];

// მომხმარებლის დამატება
const addUser = (username, socketId) => {
  const isExist = onlineUsers.find((user) => user.socketId === socketId);

  if (!isExist) {
    onlineUsers.push({ username, socketId });
    console.log(username + " დაემატა ონლაინ მომხმარებლებში!");
  }
};

// მომხმარებლის წაშლა
const removeUser = (socketId) => {
  onlineUsers = onlineUsers.filter((user) => user.socketId !== socketId);
  console.log("მომხმარებელი წაიშალა ონლაინ სიიდან!");
};

// მომხმარებლის პოვნა
const getUser = (username) => {
  return onlineUsers.find((user) => user.username === username);
};

// ზარის სესიების მართვა
let activeCallSessions = {};

// ზარის სესიის შექმნა
const createCallSession = (callerId, receiverId, conversationId, callType) => {
  const sessionId = uuidv4();
  activeCallSessions[sessionId] = {
    callerId,
    receiverId,
    conversationId,
    callType,
    startTime: Date.now(),
    status: "calling"
  };
  return sessionId;
};

// ზარის სესიის დასრულება
const endCallSession = (sessionId) => {
  if (activeCallSessions[sessionId]) {
    activeCallSessions[sessionId].status = "ended";
    const duration = Math.floor((Date.now() - activeCallSessions[sessionId].startTime) / 1000);
    
    console.log(`ზარი დასრულდა. ხანგრძლივობა: ${duration} წამი`);
    
    setTimeout(() => {
      delete activeCallSessions[sessionId];
    }, 60000);
    
    return duration;
  }
  return 0;
};

// სერვერის დაწყება
app.prepare().then(() => {
  checkImageKitConfig();
  
  const httpServer = createServer(handler);

  const io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
    }
  });

  io.on("connection", (socket) => {
    console.log("მომხმარებელი დაკავშირდა:", socket.id);
    
    socket.on("newUser", (username) => {
      addUser(username, socket.id);
      io.emit("userStatusChange", {
        userId: username,
        isOnline: true
      });
    });

    socket.on("updateStatus", ({ isOnline }) => {
      const user = onlineUsers.find(user => user.socketId === socket.id);
      if (user) {
        io.emit("userStatusChange", {
          userId: user.username,
          isOnline
        });
      }
    });

    socket.on("sendNotification", ({ receiverUsername, data }) => {
      const receiver = getUser(receiverUsername);
      if (receiver) {
        io.to(receiver.socketId).emit("getNotification", {
          id: uuidv4(),
          ...data,
        });
      }
    });

    socket.on("sendMessage", async (message) => {
      console.log("ახალი მესიჯი მიღებულია:", message);
      
      try {
        const participants = await prisma.conversationParticipant.findMany({
          where: { conversationId: message.conversationId },
          select: { userId: true }
        });
        
        participants.forEach(participant => {
          const onlineUser = onlineUsers.find(user => user.username.includes(participant.userId));
          if (onlineUser) {
            io.to(onlineUser.socketId).emit("newMessage", message);
          }
        });

        socket.to(message.conversationId).emit("newMessage", message);
        
      } catch (error) {
        console.error("მესიჯის დამუშავების შეცდომა:", error);
      }
    });

    socket.on("callRequest", ({ conversationId, receiverId, callType }) => {
      console.log(`ზარის მოთხოვნა: ${callType} ზარი მომხმარებელთან ${receiverId}`);
      
      const receiver = onlineUsers.find(user => user.username.includes(receiverId));
      const caller = onlineUsers.find(user => user.socketId === socket.id);
      
      if (receiver && caller) {
        const sessionId = createCallSession(caller.username, receiverId, conversationId, callType);
        
        io.to(receiver.socketId).emit("incomingCall", {
          sessionId,
          callerId: caller.username,
          conversationId,
          callType
        });
      }
    });
    
    socket.on("callResponse", ({ sessionId, accepted, callerId }) => {
      const caller = getUser(callerId);
      
      if (caller) {
        io.to(caller.socketId).emit("callResponseReceived", {
          sessionId,
          accepted
        });
        
        if (accepted && activeCallSessions[sessionId]) {
          activeCallSessions[sessionId].status = "active";
        } else if (activeCallSessions[sessionId]) {
          endCallSession(sessionId);
        }
      }
    });
    
    socket.on("endCall", ({ sessionId, receiverId }) => {
      const receiver = getUser(receiverId);
      
      if (receiver) {
        io.to(receiver.socketId).emit("callEnded", { sessionId });
      }
      
      endCallSession(sessionId);
    });

    socket.on("joinRoom", (conversationId) => {
      console.log(`მომხმარებელი ${socket.id} შევიდა ოთახში ${conversationId}`);
      socket.join(conversationId);
    });

    socket.on("leaveRoom", (conversationId) => {
      console.log(`მომხმარებელი ${socket.id} გავიდა ოთახიდან ${conversationId}`);
      socket.leave(conversationId);
    });

    socket.on("disconnect", () => {
      console.log("მომხმარებელი გაითიშა:", socket.id);
      
      const user = onlineUsers.find(user => user.socketId === socket.id);
      
      if (user) {
        io.emit("userStatusChange", {
          userId: user.username,
          isOnline: false
        });
        
        Object.keys(activeCallSessions).forEach(sessionId => {
          const session = activeCallSessions[sessionId];
          
          if (session.callerId === user.username || session.receiverId === user.username) {
            const otherUserId = session.callerId === user.username ? session.receiverId : session.callerId;
            const otherUser = getUser(otherUserId);
            
            if (otherUser) {
              io.to(otherUser.socketId).emit("callEnded", { sessionId, reason: "მომხმარებელი გაითიშა" });
            }
            
            endCallSession(sessionId);
          }
        });
      }
      
      removeUser(socket.id);
    });
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});