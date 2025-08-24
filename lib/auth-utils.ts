import { headers } from "next/headers"
import { verifyToken, type User } from "./auth"
import { prisma } from "./prisma"

export async function getCurrentUser(): Promise<User | null> {
  const headersList = headers()
  const authorization = headersList.get("authorization")

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return null
  }

  const token = authorization.substring(7)
  return verifyToken(token)
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Unauthorized")
  }
  return user
}

export async function getUserMembership(userId: string, roomId: string) {
  return await prisma.membership.findUnique({
    where: {
      userId_roomId: {
        userId,
        roomId,
      },
    },
    include: {
      room: true,
      user: true,
    },
  })
}

export async function requireRoomMembership(userId: string, roomId: string) {
  const membership = await getUserMembership(userId, roomId)
  if (!membership) {
    throw new Error("Not a member of this room")
  }
  return membership
}
