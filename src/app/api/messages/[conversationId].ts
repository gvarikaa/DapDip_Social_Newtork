// src/pages/api/messages/[conversationId].ts
import { prisma } from "@/prisma";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { conversationId } = req.query;

  if (req.method === "GET") {
    const messages = await prisma.message.findMany({
      where: { conversationId: String(conversationId) },
      orderBy: { createdAt: "asc" },
    });
    return res.json(messages);
  }

  return res.status(405).end();
}
