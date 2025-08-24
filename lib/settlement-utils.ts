import { prisma } from "./prisma"
import { Decimal } from "@prisma/client/runtime/library"

export async function calculateSettlements(roomId: string, roundId: string) {
  // Get all expenses for this round
  const expenses = await prisma.expense.findMany({
    where: { roomId, roundId },
    include: { payer: true },
  })

  // Get all room members
  const memberships = await prisma.membership.findMany({
    where: { roomId },
    include: { user: true },
  })

  if (memberships.length === 0) return []

  // Calculate total expenses
  const totalAmount = expenses.reduce((sum, expense) => sum.add(expense.amount), new Decimal(0))

  // Calculate fair share per person
  const fairShare = totalAmount.div(memberships.length)

  // Calculate each person's balance (what they paid - what they owe)
  const balances = new Map<string, Decimal>()

  // Initialize all members with negative fair share (what they owe)
  memberships.forEach((membership) => {
    balances.set(membership.userId, fairShare.neg())
  })

  // Add what each person paid
  expenses.forEach((expense) => {
    const currentBalance = balances.get(expense.payerId) || new Decimal(0)
    balances.set(expense.payerId, currentBalance.add(expense.amount))
  })

  // Generate settlements
  const settlements: Array<{
    fromUserId: string
    toUserId: string
    amount: Decimal
  }> = []

  const creditors: Array<{ userId: string; amount: Decimal }> = []
  const debtors: Array<{ userId: string; amount: Decimal }> = []

  // Separate creditors (positive balance) and debtors (negative balance)
  balances.forEach((balance, userId) => {
    if (balance.gt(0.01)) {
      // They are owed money
      creditors.push({ userId, amount: balance })
    } else if (balance.lt(-0.01)) {
      // They owe money
      debtors.push({ userId, amount: balance.abs() })
    }
  })

  // Create settlements to balance everyone out
  let creditorIndex = 0
  let debtorIndex = 0

  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const creditor = creditors[creditorIndex]
    const debtor = debtors[debtorIndex]

    const settlementAmount = Decimal.min(creditor.amount, debtor.amount)

    if (settlementAmount.gt(0.01)) {
      settlements.push({
        fromUserId: debtor.userId,
        toUserId: creditor.userId,
        amount: settlementAmount,
      })
    }

    creditor.amount = creditor.amount.sub(settlementAmount)
    debtor.amount = debtor.amount.sub(settlementAmount)

    if (creditor.amount.lte(0.01)) creditorIndex++
    if (debtor.amount.lte(0.01)) debtorIndex++
  }

  return settlements
}
