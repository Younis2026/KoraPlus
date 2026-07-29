import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import homeRouter from "./home";
import matchesRouter from "./matches";
import leaguesRouter from "./leagues";
import predictionsRouter from "./predictions";
import leaderboardRouter from "./leaderboard";
import newsRouter from "./news";
import profileRouter from "./profile";
import adminRouter from "./admin";
import socialRouter from "./social";

const router: IRouter = Router();

router.use(authRouter);
router.use(healthRouter);
router.use(homeRouter);
router.use(matchesRouter);
router.use(leaguesRouter);
router.use(predictionsRouter);
router.use(leaderboardRouter);
router.use(newsRouter);
router.use(profileRouter);
router.use(adminRouter);
router.use(socialRouter);

export default router;
