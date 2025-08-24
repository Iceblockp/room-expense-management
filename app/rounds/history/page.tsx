"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { Navigation } from "@/components/navigation"
import { RoomSelector } from "@/components/room-selector"
import { RoundHistoryCard } from "@/components/round-history-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { History, Calendar, Banknote, Receipt } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
import { formatMMK } from "@/lib/utils"

interface Round {
  id: string
  status: "OPEN" | "CLEARED"
  createdAt: string
  clearedAt?: string
  totalAmount: number
  _count: {
    expenses: number
  }
}

interface Room {
  id: string
  name: string
}

export default function RoundHistoryPage() {
  const [selectedRoomId, setSelectedRoomId] = useState<string>("")
  const [roomData, setRoomData] = useState<Room | null>(null)
  const [rounds, setRounds] = useState<Round[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (selectedRoomId) {
      fetchRoomData()
      fetchRounds()
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

  const fetchRounds = async () => {
    if (!selectedRoomId) return

    setIsLoading(true)
    try {
      const data = await apiClient.getRoundHistory(selectedRoomId)
      setRounds(data.rounds)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load round history",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const clearedRounds = rounds.filter((round) => round.status === "CLEARED")
  const currentRound = rounds.find((round) => round.status === "OPEN")
  const totalHistoricalAmount = clearedRounds.reduce((sum, round) => sum + round.totalAmount, 0)
  const totalHistoricalExpenses = clearedRounds.reduce((sum, round) => sum + round._count.expenses, 0)

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

            {/* Main History Content */}
            <div className="lg:col-span-3">
              {!selectedRoomId ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <History className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Select a Room</h3>
                    <p className="text-muted-foreground text-center">
                      Choose a room from the sidebar to view round history.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {/* Header */}
                  <div>
                    <h1 className="text-2xl font-bold">Round History</h1>
                    <p className="text-muted-foreground">{roomData?.name} • All Rounds</p>
                  </div>

                  {/* Summary Stats */}
                  <div className="grid md:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Rounds</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{rounds.length}</div>
                        <p className="text-xs text-muted-foreground">
                          {clearedRounds.length} cleared, {currentRound ? 1 : 0} current
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Historical Total</CardTitle>
                        <Banknote className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{formatMMK(totalHistoricalAmount)}</div>
                        <p className="text-xs text-muted-foreground">From cleared rounds</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{totalHistoricalExpenses}</div>
                        <p className="text-xs text-muted-foreground">Historical expenses</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average Round</CardTitle>
                        <History className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {clearedRounds.length > 0
                            ? formatMMK(totalHistoricalAmount / clearedRounds.length)
                            : formatMMK(0)}
                        </div>
                        <p className="text-xs text-muted-foreground">Per cleared round</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Rounds List */}
                  <div className="space-y-4">
                    {isLoading ? (
                      <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="animate-pulse h-32 bg-muted rounded-lg" />
                        ))}
                      </div>
                    ) : rounds.length === 0 ? (
                      <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                          <History className="h-12 w-12 text-muted-foreground mb-4" />
                          <h3 className="text-lg font-medium mb-2">No Rounds Yet</h3>
                          <p className="text-muted-foreground text-center">
                            This room doesn't have any rounds yet. Start by adding some expenses!
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      <>
                        {/* Current Round */}
                        {currentRound && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h2 className="text-lg font-semibold">Current Round</h2>
                              <Badge variant="secondary">Active</Badge>
                            </div>
                            <RoundHistoryCard round={currentRound} />
                          </div>
                        )}

                        {/* Historical Rounds */}
                        {clearedRounds.length > 0 && (
                          <div className="space-y-2">
                            <h2 className="text-lg font-semibold">Cleared Rounds</h2>
                            <div className="space-y-4">
                              {clearedRounds.map((round) => (
                                <RoundHistoryCard key={round.id} round={round} />
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
