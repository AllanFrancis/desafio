import Task from "../models/Task.js";
import TaskRepository from "../models/TaskRepository.js";
import { parse } from "csv-parse/sync";
import {
  parseJSON,
  parseMultipart,
  getQueryParams,
  sendJSON,
} from "../utils/httpUtils.js";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

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

  multipartParser(req, res, next) {
    const contentType = req.headers["content-type"] || "";
    if (contentType.includes("multipart/form-data")) {
      parseMultipart(req, (err, result) => {
        if (err) {
          sendJSON(res, 400, {
            success: false,
            message: "Erro ao processar arquivo: " + err.message,
          });
          return;
        }
        req.file = result.file;
        next();
      });
    } else {
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

  async markAsCompleted(req, res) {
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

      const updatedTask = await TaskRepository.markAsCompleted(id);

      sendJSON(res, 200, {
        success: true,
        message: "Tarefa marcada como concluída",
        data: updatedTask,
      });
    } catch (error) {
      sendJSON(res, 500, {
        success: false,
        message: "Erro ao marcar tarefa como concluída",
        error: error.message,
      });
    }
  }

  async importCSV(req, res) {
    try {
      if (!req.file) {
        sendJSON(res, 400, {
          success: false,
          message: "Nenhum arquivo CSV foi enviado",
        });
        return;
      }

      if (!req.file.originalname.endsWith(".csv")) {
        sendJSON(res, 400, {
          success: false,
          message: "Apenas arquivos CSV são permitidos",
        });
        return;
      }

      const tempPath = path.join(os.tmpdir(), `csv-${Date.now()}.csv`);
      await fs.writeFile(tempPath, req.file.buffer);

      const fileContent = await fs.readFile(tempPath, "utf-8");

      const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      const errors = [];
      const tasks = [];

      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        const rowNumber = i + 2;

        if (!record.title || !record.description) {
          errors.push({
            row: rowNumber,
            message: "Campos title e description são obrigatórios",
          });
          continue;
        }

        const validationErrors = Task.validate({
          title: record.title,
          description: record.description,
        });

        if (validationErrors.length > 0) {
          errors.push({
            row: rowNumber,
            message: validationErrors.join(", "),
          });
          continue;
        }

        const task = new Task({
          title: record.title,
          description: record.description,
        });

        tasks.push(task);
      }

      await fs.unlink(tempPath);

      if (tasks.length > 0) {
        await TaskRepository.createMany(tasks);
      }

      const response = {
        success: true,
        message: "Importação concluída",
        imported: tasks.length,
      };

      if (errors.length > 0) {
        response.errors = errors;
      }

      sendJSON(res, 200, response);
    } catch (error) {
      sendJSON(res, 500, {
        success: false,
        message: "Erro ao importar CSV",
        error: error.message,
      });
    }
  }
}

export default new TaskController();
