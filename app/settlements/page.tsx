"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { Navigation } from "@/components/navigation"
import { RoomSelector } from "@/components/room-selector"
import { SettlementList } from "@/components/settlement-list"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CreditCard, Users, Banknote, AlertTriangle, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
import { useAuth } from "@/components/auth-provider"
import { formatMMK } from "@/lib/utils"

interface Settlement {
  id: string
  amount: string
  status: "PENDING" | "PAID" | "CONFIRMED"
  createdAt: string
  fromUser: {
    id: string
    name: string
    email: string
    image?: string
  }
  toUser: {
    id: string
    name: string
    email: string
    image?: string
  }
}

interface Member {
  id: string
  role: string
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

export default function SettlementsPage() {
  const { user } = useAuth()
  const [selectedRoomId, setSelectedRoomId] = useState<string>("")
  const [roomData, setRoomData] = useState<Room | null>(null)
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (selectedRoomId) {
      fetchRoomData()
      fetchSettlements()
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

  const fetchSettlements = async () => {
    if (!selectedRoomId) return

    setIsLoading(true)
    try {
      const data = await apiClient.getSettlements(selectedRoomId)
      setSettlements(data.settlements)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load settlements",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const generateSettlements = async () => {
    if (!selectedRoomId) return

    setIsGenerating(true)
    try {
      await apiClient.generateSettlements(selectedRoomId)

      await fetchSettlements()
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
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSettlementUpdated = () => {
    fetchSettlements()
  }

  const isAdmin = roomData?.memberships.find((m) => m.user.id === user?.id)?.role === "ADMIN"
  const pendingSettlements = settlements.filter((s) => s.status !== "CONFIRMED")
  const totalPendingAmount = pendingSettlements.reduce((sum, s) => sum + Number.parseFloat(s.amount), 0)
  const allSettled = settlements.length > 0 && pendingSettlements.length === 0

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

            {/* Main Settlements Content */}
            <div className="lg:col-span-3">
              {!selectedRoomId ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Select a Room</h3>
                    <p className="text-muted-foreground text-center">
                      Choose a room from the sidebar to manage settlements.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-2xl font-bold">Settlements</h1>
                      <p className="text-muted-foreground">{roomData?.name} • Current Round</p>
                    </div>
                    {isAdmin && settlements.length === 0 && (
                      <Button onClick={generateSettlements} disabled={isGenerating}>
                        {isGenerating ? "Generating..." : "Generate Settlements"}
                      </Button>
                    )}
                  </div>

                  {/* Status Alert */}
                  {allSettled && (
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        All settlements for this round have been completed! A new round will be created automatically.
                      </AlertDescription>
                    </Alert>
                  )}

                  {pendingSettlements.length > 0 && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        There are {pendingSettlements.length} pending settlement
                        {pendingSettlements.length !== 1 ? "s" : ""} totaling {formatMMK(totalPendingAmount)}.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Stats Cards */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Settlements</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{settlements.length}</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
                        <Banknote className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{formatMMK(totalPendingAmount)}</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {settlements.length > 0
                            ? Math.round(((settlements.length - pendingSettlements.length) / settlements.length) * 100)
                            : 0}
                          %
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Settlements List */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Current Round Settlements</CardTitle>
                      <CardDescription>
                        {settlements.length === 0
                          ? "No settlements generated yet. Generate settlements to balance expenses."
                          : "Track and manage settlement payments between room members."}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <div className="space-y-4">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="animate-pulse h-20 bg-muted rounded-lg" />
                          ))}
                        </div>
                      ) : (
                        <SettlementList settlements={settlements} onSettlementUpdated={handleSettlementUpdated} />
                      )}
                    </CardContent>
                  </Card>

                  {/* Instructions */}
                  {settlements.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>How Settlements Work</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm text-muted-foreground">
                        <p>
                          1. <strong>Pending:</strong> Settlement has been calculated but no action taken yet.
                        </p>
                        <p>
                          2. <strong>Paid:</strong> The person who owes money has marked it as paid.
                        </p>
                        <p>
                          3. <strong>Confirmed:</strong> The recipient has confirmed they received the payment.
                        </p>
                        <p>
                          4. Once all settlements are confirmed, the round will be cleared and a new one will start.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
