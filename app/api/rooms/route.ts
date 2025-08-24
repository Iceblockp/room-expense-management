import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const user = await requireAuth()

    const memberships = await prisma.membership.findMany({
      where: { userId: user.id },
      include: {
        room: {
          include: {
            _count: {
              select: {
                memberships: true,
                expenses: true,
              },
            },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    })

    return NextResponse.json({ rooms: memberships })
  } catch (error) {
    console.error("Get rooms error:", error)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { name, joinCode } = await request.json()

    if (joinCode) {
      // Join existing room
      const room = await prisma.room.findFirst({
        where: { id: joinCode },
      })

      if (!room) {
        return NextResponse.json({ message: "Invalid room code" }, { status: 400 })
      }

      // Check if already a member
      const existingMembership = await prisma.membership.findUnique({
        where: {
          userId_roomId: {
            userId: user.id,
            roomId: room.id,
          },
        },
      })

      if (existingMembership) {
        return NextResponse.json({ message: "Already a member of this room" }, { status: 400 })
      }

      // Add user to room
      const membership = await prisma.membership.create({
        data: {
          userId: user.id,
          roomId: room.id,
          role: "MEMBER",
        },
        include: { room: true },
      })

      return NextResponse.json({ room: membership.room })
    } else {
      // Create new room
      if (!name) {
        return NextResponse.json({ message: "Room name is required" }, { status: 400 })
      }

      const room = await prisma.room.create({
        data: { name },
      })

      // Add creator as admin
      await prisma.membership.create({
        data: {
          userId: user.id,
          roomId: room.id,
          role: "ADMIN",
        },
      })

      // Create initial open round
      await prisma.round.create({
        data: {
          roomId: room.id,
          status: "OPEN",
        },
      })

      return NextResponse.json({ room })
    }
  } catch (error) {
    console.error("Create/join room error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
