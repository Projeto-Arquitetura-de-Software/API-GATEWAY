import express from "express"

const app = express()
const PORT = process.env.PORT || 3002

app.use(express.json())

// Dados de exemplo
const orders = {
  101: { id: "101", userId: "1", product: "Livro de Programação", quantity: 1, status: "Pendente" },
  102: { id: "102", userId: "2", product: "Mouse Gamer", quantity: 2, status: "Enviado" },
}

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "order-service",
    port: PORT,
    timestamp: new Date().toISOString(),
  })
})

// Listar todos os pedidos
app.get("/", (req, res) => {
  console.log(`[Order Service:${PORT}] Listando pedidos`)
  res.json(Object.values(orders))
})

// Buscar pedido por ID
app.get("/:id", (req, res) => {
  const orderId = req.params.id
  const order = orders[orderId]

  if (order) {
    console.log(`[Order Service:${PORT}] Pedido encontrado: ${order.id}`)
    res.json(order)
  } else {
    console.log(`[Order Service:${PORT}] Pedido não encontrado: ${orderId}`)
    res.status(404).json({ error: "Pedido não encontrado" })
  }
})

// Criar novo pedido
app.post("/", (req, res) => {
  const { userId, product, quantity } = req.body

  if (!userId || !product || !quantity) {
    return res.status(400).json({
      error: "Dados inválidos",
      message: "userId, product e quantity são obrigatórios",
    })
  }

  const newId = (Math.max(0, ...Object.keys(orders).map(Number)) + 1).toString()
  const newOrder = { id: newId, userId, product, quantity, status: "Pendente" }
  orders[newId] = newOrder

  console.log(`[Order Service:${PORT}] Pedido criado: ${newId}`)
  res.status(201).json(newOrder)
})

app.listen(PORT, () => {
  console.log(`📦 Order Service rodando na porta ${PORT}`)
})
