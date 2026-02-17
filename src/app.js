import http from "node:http";
import Router from "./utils/router.js";
import taskRoutes from "./routes/taskRoutes.js";
import { getPathname, sendJSON } from "./utils/httpUtils.js";

const mainRouter = new Router();

mainRouter.get("/", (req, res) => {
  sendJSON(res, 200, {
    message: "API de Gerenciamento de Tarefas",
    version: "1.0.0",
    endpoints: {
      tasks: {
        list: "GET /tasks",
        getById: "GET /tasks/:id",
        create: "POST /tasks",
        update: "PUT /tasks/:id",
        delete: "DELETE /tasks/:id",
        complete: "PATCH /tasks/:id/complete",
      },
      import: "node src/import-csv.js <arquivo.csv>",
    },
  });
});

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  const pathname = getPathname(req.url);

  if (pathname.startsWith("/tasks")) {
    const taskPath = pathname.replace("/tasks", "") || "/";
    req.url =
      taskPath + (req.url.includes("?") ? "?" + req.url.split("?")[1] : "");

    const handler = taskRoutes.getHandler();
    handler(req, res);
    return;
  }

  if (pathname === "/") {
    const handler = mainRouter.getHandler();
    handler(req, res);
    return;
  }

  sendJSON(res, 404, {
    success: false,
    message: "Rota não encontrada",
  });
});

export default server;
