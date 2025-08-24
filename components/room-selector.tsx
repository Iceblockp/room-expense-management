"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Users, Receipt } from "lucide-react"
import { useRooms, useCreateRoom, useJoinRoom } from "@/hooks/use-api"

interface Room {
  id: string
  name: string
  createdAt: string
  _count: {
    memberships: number
    expenses: number
  }
}

interface RoomSelectorProps {
  selectedRoomId?: string
  onRoomSelect: (roomId: string) => void
}

export function RoomSelector({ selectedRoomId, onRoomSelect }: RoomSelectorProps) {
  const { data: roomsData, isLoading } = useRooms()
  const createRoomMutation = useCreateRoom()
  const joinRoomMutation = useJoinRoom()

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isJoinOpen, setIsJoinOpen] = useState(false)
  const [newRoomName, setNewRoomName] = useState("")
  const [joinCode, setJoinCode] = useState("")

  const rooms = roomsData?.rooms?.map((membership: any) => membership.room) || []

  // Auto-select first room if none selected
  if (!selectedRoomId && rooms.length > 0) {
    onRoomSelect(rooms[0].id)
  }

  const createRoom = async () => {
    if (!newRoomName.trim()) return

    try {
      const result = await createRoomMutation.mutateAsync(newRoomName)
      onRoomSelect(result.room.id)
      setNewRoomName("")
      setIsCreateOpen(false)
    } catch (error) {
      // Error handling is done in the hook
    }
  }

  const joinRoom = async () => {
    if (!joinCode.trim()) return

    try {
      const result = await joinRoomMutation.mutateAsync(joinCode)
      onRoomSelect(result.room.id)
      setJoinCode("")
      setIsJoinOpen(false)
    } catch (error) {
      // Error handling is done in the hook
    }
  }

  if (isLoading) {
    return <div className="animate-pulse h-32 bg-muted rounded-lg" />
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Your Rooms</h2>
        <div className="flex gap-2">
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Room
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Room</DialogTitle>
                <DialogDescription>Create a new room to manage expenses with your roommates.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="roomName">Room Name</Label>
                  <Input
                    id="roomName"
                    placeholder="Enter room name"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                  />
                </div>
                <Button onClick={createRoom} className="w-full" disabled={createRoomMutation.isPending}>
                  {createRoomMutation.isPending ? "Creating..." : "Create Room"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isJoinOpen} onOpenChange={setIsJoinOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                Join Room
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Join Existing Room</DialogTitle>
                <DialogDescription>Enter the room code to join an existing room.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="joinCode">Room Code</Label>
                  <Input
                    id="joinCode"
                    placeholder="Enter room code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                  />
                </div>
                <Button onClick={joinRoom} className="w-full" disabled={joinRoomMutation.isPending}>
                  {joinRoomMutation.isPending ? "Joining..." : "Join Room"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {rooms.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <p className="text-muted-foreground mb-4">No rooms found. Create or join a room to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {rooms.map((room: Room) => (
            <Card
              key={room.id}
              className={`cursor-pointer transition-colors ${
                selectedRoomId === room.id ? "ring-2 ring-primary" : "hover:bg-accent"
              }`}
              onClick={() => onRoomSelect(room.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{room.name}</h3>
                    <p className="text-sm text-muted-foreground">Room ID: {room.id}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="secondary">
                      <Users className="h-3 w-3 mr-1" />
                      {room._count.memberships}
                    </Badge>
                    <Badge variant="outline">
                      <Receipt className="h-3 w-3 mr-1" />
                      {room._count.expenses}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
