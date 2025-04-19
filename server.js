import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

// ონლაინ მომხმარებლების თრეკინგი
let onlineUsers = [];

// მიმდინარე ზარების თრეკინგი
let activeCallSessions = {};

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

// ზარის სესიის შექმნა
const createCallSession = (callerId, receiverId, conversationId, callType) => {
  const sessionId = uuidv4();
  activeCallSessions[sessionId] = {
    callerId,
    receiverId,
    conversationId,
    callType,
    startTime: Date.now(),
    status: "calling" // შესაძლო სტატუსები: "calling", "active", "ended"
  };
  return sessionId;
};

// ზარის სესიის დასრულება
const endCallSession = (sessionId) => {
  if (activeCallSessions[sessionId]) {
    activeCallSessions[sessionId].status = "ended";
    const duration = Math.floor((Date.now() - activeCallSessions[sessionId].startTime) / 1000);
    
    // ლოგი ან მონაცემთა ბაზაში შენახვა (არჩევით)
    console.log(`ზარი დასრულდა. ხანგრძლივობა: ${duration} წამი`);
    
    // სესიის წაშლა გარკვეული დროის შემდეგ
    setTimeout(() => {
      delete activeCallSessions[sessionId];
    }, 60000); // წაშლა 1 წუთის შემდეგ
    
    return duration;
  }
  return 0;
};

// სერვერის დაწყება
app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
    }
  });

  io.on("connection", (socket) => {
    console.log("მომხმარებელი დაკავშირდა:", socket.id);
    
    // მომხმარებლის დამატება
    socket.on("newUser", (username) => {
      addUser(username, socket.id);
      
      // შეტყობინება ყველა მომხმარებელს ახალი მომხმარებლის ონლაინ სტატუსის შესახებ
      io.emit("userStatusChange", {
        userId: username,
        isOnline: true
      });
    });

    // მომხმარებლის სტატუსის განახლება
    socket.on("updateStatus", ({ isOnline }) => {
      const user = onlineUsers.find(user => user.socketId === socket.id);
      if (user) {
        io.emit("userStatusChange", {
          userId: user.username,
          isOnline
        });
      }
    });

    // ნოტიფიკაციების გაგზავნა
    socket.on("sendNotification", ({ receiverUsername, data }) => {
      const receiver = getUser(receiverUsername);
      if (receiver) {
        io.to(receiver.socketId).emit("getNotification", {
          id: uuidv4(),
          ...data,
        });
      }
    });

    // მესიჯის გაგზავნა
    socket.on("sendMessage", async (message) => {
      console.log("ახალი მესიჯი მიღებულია:", message);
      
      try {
        // მესიჯის განახლება ბაზაში (ოფციონალური, თუ უკვე გაკეთებულია API მხარეს)
        // const updatedMessage = await prisma.message.update({
        //   where: { id: message.id },
        //   data: { isRead: true }
        // });
        
        // მესიჯის გაგზავნა ყველა მონაწილისთვის ამ საუბარში
        const participants = await prisma.conversationParticipant.findMany({
          where: { conversationId: message.conversationId },
          select: { userId: true }
        });
        
        // მესიჯის გაგზავნა ყველა ონლაინ მონაწილისთვის
        participants.forEach(participant => {
          const onlineUser = onlineUsers.find(user => user.username.includes(participant.userId));
          if (onlineUser) {
            io.to(onlineUser.socketId).emit("newMessage", message);
          }
        });

        // ან ალტერნატიულად, გააგზავნეთ მესიჯი ყველასთვის, ვინც შეერთებულია ამ ოთახთან
        // საუბრის ID-ის საფუძველზე ოთახის შექმნით
        socket.to(message.conversationId).emit("newMessage", message);
        
      } catch (error) {
        console.error("მესიჯის დამუშავების შეცდომა:", error);
      }
    });

    // ვიდეო/აუდიო ზარის მოთხოვნა
    socket.on("callRequest", ({ conversationId, receiverId, callType }) => {
      console.log(`ზარის მოთხოვნა: ${callType} ზარი მომხმარებელთან ${receiverId}`);
      
      // ვიპოვოთ მიმღები მომხმარებელი
      const receiver = onlineUsers.find(user => user.username.includes(receiverId));
      const caller = onlineUsers.find(user => user.socketId === socket.id);
      
      if (receiver && caller) {
        // შევქმნათ ზარის სესია
        const sessionId = createCallSession(caller.username, receiverId, conversationId, callType);
        
        // გავაგზავნოთ ზარის მოთხოვნა მიმღებთან
        io.to(receiver.socketId).emit("incomingCall", {
          sessionId,
          callerId: caller.username,
          conversationId,
          callType
        });
      }
    });
    
    // ზარის მოთხოვნაზე პასუხი
    socket.on("callResponse", ({ sessionId, accepted, callerId }) => {
      // ვიპოვოთ ზარის ინიციატორი
      const caller = getUser(callerId);
      
      if (caller) {
        // გავაგზავნოთ პასუხი ზარის ინიციატორთან
        io.to(caller.socketId).emit("callResponseReceived", {
          sessionId,
          accepted
        });
        
        // თუ დათანხმდა, განვაახლოთ ზარის სტატუსი
        if (accepted && activeCallSessions[sessionId]) {
          activeCallSessions[sessionId].status = "active";
        } else if (activeCallSessions[sessionId]) {
          // თუ უარყო, დავასრულოთ ზარი
          endCallSession(sessionId);
        }
      }
    });
    
    // ზარის დასრულება
    socket.on("endCall", ({ sessionId, receiverId }) => {
      // ვიპოვოთ მიმღები
      const receiver = getUser(receiverId);
      
      if (receiver) {
        // გავაგზავნოთ ზარის დასრულების სიგნალი
        io.to(receiver.socketId).emit("callEnded", { sessionId });
      }
      
      // დავასრულოთ ზარის სესია
      endCallSession(sessionId);
    });

    // ოთახში შესვლა კონკრეტული საუბრისთვის
    socket.on("joinRoom", (conversationId) => {
      console.log(`მომხმარებელი ${socket.id} შევიდა ოთახში ${conversationId}`);
      socket.join(conversationId);
    });

    // ოთახიდან გასვლა
    socket.on("leaveRoom", (conversationId) => {
      console.log(`მომხმარებელი ${socket.id} გავიდა ოთახიდან ${conversationId}`);
      socket.leave(conversationId);
    });

    // გათიშვა
    socket.on("disconnect", () => {
      console.log("მომხმარებელი გაითიშა:", socket.id);
      
      // ვიპოვოთ გათიშული მომხმარებელი
      const user = onlineUsers.find(user => user.socketId === socket.id);
      
      if (user) {
        // შევატყობინოთ ყველას, რომ მომხმარებელი გაითიშა
        io.emit("userStatusChange", {
          userId: user.username,
          isOnline: false
        });
        
        // შევამოწმოთ აქტიური ზარები ამ მომხმარებელთან
        Object.keys(activeCallSessions).forEach(sessionId => {
          const session = activeCallSessions[sessionId];
          
          if (session.callerId === user.username || session.receiverId === user.username) {
            // თუ ეს მომხმარებელი ზარშია, დავასრულოთ ზარი
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