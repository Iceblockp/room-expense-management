"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { Navigation } from "@/components/navigation"
import { RoomSelector } from "@/components/room-selector"
import { ExpenseForm } from "@/components/expense-form"
import { ExpenseList } from "@/components/expense-list"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Receipt, Users, Banknote } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
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

interface Room {
  id: string
  name: string
  memberships: Member[]
}

export default function ExpensesPage() {
  const [selectedRoomId, setSelectedRoomId] = useState<string>("")
  const [roomData, setRoomData] = useState<Room | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (selectedRoomId) {
      fetchRoomData()
      fetchExpenses()
    }
  }, [selectedRoomId])

  const fetchRoomData = async () => {
    if (!selectedRoomId) return

    try {
      const data = await apiClient.getRoom(selectedRoomId)
      setRoomData(data.room)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load room data",
        variant: "destructive",
      })
    }
  }

  const fetchExpenses = async () => {
    if (!selectedRoomId) return

    setIsLoading(true)
    try {
      const data = await apiClient.getExpenses(selectedRoomId)
      setExpenses(data.expenses)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load expenses",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleExpenseChange = () => {
    fetchExpenses()
  }

  const totalAmount = expenses.reduce((sum, expense) => sum + Number.parseFloat(expense.amount), 0)
  const averagePerPerson = roomData ? totalAmount / roomData.memberships.length : 0

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Room Selector Sidebar */}
            <div className="lg:col-span-1">
              <RoomSelector selectedRoomId={selectedRoomId} onRoomSelect={setSelectedRoomId} />
            </div>

            {/* Main Expenses Content */}
            <div className="lg:col-span-3">
              {!selectedRoomId ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Select a Room</h3>
                    <p className="text-muted-foreground text-center">
                      Choose a room from the sidebar to manage expenses.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-2xl font-bold">Expenses</h1>
                      <p className="text-muted-foreground">{roomData?.name} • Current Round</p>
                    </div>
                    {roomData && (
                      <ExpenseForm
                        roomId={selectedRoomId}
                        members={roomData.memberships}
                        onExpenseAdded={handleExpenseChange}
                      />
                    )}
                  </div>

                  {/* Stats Cards */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{expenses.length}</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
                        <Banknote className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{formatMMK(totalAmount)}</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average Per Person</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{formatMMK(averagePerPerson)}</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Expenses List */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Current Round Expenses</CardTitle>
                      <CardDescription>
                        All expenses in the current round. You can edit or delete expenses you created.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <div className="space-y-4">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="animate-pulse h-20 bg-muted rounded-lg" />
                          ))}
                        </div>
                      ) : roomData ? (
                        <ExpenseList
                          expenses={expenses}
                          members={roomData.memberships}
                          onExpenseUpdated={handleExpenseChange}
                        />
                      ) : (
                        <p className="text-muted-foreground">Failed to load room data</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
