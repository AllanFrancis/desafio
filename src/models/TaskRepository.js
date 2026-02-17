import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, "..", "data", "tasks.json");

class TaskRepository {
  async ensureDataFileExists() {
    try {
      await fs.access(DATA_FILE);
    } catch {
      const dataDir = path.dirname(DATA_FILE);
      await fs.mkdir(dataDir, { recursive: true });
      await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2), "utf-8");
    }
  }

  async readData() {
    try {
      const data = await fs.readFile(DATA_FILE, "utf-8");
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  }

  async writeData(tasks) {
    await fs.writeFile(DATA_FILE, JSON.stringify(tasks, null, 2), "utf-8");
  }

  async getAll() {
    return await this.readData();
  }

  async getById(id) {
    const tasks = await this.readData();
    return tasks.find((task) => task.id === id) || null;
  }

  async create(task) {
    const tasks = await this.readData();
    tasks.push(task);
    await this.writeData(tasks);
    return task;
  }

  async update(id, updates) {
    const tasks = await this.readData();
    const index = tasks.findIndex((task) => task.id === id);

    if (index === -1) {
      return null;
    }

    tasks[index] = {
      ...tasks[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    await this.writeData(tasks);
    return tasks[index];
  }

  async delete(id) {
    const tasks = await this.readData();
    const index = tasks.findIndex((task) => task.id === id);

    if (index === -1) {
      return false;
    }

    tasks.splice(index, 1);
    await this.writeData(tasks);
    return true;
  }

  async search(filters) {
    let tasks = await this.readData();

    if (filters.title) {
      const titleFilter = filters.title.toLowerCase();
      tasks = tasks.filter((task) =>
        task.title.toLowerCase().includes(titleFilter)
      );
    }

    if (filters.description) {
      const descFilter = filters.description.toLowerCase();
      tasks = tasks.filter((task) =>
        task.description.toLowerCase().includes(descFilter)
      );
    }

    if (filters.completed !== undefined) {
      const isCompleted =
        filters.completed === "true" || filters.completed === true;
      tasks = tasks.filter((task) =>
        isCompleted ? task.completed_at !== null : task.completed_at === null
      );
    }

    return tasks;
  }

  async toggleComplete(id) {
    const task = await this.getById(id);
    if (!task) return null;

    const completed_at =
      task.completed_at === null ? new Date().toISOString() : null;
    return await this.update(id, { completed_at });
  }

  async createMany(tasks) {
    const existingTasks = await this.readData();
    const newTasks = [...existingTasks, ...tasks];
    await this.writeData(newTasks);
    return tasks;
  }
}

export default new TaskRepository();
