"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"

// Query keys
export const queryKeys = {
  rooms: ["rooms"] as const,
  room: (roomId: string) => ["rooms", roomId] as const,
  expenses: (roomId: string) => ["expenses", roomId] as const,
  settlements: (roomId: string) => ["settlements", roomId] as const,
  roundHistory: (roomId: string) => ["rounds", roomId] as const,
}

// Room hooks
export function useRooms() {
  return useQuery({
    queryKey: queryKeys.rooms,
    queryFn: () => apiClient.getRooms(),
  })
}

export function useRoom(roomId: string) {
  return useQuery({
    queryKey: queryKeys.room(roomId),
    queryFn: () => apiClient.getRoom(roomId),
    enabled: !!roomId,
  })
}

export function useCreateRoom() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (name: string) => apiClient.createRoom(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms })
      toast({
        title: "Success",
        description: "Room created successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create room",
        variant: "destructive",
      })
    },
  })
}

export function useJoinRoom() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (joinCode: string) => apiClient.joinRoom(joinCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms })
      toast({
        title: "Success",
        description: "Joined room successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to join room",
        variant: "destructive",
      })
    },
  })
}

// Expense hooks
export function useExpenses(roomId: string) {
  return useQuery({
    queryKey: queryKeys.expenses(roomId),
    queryFn: () => apiClient.getExpenses(roomId),
    enabled: !!roomId,
  })
}

export function useCreateExpense() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (data: {
      roomId: string
      title: string
      amount: number
      payerId: string
      notes?: string
    }) => apiClient.createExpense(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses(variables.roomId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.room(variables.roomId) })
      toast({
        title: "Success",
        description: "Expense added successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to add expense",
        variant: "destructive",
      })
    },
  })
}

export function useUpdateExpense() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({
      expenseId,
      roomId,
      ...data
    }: {
      expenseId: string
      roomId: string
      title: string
      amount: number
      payerId: string
      notes?: string
    }) => apiClient.updateExpense(expenseId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses(variables.roomId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.room(variables.roomId) })
      toast({
        title: "Success",
        description: "Expense updated successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update expense",
        variant: "destructive",
      })
    },
  })
}

export function useDeleteExpense() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ expenseId, roomId }: { expenseId: string; roomId: string }) => apiClient.deleteExpense(expenseId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses(variables.roomId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.room(variables.roomId) })
      toast({
        title: "Success",
        description: "Expense deleted successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete expense",
        variant: "destructive",
      })
    },
  })
}

// Settlement hooks
export function useSettlements(roomId: string) {
  return useQuery({
    queryKey: queryKeys.settlements(roomId),
    queryFn: () => apiClient.getSettlements(roomId),
    enabled: !!roomId,
  })
}

export function useGenerateSettlements() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (roomId: string) => apiClient.generateSettlements(roomId),
    onSuccess: (_, roomId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settlements(roomId) })
      toast({
        title: "Success",
        description: "Settlements generated successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to generate settlements",
        variant: "destructive",
      })
    },
  })
}

export function useUpdateSettlement() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({
      settlementId,
      roomId,
      status,
    }: {
      settlementId: string
      roomId: string
      status: "PAID" | "CONFIRMED"
    }) => apiClient.updateSettlement(settlementId, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settlements(variables.roomId) })
      toast({
        title: "Success",
        description: "Settlement updated successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update settlement",
        variant: "destructive",
      })
    },
  })
}

// Round history hooks
export function useRoundHistory(roomId: string) {
  return useQuery({
    queryKey: queryKeys.roundHistory(roomId),
    queryFn: () => apiClient.getRoundHistory(roomId),
    enabled: !!roomId,
  })
}
