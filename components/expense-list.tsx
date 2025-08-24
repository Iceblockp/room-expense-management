"use client"

import type React from "react"
import { apiClient } from "@/lib/api-client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Edit, Trash2, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import { formatMMK } from "@/lib/utils"

interface Expense {
  id: string
  title: string
  amount: string
  notes?: string
  createdAt: string
  createdBy: string
  payer: {
    id: string
    name: string
    email: string
    image?: string
  }
}

interface Member {
  id: string
  user: {
    id: string
    name: string
    email: string
  }
}

interface ExpenseListProps {
  expenses: Expense[]
  members: Member[]
  onExpenseUpdated: () => void
}

export function ExpenseList({ expenses, members, onExpenseUpdated }: ExpenseListProps) {
  const { user } = useAuth()
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null)
  const [title, setTitle] = useState("")
  const [amount, setAmount] = useState("")
  const [payerId, setPayerId] = useState("")
  const [notes, setNotes] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const openEditDialog = (expense: Expense) => {
    setEditingExpense(expense)
    setTitle(expense.title)
    setAmount(expense.amount)
    setPayerId(expense.payer.id)
    setNotes(expense.notes || "")
  }

  const closeEditDialog = () => {
    setEditingExpense(null)
    setTitle("")
    setAmount("")
    setPayerId("")
    setNotes("")
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingExpense) return

    if (!title.trim() || !amount || !payerId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    const amountNum = Number.parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      await apiClient.updateExpense(editingExpense.id, {
        title: title.trim(),
        amount: amountNum,
        payerId,
        notes: notes.trim() || undefined,
      })

      closeEditDialog()
      onExpenseUpdated()
      toast({
        title: "Success",
        description: "Expense updated successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update expense",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingExpense) return

    setIsLoading(true)
    try {
      await apiClient.deleteExpense(deletingExpense.id)

      setDeletingExpense(null)
      onExpenseUpdated()
      toast({
        title: "Success",
        description: "Expense deleted successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete expense",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (expenses.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground mb-4">No expenses in the current round yet.</p>
          <p className="text-sm text-muted-foreground">Add your first expense to get started!</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {expenses.map((expense) => {
          const canEdit = user?.id === expense.createdBy

          return (
            <Card key={expense.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium">{expense.title}</h3>
                      {canEdit && <Badge variant="secondary">Your expense</Badge>}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={expense.payer.image || ""} alt={expense.payer.name} />
                          <AvatarFallback>
                            <User className="h-3 w-3" />
                          </AvatarFallback>
                        </Avatar>
                        <span>Paid by {expense.payer.name}</span>
                      </div>
                      <span>•</span>
                      <span>{new Date(expense.createdAt).toLocaleDateString()}</span>
                    </div>

                    {expense.notes && <p className="text-sm text-muted-foreground mt-2">{expense.notes}</p>}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right mr-4">
                      <p className="text-lg font-semibold">{formatMMK(Number.parseFloat(expense.amount))}</p>
                    </div>

                    {canEdit && (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(expense)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeletingExpense(expense)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingExpense} onOpenChange={(open) => !open && closeEditDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription>Update the expense details.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                placeholder="e.g., Groceries, Utilities, Dinner"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-amount">Amount *</Label>
              <Input
                id="edit-amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-payer">Who Paid? *</Label>
              <Select value={payerId} onValueChange={setPayerId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select who paid for this expense" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.user.id} value={member.user.id}>
                      {member.user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes (Optional)</Label>
              <Textarea
                id="edit-notes"
                placeholder="Add any additional details..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={closeEditDialog} className="flex-1 bg-transparent">
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? "Updating..." : "Update Expense"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingExpense} onOpenChange={(open) => !open && setDeletingExpense(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingExpense?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isLoading}>
              {isLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
