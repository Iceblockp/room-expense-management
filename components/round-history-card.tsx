"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronUp, Calendar, Banknote, Receipt, Users, CheckCircle } from "lucide-react"
import { formatMMK } from "@/lib/utils"

interface Expense {
  id: string
  title: string
  amount: string
  notes?: string
  createdAt: string
  payer: {
    id: string
    name: string
    email: string
    image?: string
  }
}

interface Settlement {
  id: string
  amount: string
  status: string
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

interface Round {
  id: string
  status: "OPEN" | "CLEARED"
  createdAt: string
  clearedAt?: string
  totalAmount: number
  _count: {
    expenses: number
  }
  expenses?: Expense[]
  settlements?: Settlement[]
}

interface RoundHistoryCardProps {
  round: Round
}

export function RoundHistoryCard({ round }: RoundHistoryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getDuration = () => {
    if (!round.clearedAt) return "Ongoing"
    const start = new Date(round.createdAt)
    const end = new Date(round.clearedAt)
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    return `${days} day${days !== 1 ? "s" : ""}`
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Round {round.id.slice(-8)}
              {round.status === "CLEARED" && (
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Cleared
                </Badge>
              )}
              {round.status === "OPEN" && (
                <Badge variant="secondary">
                  <Calendar className="h-3 w-3 mr-1" />
                  Current
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {formatDate(round.createdAt)} - {round.clearedAt ? formatDate(round.clearedAt) : "Present"} •{" "}
              {getDuration()}
            </CardDescription>
          </div>
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        </div>
      </CardHeader>

      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{round._count.expenses}</p>
              <p className="text-xs text-muted-foreground">Expenses</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Banknote className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{formatMMK(round.totalAmount)}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </div>
          {round.settlements && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{round.settlements.length}</p>
                <p className="text-xs text-muted-foreground">Settlements</p>
              </div>
            </div>
          )}
        </div>

        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleContent className="space-y-4">
            {/* Expenses */}
            {round.expenses && round.expenses.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Expenses</h4>
                <div className="space-y-2">
                  {round.expenses.map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={expense.payer.image || ""} alt={expense.payer.name} />
                          <AvatarFallback>
                            <Users className="h-3 w-3" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{expense.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {expense.payer.name} • {formatDate(expense.createdAt)}
                          </p>
                          {expense.notes && <p className="text-xs text-muted-foreground mt-1">{expense.notes}</p>}
                        </div>
                      </div>
                      <p className="font-medium">{formatMMK(Number.parseFloat(expense.amount))}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Settlements */}
            {round.settlements && round.settlements.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Settlements</h4>
                <div className="space-y-2">
                  {round.settlements.map((settlement) => (
                    <div key={settlement.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={settlement.fromUser.image || ""} alt={settlement.fromUser.name} />
                            <AvatarFallback>
                              <Users className="h-3 w-3" />
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{settlement.fromUser.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">→</span>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={settlement.toUser.image || ""} alt={settlement.toUser.name} />
                            <AvatarFallback>
                              <Users className="h-3 w-3" />
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{settlement.toUser.name}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{formatMMK(Number.parseFloat(settlement.amount))}</p>
                        <Badge
                          variant={settlement.status === "CONFIRMED" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {settlement.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
}
