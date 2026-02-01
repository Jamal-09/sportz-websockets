import { Router } from "express";
import { db } from "../db/db.js";
import { commentary } from "../db/schema.js";
import { matchIdParamSchema } from "../validation/matches.js";
import { createCommentarySchema } from "../validation/commentary.js";

export const commentaryRouter = Router({ mergeParams: true });

import { listCommentaryQuerySchema } from "../validation/commentary.js";
import { desc, eq } from "drizzle-orm";

const MAX_LIMIT = 100;

commentaryRouter.get("/", async (req, res) => {
  try {
    const paramResult = matchIdParamSchema.safeParse({ id: req.params.id });
    if (!paramResult.success) {
      return res
        .status(400)
        .json({ error: "Invalid matchId", details: paramResult.error.issues });
    }
    const matchId = paramResult.data.id;

    const queryResult = listCommentaryQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      return res
        .status(400)
        .json({ error: "Invalid query", details: queryResult.error.issues });
    }
    const limit = Math.min(queryResult.data.limit ?? 10, MAX_LIMIT);

    const data = await db
      .select()
      .from(commentary)
      .where(eq(commentary.matchId, matchId))
      .orderBy(desc(commentary.createdAt))
      .limit(limit);

    res.status(200).json({ data });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch commentary", details: err.message });
  }
});

commentaryRouter.post("/", async (req, res) => {
  try {
    const paramResult = matchIdParamSchema.safeParse({ id: req.params.id });

    if (!paramResult.success) {
      return res
        .status(400)
        .json({ error: "Invalid matchId", details: paramResult.error.issues });
    }
    const matchId = paramResult.data.id;

    const bodyResult = createCommentarySchema.safeParse(req.body);

    if (!bodyResult.success) {
      return res.status(400).json({
        error: "Invalid commentary payload",
        details: bodyResult.error.issues,
      });
    }
    const { minutes, ...rest } = bodyResult.data;

    const [inserted] = await db
      .insert(commentary)
      .values({
        matchId,
        minutes,
        ...rest,
      })
      .returning();

    if (res.app.locals.broadcastCommentary) {
      res.app.locals.broadcastCommentary(inserted.matchId, inserted);
    }
    res.status(201).json({ data: inserted });
  } catch (err) {
    console.log(err);

    res
      .status(500)
      .json({ error: "Failed to add commentary", details: err.message });
  }
});
