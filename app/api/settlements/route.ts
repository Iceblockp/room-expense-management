import { type NextRequest, NextResponse } from "next/server"
import { requireAuth, requireRoomMembership } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { calculateSettlements } from "@/lib/settlement-utils"

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
      return NextResponse.json({ settlements: [] })
    }

    const settlements = await prisma.settlement.findMany({
      where: { roomId, roundId: openRound.id },
      include: {
        fromUser: true,
        toUser: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ settlements })
  } catch (error) {
    console.error("Get settlements error:", error)
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

    // Only admins can generate settlements
    if (membership.role !== "ADMIN") {
      return NextResponse.json({ message: "Only room admins can generate settlements" }, { status: 403 })
    }

    // Get current open round
    const openRound = await prisma.round.findFirst({
      where: { roomId, status: "OPEN" },
    })

    if (!openRound) {
      return NextResponse.json({ message: "No open round found" }, { status: 400 })
    }

    // Clear existing settlements for this round
    await prisma.settlement.deleteMany({
      where: { roomId, roundId: openRound.id },
    })

    // Calculate new settlements
    const calculatedSettlements = await calculateSettlements(roomId, openRound.id)

    // Create settlement records
    const settlements = await Promise.all(
      calculatedSettlements.map((settlement) =>
        prisma.settlement.create({
          data: {
            roomId,
            roundId: openRound.id,
            fromUserId: settlement.fromUserId,
            toUserId: settlement.toUserId,
            amount: settlement.amount,
            status: "PENDING",
          },
          include: {
            fromUser: true,
            toUser: true,
          },
        }),
      ),
    )

    return NextResponse.json({ settlements })
  } catch (error) {
    console.error("Generate settlements error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
