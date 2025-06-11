import express from "express"
import { createProxyMiddleware, fixRequestBody } from "http-proxy-middleware"
import dotenv from "dotenv"
dotenv.config()

const app = express()
const PORT = process.env.PORT
var back_servers = [
  process.env.USER_SERVICE_TARGET_1,
  process.env.USER_SERVICE_TARGET_2,
]

// Configuração dos microsserviços com balanceamento de carga
const serviceConfigs = {
  users: {
    routePrefix: "/api/users",
    targets: back_servers,
    currentIndex: 0,
  },
  orders: {
    routePrefix: "/api/orders",
    targets: back_servers,
    currentIndex: 0,
  },
}

// Função para selecionar o próximo target usando Round Robin
function getNextTarget(serviceName) {
  const config = serviceConfigs[serviceName]
  if (!config || !config.targets || config.targets.length === 0) {
    console.error(`[Gateway] Nenhuma instância disponível para: ${serviceName}`)
    return null
  }

  const target = config.targets[config.currentIndex]
  config.currentIndex = (config.currentIndex + 1) % config.targets.length
  console.log(`[Gateway] Encaminhando ${serviceName} para: ${target}`)
  return target
}

// Middleware de logging
app.use((req, res, next) => {
  console.log(`[Gateway] ${req.method} ${req.originalUrl}`)
  next()
})

// Configurar proxy para cada serviço
Object.keys(serviceConfigs).forEach((serviceName) => {
  const config = serviceConfigs[serviceName]

  app.use(
    config.routePrefix,
    createProxyMiddleware({
      router: (req) => {
        const target = getNextTarget(serviceName)
        if (!target) {
          throw new Error(`Nenhum target disponível para ${serviceName}`)
        }
        return target
      },
      changeOrigin: true,
      pathRewrite: {
        [`^${config.routePrefix}`]: "",
      },
      onProxyReq: fixRequestBody,
      onError: (err, req, res) => {
        console.error(`[Gateway] Erro no proxy:`, err.message)
        if (res && !res.headersSent) {
          res.status(503).json({
            error: "Serviço temporariamente indisponível",
            message: err.message,
          })
        }
      },
      logLevel: "info",
    }),
  )
})

// Rota de health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    services: Object.keys(serviceConfigs),
  })
})

// Rota raiz
app.get("/", (req, res) => {
  res.json({
    message: "API Gateway funcionando!",
    version: "1.0.0",
    endpoints: {
      users: "/api/users",
      orders: "/api/orders",
      health: "/health",
    },
  })
})

// Middleware 404
app.use((req, res) => {
  if (!res.headersSent) {
    res.status(404).json({ error: "Rota não encontrada" })
  }
})

// Tratamento de erros global
app.use((err, req, res, next) => {
  console.error("[Gateway] Erro não tratado:", err)
  if (!res.headersSent) {
    res.status(500).json({ error: "Erro interno do servidor" })
  }
})

app.listen(PORT, () => {
  console.log(`🚀 API Gateway rodando na porta ${PORT}`)
  console.log("📋 Serviços configurados:")
  Object.entries(serviceConfigs).forEach(([name, config]) => {
    console.log(`   ${config.routePrefix} -> [${config.targets.join(", ")}]`)
  })
})
