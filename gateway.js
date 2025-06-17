import express from "express";
import { createProxyMiddleware, fixRequestBody } from "http-proxy-middleware";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const backendServers = [
  process.env.BACKEND_SERVICE_URL_1,
  process.env.BACKEND_SERVICE_URL_2, 
].filter(Boolean); 

const serviceConfigs = {
  products: {
    routePrefix: "/api/products", 
    targets: backendServers,
    currentIndex: 0,
  },
};

function getNextTarget(serviceName) {
  const config = serviceConfigs[serviceName];
  if (!config || !config.targets || config.targets.length === 0) {
    console.error(`[Gateway] Nenhuma instância de backend disponível para: ${serviceName}`);
    return null;
  }

  const target = config.targets[config.currentIndex];
  config.currentIndex = (config.currentIndex + 1) % config.targets.length;
  console.log(`[Gateway] Encaminhando requisição para: ${target}`);
  return target;
}

app.use((req, res, next) => {
  console.log(`[Gateway] Recebida: ${req.method} ${req.originalUrl}`);
  next();
});

Object.keys(serviceConfigs).forEach((serviceName) => {
  const config = serviceConfigs[serviceName];

  app.use(
    config.routePrefix,
    createProxyMiddleware({
      router: (req) => {
        const target = getNextTarget(serviceName);
        if (!target) {
          throw new Error(`Nenhum backend disponível para ${serviceName}`);
        }
        return target;
      },
      changeOrigin: true,
      onProxyReq: fixRequestBody,
      onError: (err, req, res) => {
        console.error(`[Gateway] Erro no proxy:`, err.message);
        if (res && !res.headersSent) {
          res.status(503).json({
            error: "Serviço de backend temporariamente indisponível",
            message: err.message,
          });
        }
      },
      logLevel: "info",
    })
  );
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", gateway: "online" });
});

app.use((req, res) => {
  if (!res.headersSent) {
    res.status(404).json({ error: "Rota não encontrada no API Gateway" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 API Gateway rodando na porta ${PORT}`);
  if (backendServers.length > 0) {
    console.log("-> Redirecionando rotas para:", backendServers);
  } else {
    console.warn("⚠️ Atenção: Nenhuma URL de serviço de backend foi configurada nas variáveis de ambiente.");
  }
});
