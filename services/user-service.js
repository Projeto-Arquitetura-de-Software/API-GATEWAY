import express from "express"

const app = express()
const PORT = process.env.PORT || 3001

app.use(express.json())

// Dados de exemplo
const users = {
  1: { id: "1", name: "Alice Silva", email: "alice@example.com" },
  2: { id: "2", name: "Beto Costa", email: "beto@example.com" },
}

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "user-service",
    port: PORT,
    timestamp: new Date().toISOString(),
  })
})

// Listar todos os usuários
app.get("/", (req, res) => {
  console.log(`[User Service:${PORT}] Listando usuários`)
  res.json(Object.values(users))
})

// Buscar usuário por ID
app.get("/:id", (req, res) => {
  const userId = req.params.id
  const user = users[userId]

  if (user) {
    console.log(`[User Service:${PORT}] Usuário encontrado: ${user.name}`)
    res.json(user)
  } else {
    console.log(`[User Service:${PORT}] Usuário não encontrado: ${userId}`)
    res.status(404).json({ error: "Usuário não encontrado" })
  }
})

// Criar novo usuário
app.post("/", (req, res) => {
  const { name, email } = req.body

  if (!name || !email) {
    return res.status(400).json({
      error: "Dados inválidos",
      message: "Nome e email são obrigatórios",
    })
  }

  const newId = (Math.max(0, ...Object.keys(users).map(Number)) + 1).toString()
  const newUser = { id: newId, name, email }
  users[newId] = newUser

  console.log(`[User Service:${PORT}] Usuário criado: ${name}`)
  res.status(201).json(newUser)
})

app.listen(PORT, () => {
  console.log(`👤 User Service rodando na porta ${PORT}`)
})
