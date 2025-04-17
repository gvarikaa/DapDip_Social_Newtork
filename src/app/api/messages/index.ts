import { prisma } from "@/prisma";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { content, userId, conversationId } = req.body;  // text -> content

    if (!content || !userId || !conversationId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const message = await prisma.message.create({
      data: {
        content,        // text -> content
        senderId: userId,  // userId -> senderId
        conversationId,
      },
    });

    return res.status(201).json(message);
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
