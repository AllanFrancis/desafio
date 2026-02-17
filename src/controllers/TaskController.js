import Task from "../models/Task.js";
import TaskRepository from "../models/TaskRepository.js";
import { parseJSON, getQueryParams, sendJSON } from "../utils/httpUtils.js";

class TaskController {
  jsonParser(req, res, next) {
    const contentType = req.headers["content-type"] || "";
    if (contentType.includes("application/json")) {
      parseJSON(req, (err, data) => {
        if (err) {
          sendJSON(res, 400, {
            success: false,
            message: "JSON inválido",
          });
          return;
        }
        req.body = data;
        next();
      });
    } else {
      req.body = {};
      next();
    }
  }

  async list(req, res) {
    try {
      const query = getQueryParams(req.url);
      const filters = {};

      if (query.title) filters.title = query.title;
      if (query.description) filters.description = query.description;
      if (query.completed !== undefined) filters.completed = query.completed;

      const tasks = await TaskRepository.search(filters);

      sendJSON(res, 200, {
        success: true,
        count: tasks.length,
        data: tasks,
      });
    } catch (error) {
      sendJSON(res, 500, {
        success: false,
        message: "Erro ao listar tarefas",
        error: error.message,
      });
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      const task = await TaskRepository.getById(id);

      if (!task) {
        sendJSON(res, 404, {
          success: false,
          message: "Tarefa não encontrada",
        });
        return;
      }

      sendJSON(res, 200, {
        success: true,
        data: task,
      });
    } catch (error) {
      sendJSON(res, 500, {
        success: false,
        message: "Erro ao buscar tarefa",
        error: error.message,
      });
    }
  }

  async create(req, res) {
    try {
      const { title, description } = req.body;

      const validationErrors = Task.validate({ title, description });
      if (validationErrors.length > 0) {
        sendJSON(res, 400, {
          success: false,
          message: "Dados inválidos",
          errors: validationErrors,
        });
        return;
      }

      const task = new Task({ title, description });
      await TaskRepository.create(task);

      sendJSON(res, 201, {
        success: true,
        message: "Tarefa criada com sucesso",
        data: task,
      });
    } catch (error) {
      sendJSON(res, 500, {
        success: false,
        message: "Erro ao criar tarefa",
        error: error.message,
      });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const { title, description } = req.body;

      const task = await TaskRepository.getById(id);
      if (!task) {
        sendJSON(res, 404, {
          success: false,
          message: "Tarefa não encontrada",
        });
        return;
      }

      const updates = {};
      if (title !== undefined) updates.title = title;
      if (description !== undefined) updates.description = description;

      const updatedTask = await TaskRepository.update(id, updates);

      sendJSON(res, 200, {
        success: true,
        message: "Tarefa atualizada com sucesso",
        data: updatedTask,
      });
    } catch (error) {
      sendJSON(res, 500, {
        success: false,
        message: "Erro ao atualizar tarefa",
        error: error.message,
      });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;

      const task = await TaskRepository.getById(id);
      if (!task) {
        sendJSON(res, 404, {
          success: false,
          message: "Tarefa não encontrada",
        });
        return;
      }

      await TaskRepository.delete(id);

      sendJSON(res, 200, {
        success: true,
        message: "Tarefa removida com sucesso",
      });
    } catch (error) {
      sendJSON(res, 500, {
        success: false,
        message: "Erro ao remover tarefa",
        error: error.message,
      });
    }
  }

  async toggleComplete(req, res) {
    try {
      const { id } = req.params;

      const task = await TaskRepository.getById(id);
      if (!task) {
        sendJSON(res, 404, {
          success: false,
          message: "Tarefa não encontrada",
        });
        return;
      }

      const updatedTask = await TaskRepository.toggleComplete(id);
      const isComplete = updatedTask.completed_at !== null;

      sendJSON(res, 200, {
        success: true,
        message: isComplete
          ? "Tarefa marcada como concluída"
          : "Tarefa marcada como não concluída",
        data: updatedTask,
      });
    } catch (error) {
      sendJSON(res, 500, {
        success: false,
        message: "Erro ao alterar status da tarefa",
        error: error.message,
      });
    }
  }
}

export default new TaskController();
