import { type NextRequest, NextResponse } from "next/server"
import { requireAuth, requireRoomMembership } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { Decimal } from "@prisma/client/runtime/library"

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const roomId = searchParams.get("roomId")

    if (!roomId) {
      return NextResponse.json({ message: "Room ID is required" }, { status: 400 })
    }

    await requireRoomMembership(user.id, roomId)

    // Get current open round
    const openRound = await prisma.round.findFirst({
      where: { roomId, status: "OPEN" },
    })

    if (!openRound) {
      return NextResponse.json({ expenses: [] })
    }

    const expenses = await prisma.expense.findMany({
      where: { roomId, roundId: openRound.id },
      include: {
        payer: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ expenses })
  } catch (error) {
    console.error("Get expenses error:", error)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { roomId, title, amount, payerId, notes } = await request.json()

    if (!roomId || !title || !amount) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    await requireRoomMembership(user.id, roomId)

    const finalPayerId = payerId || user.id
    if (payerId && payerId !== user.id) {
      await requireRoomMembership(payerId, roomId)
    }

    // Get current open round
    let openRound = await prisma.round.findFirst({
      where: { roomId, status: "OPEN" },
    })

    // Create a new round if none exists
    if (!openRound) {
      openRound = await prisma.round.create({
        data: {
          roomId,
          status: "OPEN",
        },
      })
    }

    const expense = await prisma.expense.create({
      data: {
        roomId,
        roundId: openRound.id,
        payerId: finalPayerId, // Use finalPayerId instead of payerId
        title,
        amount: new Decimal(amount),
        notes,
        createdBy: user.id,
      },
      include: {
        payer: true,
      },
    })

    return NextResponse.json({ expense })
  } catch (error) {
    console.error("Create expense error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
