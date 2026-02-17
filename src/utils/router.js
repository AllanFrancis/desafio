import { getPathname } from "./httpUtils.js";

class Router {
  constructor() {
    this.routes = {
      GET: [],
      POST: [],
      PUT: [],
      PATCH: [],
      DELETE: [],
    };
  }

  pathToRegex(path) {
    const regexPath = path
      .replace(/\//g, "\\/")
      .replace(/:([^/]+)/g, "([^/]+)");
    return new RegExp(`^${regexPath}$`);
  }

  extractParamNames(path) {
    const names = [];
    const matches = path.match(/:([^/]+)/g);
    if (matches) {
      matches.forEach((match) => {
        names.push(match.substring(1));
      });
    }
    return names;
  }

  get(path, handler) {
    this.routes.GET.push({
      pattern: this.pathToRegex(path),
      paramNames: this.extractParamNames(path),
      handler,
    });
  }

  post(path, ...handlers) {
    this.routes.POST.push({
      pattern: this.pathToRegex(path),
      paramNames: this.extractParamNames(path),
      handlers,
    });
  }

  put(path, ...handlers) {
    this.routes.PUT.push({
      pattern: this.pathToRegex(path),
      paramNames: this.extractParamNames(path),
      handlers,
    });
  }

  patch(path, handler) {
    this.routes.PATCH.push({
      pattern: this.pathToRegex(path),
      paramNames: this.extractParamNames(path),
      handler,
    });
  }

  delete(path, handler) {
    this.routes.DELETE.push({
      pattern: this.pathToRegex(path),
      paramNames: this.extractParamNames(path),
      handler,
    });
  }

  findRoute(method, pathname) {
    const routes = this.routes[method];
    if (!routes) return null;

    for (const route of routes) {
      const match = pathname.match(route.pattern);
      if (match) {
        const params = {};
        route.paramNames.forEach((name, index) => {
          params[name] = match[index + 1];
        });
        return { route, params, handlers: route.handlers || [route.handler] };
      }
    }
    return null;
  }

  getHandler() {
    return async (req, res) => {
      const method = req.method;
      const pathname = getPathname(req.url);

      const routeMatch = this.findRoute(method, pathname);

      if (!routeMatch) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: false,
            message: "Rota não encontrada",
          })
        );
        return;
      }

      req.params = routeMatch.params;

      try {
        for (const handler of routeMatch.handlers) {
          await new Promise((resolve, reject) => {
            const next = (err) => {
              if (err) reject(err);
              else resolve();
            };

            const result = handler(req, res, next);
            if (result && typeof result.then === "function") {
              result.then(() => resolve()).catch(reject);
            } else if (handler.length < 3) {
              resolve();
            }
          });
        }
      } catch (error) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: false,
            message: error.message || "Erro interno do servidor",
          })
        );
      }
    };
  }
}

export default Router;
