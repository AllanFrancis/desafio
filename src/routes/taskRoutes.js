import Router from "../utils/router.js";
import TaskController from "../controllers/TaskController.js";

const router = new Router();

router.get("/", TaskController.list.bind(TaskController));
router.get("/:id", TaskController.getById.bind(TaskController));

router.post(
  "/",
  TaskController.jsonParser.bind(TaskController),
  TaskController.create.bind(TaskController)
);
router.post(
  "/import/csv",
  TaskController.multipartParser.bind(TaskController),
  TaskController.importCSV.bind(TaskController)
);

router.put(
  "/:id",
  TaskController.jsonParser.bind(TaskController),
  TaskController.update.bind(TaskController)
);

router.patch(
  "/:id/complete",
  TaskController.markAsCompleted.bind(TaskController)
);

router.delete("/:id", TaskController.delete.bind(TaskController));

export default router;
