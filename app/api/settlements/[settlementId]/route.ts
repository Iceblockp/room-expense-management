import { type NextRequest, NextResponse } from "next/server"
import { requireAuth, requireRoomMembership } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"

export async function PUT(request: NextRequest, { params }: { params: { settlementId: string } }) {
  try {
    const user = await requireAuth()
    const { settlementId } = params
    const { status } = await request.json()

    if (!["PAID", "CONFIRMED"].includes(status)) {
      return NextResponse.json({ message: "Invalid status" }, { status: 400 })
    }

    const settlement = await prisma.settlement.findUnique({
      where: { id: settlementId },
      include: { round: true },
    })

    if (!settlement) {
      return NextResponse.json({ message: "Settlement not found" }, { status: 404 })
    }

    // Check if round is still open
    if (settlement.round.status !== "OPEN") {
      return NextResponse.json({ message: "Cannot update settlements in a cleared round" }, { status: 400 })
    }

    await requireRoomMembership(user.id, settlement.roomId)

    // Only the payer can mark as PAID, only the receiver can CONFIRM
    if (status === "PAID" && settlement.fromUserId !== user.id) {
      return NextResponse.json({ message: "Only the payer can mark settlement as paid" }, { status: 403 })
    }

    if (status === "CONFIRMED" && settlement.toUserId !== user.id) {
      return NextResponse.json({ message: "Only the receiver can confirm settlement" }, { status: 403 })
    }

    const updatedSettlement = await prisma.settlement.update({
      where: { id: settlementId },
      data: { status },
      include: {
        fromUser: true,
        toUser: true,
      },
    })

    // Check if all settlements in this round are confirmed
    const allSettlements = await prisma.settlement.findMany({
      where: { roomId: settlement.roomId, roundId: settlement.roundId },
    })

    const allConfirmed = allSettlements.every((s) => s.status === "CONFIRMED")

    if (allConfirmed && allSettlements.length > 0) {
      // Mark round as cleared and create new open round
      await prisma.round.update({
        where: { id: settlement.roundId },
        data: {
          status: "CLEARED",
          clearedAt: new Date(),
        },
      })

      await prisma.round.create({
        data: {
          roomId: settlement.roomId,
          status: "OPEN",
        },
      })
    }

    return NextResponse.json({ settlement: updatedSettlement })
  } catch (error) {
    console.error("Update settlement error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
