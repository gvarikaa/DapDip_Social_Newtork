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

let onlineUsers = [];

const addUser = (username, socketId) => {
  const isExist = onlineUsers.find((user) => user.socketId === socketId);

  if (!isExist) {
    onlineUsers.push({ username, socketId });
    console.log(username + " added!");
  }
};

const removeUser = (socketId) => {
  onlineUsers = onlineUsers.filter((user) => user.socketId !== socketId);
  console.log("user removed!");
};

const getUser = (username) => {
  return onlineUsers.find((user) => user.username === username);
};

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
    }
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
    
    // მომხმარებლის დამატება
    socket.on("newUser", (username) => {
      addUser(username, socket.id);
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
      console.log("New message received:", message);
      
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
        console.error("Error handling message:", error);
      }
    });

    // ოთახში შესვლა კონკრეტული საუბრისთვის
    socket.on("joinRoom", (conversationId) => {
      console.log(`User ${socket.id} joined room ${conversationId}`);
      socket.join(conversationId);
    });

    // ოთახიდან გასვლა
    socket.on("leaveRoom", (conversationId) => {
      console.log(`User ${socket.id} left room ${conversationId}`);
      socket.leave(conversationId);
    });

    // გათიშვა
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
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