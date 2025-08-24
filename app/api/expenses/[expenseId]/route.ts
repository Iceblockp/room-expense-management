import { type NextRequest, NextResponse } from "next/server"
import { requireAuth, requireRoomMembership } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { Decimal } from "@prisma/client/runtime/library"

export async function PUT(request: NextRequest, { params }: { params: { expenseId: string } }) {
  try {
    const user = await requireAuth()
    const { expenseId } = params
    const { title, amount, payerId, notes } = await request.json()

    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
      include: { round: true },
    })

    if (!expense) {
      return NextResponse.json({ message: "Expense not found" }, { status: 404 })
    }

    // Check if user created this expense
    if (expense.createdBy !== user.id) {
      return NextResponse.json({ message: "Can only edit expenses you created" }, { status: 403 })
    }

    // Check if round is still open
    if (expense.round.status !== "OPEN") {
      return NextResponse.json({ message: "Cannot edit expenses in a cleared round" }, { status: 400 })
    }

    await requireRoomMembership(user.id, expense.roomId)

    // Verify new payer is a member of the room
    if (payerId) {
      await requireRoomMembership(payerId, expense.roomId)
    }

    const updatedExpense = await prisma.expense.update({
      where: { id: expenseId },
      data: {
        ...(title && { title }),
        ...(amount && { amount: new Decimal(amount) }),
        ...(payerId && { payerId }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        payer: true,
      },
    })

    return NextResponse.json({ expense: updatedExpense })
  } catch (error) {
    console.error("Update expense error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { expenseId: string } }) {
  try {
    const user = await requireAuth()
    const { expenseId } = params

    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
      include: { round: true },
    })

    if (!expense) {
      return NextResponse.json({ message: "Expense not found" }, { status: 404 })
    }

    // Check if user created this expense
    if (expense.createdBy !== user.id) {
      return NextResponse.json({ message: "Can only delete expenses you created" }, { status: 403 })
    }

    // Check if round is still open
    if (expense.round.status !== "OPEN") {
      return NextResponse.json({ message: "Cannot delete expenses in a cleared round" }, { status: 400 })
    }

    await requireRoomMembership(user.id, expense.roomId)

    await prisma.expense.delete({
      where: { id: expenseId },
    })

    return NextResponse.json({ message: "Expense deleted successfully" })
  } catch (error) {
    console.error("Delete expense error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
