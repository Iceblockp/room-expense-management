import axios, { type AxiosInstance } from "axios"

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: "/api",
      headers: {
        "Content-Type": "application/json",
      },
    })

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("auth-token")
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      },
    )

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Clear invalid token
          localStorage.removeItem("auth-token")
          window.location.href = "/auth/signin"
        }
        return Promise.reject(error)
      },
    )
  }

  // Auth methods
  async login(email: string, password: string) {
    const response = await this.client.post("/auth/login", { email, password })
    return response.data
  }

  async register(name: string, email: string, password: string) {
    const response = await this.client.post("/auth/register", { name, email, password })
    return response.data
  }

  async getMe() {
    const response = await this.client.get("/auth/me")
    return response.data
  }

  async logout() {
    const response = await this.client.post("/auth/logout")
    return response.data
  }

  // Room methods
  async getRooms() {
    const response = await this.client.get("/rooms")
    return response.data
  }

  async getRoom(roomId: string) {
    const response = await this.client.get(`/rooms/${roomId}`)
    return response.data
  }

  async createRoom(name: string) {
    const response = await this.client.post("/rooms", { name })
    return response.data
  }

  async joinRoom(joinCode: string) {
    const response = await this.client.post("/rooms", { joinCode })
    return response.data
  }

  // Expense methods
  async getExpenses(roomId: string) {
    const response = await this.client.get(`/expenses?roomId=${roomId}`)
    return response.data
  }

  async createExpense(data: {
    roomId: string
    title: string
    amount: number
    payerId: string
    notes?: string
  }) {
    const response = await this.client.post("/expenses", data)
    return response.data
  }

  async updateExpense(
    expenseId: string,
    data: {
      title: string
      amount: number
      payerId: string
      notes?: string
    },
  ) {
    const response = await this.client.put(`/expenses/${expenseId}`, data)
    return response.data
  }

  async deleteExpense(expenseId: string) {
    const response = await this.client.delete(`/expenses/${expenseId}`)
    return response.data
  }

  // Settlement methods
  async getSettlements(roomId: string) {
    const response = await this.client.get(`/settlements?roomId=${roomId}`)
    return response.data
  }

  async generateSettlements(roomId: string) {
    const response = await this.client.post("/settlements", { roomId })
    return response.data
  }

  async updateSettlement(settlementId: string, status: "PAID" | "CONFIRMED") {
    const response = await this.client.put(`/settlements/${settlementId}`, { status })
    return response.data
  }

  // Round methods
  async getRoundHistory(roomId: string) {
    const response = await this.client.get(`/rounds?roomId=${roomId}`)
    return response.data
  }

  async clearRound(roomId: string) {
    const response = await this.client.post("/rounds", { roomId, action: "clear" })
    return response.data
  }
}

export const apiClient = new ApiClient()
