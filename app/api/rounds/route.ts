import { type NextRequest, NextResponse } from "next/server"
import { requireAuth, requireRoomMembership } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const roomId = searchParams.get("roomId")

    if (!roomId) {
      return NextResponse.json({ message: "Room ID is required" }, { status: 400 })
    }

    await requireRoomMembership(user.id, roomId)

    const rounds = await prisma.round.findMany({
      where: { roomId },
      include: {
        _count: {
          select: { expenses: true },
        },
        expenses: {
          select: {
            id: true,
            title: true,
            amount: true,
            notes: true,
            createdAt: true,
            payer: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        settlements: {
          select: {
            id: true,
            amount: true,
            status: true,
            createdAt: true,
            fromUser: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
            toUser: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // Calculate total amount for each round
    const roundsWithTotals = rounds.map((round) => ({
      ...round,
      totalAmount: round.expenses.reduce((sum, expense) => sum + Number(expense.amount), 0),
    }))

    return NextResponse.json({ rounds: roundsWithTotals })
  } catch (error) {
    console.error("Get rounds error:", error)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { roomId } = await request.json()

    if (!roomId) {
      return NextResponse.json({ message: "Room ID is required" }, { status: 400 })
    }

    const membership = await requireRoomMembership(user.id, roomId)

    // Only admins can start new rounds
    if (membership.role !== "ADMIN") {
      return NextResponse.json({ message: "Only room admins can start new rounds" }, { status: 403 })
    }

    // Check if there's already an open round
    const existingOpenRound = await prisma.round.findFirst({
      where: { roomId, status: "OPEN" },
    })

    if (existingOpenRound) {
      return NextResponse.json({ message: "There is already an open round" }, { status: 400 })
    }

    const newRound = await prisma.round.create({
      data: {
        roomId,
        status: "OPEN",
      },
    })

    return NextResponse.json({ round: newRound })
  } catch (error) {
    console.error("Create round error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
