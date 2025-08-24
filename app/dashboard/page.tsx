"use client"
import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { Navigation } from "@/components/navigation"
import { RoomSelector } from "@/components/room-selector"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, Receipt, Banknote, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
import { formatMMK } from "@/lib/utils"

interface Membership {
  id: string
  role: string
  user: {
    id: string
    name: string
    email: string
    image?: string
  }
}

interface Expense {
  id: string
  title: string
  amount: string
  payer: {
    id: string
    name: string
    email: string
    image?: string
  }
  createdAt: string
}

interface Round {
  id: string
  status: string
  expenses: Expense[]
  _count: {
    expenses: number
  }
}

interface Room {
  id: string
  name: string
  memberships: Membership[]
  rounds: Round[]
}

export default function DashboardPage() {
  const [selectedRoomId, setSelectedRoomId] = useState<string>("")
  const [roomData, setRoomData] = useState<Room | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [balances, setBalances] = useState<Record<string, number>>({})
  const { toast } = useToast()
  const [status, setStatus] = useState<string>("idle")

  useEffect(() => {
    if (selectedRoomId) {
      fetchRoomData()
    }
  }, [selectedRoomId])

  const fetchRoomData = async () => {
    if (!selectedRoomId) return

    setStatus("loading")
    setIsLoading(true)
    try {
      const data = await apiClient.getRoom(selectedRoomId)
      setRoomData(data.room)
      calculateBalances(data.room)
      setStatus("success")
    } catch (error) {
      setStatus("error")
      toast({
        title: "Error",
        description: "Failed to load room data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const calculateBalances = (room: Room) => {
    if (!room.rounds.length || !room.rounds[0].expenses.length) {
      setBalances({})
      return
    }

    const currentRound = room.rounds[0]
    const totalExpenses = currentRound.expenses.reduce((sum, expense) => sum + Number.parseFloat(expense.amount), 0)
    const fairShare = totalExpenses / room.memberships.length
    const newBalances: Record<string, number> = {}

    // Initialize all members with negative fair share (what they owe)
    room.memberships.forEach((membership) => {
      newBalances[membership.user.id] = -fairShare
    })

    // Add what each person paid
    currentRound.expenses.forEach((expense) => {
      newBalances[expense.payer.id] += Number.parseFloat(expense.amount)
    })

    setBalances(newBalances)
  }

  const generateSettlements = async () => {
    if (!selectedRoomId) return

    try {
      await apiClient.generateSettlements(selectedRoomId)

      toast({
        title: "Success",
        description: "Settlements generated successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to generate settlements",
        variant: "destructive",
      })
    }
  }

  const currentRound = roomData?.rounds?.[0]
  const totalExpenses = currentRound?.expenses.reduce((sum, expense) => sum + Number.parseFloat(expense.amount), 0) || 0
  const shouldClearRound = totalExpenses > 0 && Object.values(balances).some((balance) => Math.abs(balance) > 0.01)

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

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

            {/* Main Dashboard Content */}
            <div className="lg:col-span-3">
              {!selectedRoomId ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Select a Room</h3>
                    <p className="text-muted-foreground text-center">
                      Choose a room from the sidebar to view expenses and manage settlements.
                    </p>
                  </CardContent>
                </Card>
              ) : isLoading ? (
                <div className="space-y-4">
                  <div className="animate-pulse h-32 bg-muted rounded-lg" />
                  <div className="animate-pulse h-64 bg-muted rounded-lg" />
                </div>
              ) : roomData ? (
                <div className="space-y-6">
                  {/* Room Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-2xl font-bold">{roomData.name}</h1>
                      <p className="text-muted-foreground">Room ID: {roomData.id}</p>
                    </div>
                    {shouldClearRound && <Button onClick={generateSettlements}>Generate Settlements</Button>}
                  </div>

                  {/* Alerts */}
                  {shouldClearRound && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        This round has expenses that need to be settled. Generate settlements to balance accounts.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Stats Cards */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Members</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{roomData.memberships.length}</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Current Round Expenses</CardTitle>
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{currentRound?._count.expenses || 0}</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
                        <Banknote className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{formatMMK(totalExpenses)}</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Members and Balances */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Members & Balances</CardTitle>
                      <CardDescription>Current balance for each member in this round</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {roomData.memberships.map((membership) => {
                          const balance = balances[membership.user.id] || 0
                          const isPositive = balance > 0.01
                          const isNegative = balance < -0.01

                          return (
                            <div
                              key={membership.id}
                              className="flex items-center justify-between p-3 rounded-lg border"
                            >
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={membership.user.image || ""} alt={membership.user.name} />
                                  <AvatarFallback>
                                    <Users className="h-4 w-4" />
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium">{membership.user.name}</p>
                                    {membership.role === "ADMIN" && (
                                      <Badge variant="secondary">
                                        <Users className="h-3 w-3 mr-1" />
                                        Admin
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground">{membership.user.email}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p
                                  className={`font-medium ${
                                    isPositive
                                      ? "text-green-600"
                                      : isNegative
                                        ? "text-red-600"
                                        : "text-muted-foreground"
                                  }`}
                                >
                                  {isPositive ? "+" : ""}
                                  {formatMMK(balance)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {isPositive ? "Overpaid" : isNegative ? "Owes" : "Even"}
                                </p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Expenses */}
                  {currentRound?.expenses.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Recent Expenses</CardTitle>
                        <CardDescription>Latest expenses in the current round</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {currentRound.expenses.slice(0, 5).map((expense) => (
                            <div key={expense.id} className="flex items-center justify-between p-3 rounded-lg border">
                              <div>
                                <p className="font-medium">{expense.title}</p>
                                <p className="text-sm text-muted-foreground">
                                  Paid by {expense.payer.name} • {new Date(expense.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <p className="font-medium">{formatMMK(Number.parseFloat(expense.amount))}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <p className="text-muted-foreground">Failed to load room data</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
