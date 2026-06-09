import * as http from "node:http";
import { DashboardController } from "./controller";

const PORT = process.env.PORT || 3001;

console.log(`[Executive Operations Hub] Backend API inicializando na porta ${PORT}...`);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "", `http://${req.headers.host}`);

    if (req.method === "OPTIONS") {
      res.writeHead(204, corsHeaders);
      res.end();
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/v1/dashboard/sync") {
      // Cria uma requisição mockada compatível com o Request do fetch API
      let body = "";
      req.on("data", chunk => body += chunk.toString());
      req.on("end", async () => {
        try {
          const fetchReq = new Request(url, {
            method: req.method,
            headers: req.headers as any,
            body: body ? body : null
          });
          const response = await DashboardController.syncDashboard(fetchReq);
          res.writeHead(response.status, { ...corsHeaders, "Content-Type": "application/json" });
          res.end(await response.text());
        } catch (err: any) {
          res.writeHead(500, corsHeaders);
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/v1/dashboard/productivity") {
      let body = "";
      req.on("data", chunk => body += chunk.toString());
      req.on("end", async () => {
        try {
          const fetchReq = new Request(url, {
            method: req.method,
            headers: req.headers as any,
            body: body ? body : null
          });
          const response = await DashboardController.syncProductivity(fetchReq);
          res.writeHead(response.status, { ...corsHeaders, "Content-Type": "application/json" });
          res.end(await response.text());
        } catch (err: any) {
          res.writeHead(500, corsHeaders);
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }

    if (req.method === "GET" && url.pathname === "/health") {
      res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "OK", version: "1.0.0" }));
      return;
    }

    res.writeHead(404, { ...corsHeaders, "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Rota não encontrada" }));
  } catch (err: any) {
    res.writeHead(500, corsHeaders);
    res.end(JSON.stringify({ error: "Erro interno do servidor", details: err.message }));
  }
});

server.listen(PORT, () => {
  console.log(`[Executive Operations Hub] Servidor rodando em http://localhost:${PORT}`);
});

