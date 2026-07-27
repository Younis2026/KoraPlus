import { Router, type IRouter } from "express";
import healthRouter from "./health";
import homeRouter from "./home";
import matchesRouter from "./matches";
import leaguesRouter from "./leagues";
import predictionsRouter from "./predictions";
import leaderboardRouter from "./leaderboard";
import newsRouter from "./news";
import profileRouter from "./profile";

const router: IRouter = Router();

router.use(healthRouter);
router.use(homeRouter);
router.use(matchesRouter);
router.use(leaguesRouter);
router.use(predictionsRouter);
router.use(leaderboardRouter);
router.use(newsRouter);
router.use(profileRouter);

export default router;
