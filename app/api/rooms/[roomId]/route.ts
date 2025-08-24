import { type NextRequest, NextResponse } from "next/server"
import { requireAuth, requireRoomMembership } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest, { params }: { params: { roomId: string } }) {
  try {
    const user = await requireAuth()
    const { roomId } = params

    await requireRoomMembership(user.id, roomId)

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        memberships: {
          include: { user: true },
          orderBy: { joinedAt: "asc" },
        },
        rounds: {
          where: { status: "OPEN" },
          include: {
            expenses: {
              include: { payer: true },
              orderBy: { createdAt: "desc" },
            },
            _count: {
              select: { expenses: true },
            },
          },
        },
      },
    })

    if (!room) {
      return NextResponse.json({ message: "Room not found" }, { status: 404 })
    }

    return NextResponse.json({ room })
  } catch (error) {
    console.error("Get room error:", error)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }
}
