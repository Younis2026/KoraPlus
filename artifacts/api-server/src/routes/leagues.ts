import { Router, type IRouter } from "express";
import { ListLeaguesResponse } from "@workspace/api-zod";
import { leagues } from "../lib/mockData";

const router: IRouter = Router();

router.get("/leagues", async (_req, res): Promise<void> => {
  res.json(ListLeaguesResponse.parse(leagues));
});

export default router;
