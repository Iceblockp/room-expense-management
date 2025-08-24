"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowRight, Check, Clock, User, CheckCircle } from "lucide-react"
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

interface SettlementListProps {
  settlements: Settlement[]
  onSettlementUpdated: () => void
}

export function SettlementList({ settlements, onSettlementUpdated }: SettlementListProps) {
  const { user } = useAuth()
  const [updatingSettlement, setUpdatingSettlement] = useState<string | null>(null)
  const { toast } = useToast()

  const updateSettlementStatus = async (settlementId: string, status: "PAID" | "CONFIRMED") => {
    setUpdatingSettlement(settlementId)
    try {
      await apiClient.updateSettlement(settlementId, status)

      onSettlementUpdated()
      toast({
        title: "Success",
        description: status === "PAID" ? "Settlement marked as paid" : "Settlement confirmed",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update settlement",
        variant: "destructive",
      })
    } finally {
      setUpdatingSettlement(null)
    }
  }

  const getStatusBadge = (status: Settlement["status"]) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      case "PAID":
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            <Check className="h-3 w-3 mr-1" />
            Paid
          </Badge>
        )
      case "CONFIRMED":
        return (
          <Badge variant="default" className="bg-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Confirmed
          </Badge>
        )
    }
  }

  const getActionButton = (settlement: Settlement) => {
    const isFromUser = user?.id === settlement.fromUser.id
    const isToUser = user?.id === settlement.toUser.id
    const isUpdating = updatingSettlement === settlement.id

    if (settlement.status === "CONFIRMED") {
      return null
    }

    if (settlement.status === "PENDING" && isFromUser) {
      return (
        <Button size="sm" onClick={() => updateSettlementStatus(settlement.id, "PAID")} disabled={isUpdating}>
          {isUpdating ? "Updating..." : "Mark as Paid"}
        </Button>
      )
    }

    if (settlement.status === "PAID" && isToUser) {
      return (
        <Button size="sm" onClick={() => updateSettlementStatus(settlement.id, "CONFIRMED")} disabled={isUpdating}>
          {isUpdating ? "Confirming..." : "Confirm Receipt"}
        </Button>
      )
    }

    return null
  }

  if (settlements.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CheckCircle className="h-12 w-12 text-green-600 mb-4" />
          <h3 className="text-lg font-medium mb-2">All Settled Up!</h3>
          <p className="text-muted-foreground text-center">
            No settlements needed for the current round. Everyone is even!
          </p>
        </CardContent>
      </Card>
    )
  }

  const pendingSettlements = settlements.filter((s) => s.status !== "CONFIRMED")
  const confirmedSettlements = settlements.filter((s) => s.status === "CONFIRMED")

  return (
    <div className="space-y-6">
      {pendingSettlements.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Pending Settlements</h3>
          {pendingSettlements.map((settlement) => (
            <Card key={settlement.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    {/* From User */}
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={settlement.fromUser.image || ""} alt={settlement.fromUser.name} />
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{settlement.fromUser.name}</p>
                        <p className="text-xs text-muted-foreground">Owes</p>
                      </div>
                    </div>

                    {/* Arrow and Amount */}
                    <div className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <div className="text-center">
                        <p className="text-lg font-semibold">{formatMMK(Number.parseFloat(settlement.amount))}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>

                    {/* To User */}
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={settlement.toUser.image || ""} alt={settlement.toUser.name} />
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{settlement.toUser.name}</p>
                        <p className="text-xs text-muted-foreground">Receives</p>
                      </div>
                    </div>
                  </div>

                  {/* Status and Action */}
                  <div className="flex items-center gap-3">
                    {getStatusBadge(settlement.status)}
                    {getActionButton(settlement)}
                  </div>
                </div>

                {/* Instructions */}
                {settlement.status === "PENDING" && user?.id === settlement.fromUser.id && (
                  <Alert className="mt-3">
                    <AlertDescription>
                      You owe {formatMMK(Number.parseFloat(settlement.amount))} to {settlement.toUser.name}. Mark as
                      paid once you've sent the money.
                    </AlertDescription>
                  </Alert>
                )}

                {settlement.status === "PAID" && user?.id === settlement.toUser.id && (
                  <Alert className="mt-3">
                    <AlertDescription>
                      {settlement.fromUser.name} has marked this payment as sent. Confirm once you've received
                      {formatMMK(Number.parseFloat(settlement.amount))}.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {confirmedSettlements.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Completed Settlements</h3>
          {confirmedSettlements.map((settlement) => (
            <Card key={settlement.id} className="opacity-75">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    {/* From User */}
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={settlement.fromUser.image || ""} alt={settlement.fromUser.name} />
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{settlement.fromUser.name}</p>
                        <p className="text-xs text-muted-foreground">Paid</p>
                      </div>
                    </div>

                    {/* Arrow and Amount */}
                    <div className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <div className="text-center">
                        <p className="text-lg font-semibold">{formatMMK(Number.parseFloat(settlement.amount))}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>

                    {/* To User */}
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={settlement.toUser.image || ""} alt={settlement.toUser.name} />
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{settlement.toUser.name}</p>
                        <p className="text-xs text-muted-foreground">Received</p>
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-3">{getStatusBadge(settlement.status)}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
