import { randomUUID } from "node:crypto";

class Task {
  constructor({ title, description }) {
    this.id = randomUUID();
    this.title = title;
    this.description = description;
    this.completed_at = null;
    this.created_at = new Date().toISOString();
    this.updated_at = new Date().toISOString();
  }

  static validate(taskData) {
    const errors = [];

    if (
      !taskData.title ||
      typeof taskData.title !== "string" ||
      taskData.title.trim() === ""
    ) {
      errors.push("Título é obrigatório e deve ser uma string");
    }

    if (
      !taskData.description ||
      typeof taskData.description !== "string" ||
      taskData.description.trim() === ""
    ) {
      errors.push("Descrição é obrigatória e deve ser uma string");
    }

    return errors;
  }
}

export default Task;
