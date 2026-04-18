import { Request, Response } from "express";
import * as reviewService from "../services/reviewService";

export async function createReview(req: Request, res: Response): Promise<void> {
  const { orderId, rating, comment } = req.body;
  if (!Number.isInteger(orderId) || orderId <= 0) {
    res.status(400).json({ error: "Valid orderId is required" }); return;
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    res.status(400).json({ error: "Rating must be an integer between 1 and 5" }); return;
  }
  if (comment !== undefined && comment !== null && typeof comment !== "string") {
    res.status(400).json({ error: "Comment must be a string" }); return;
  }
  if (typeof comment === "string" && comment.length > 500) {
    res.status(400).json({ error: "Comment must be 500 characters or fewer" }); return;
  }
  const result = await reviewService.createReview(orderId, rating, comment ?? null);
  if ("error" in result) {
    res.status(result.error === "Order not found" ? 404 : 409).json({ error: result.error }); return;
  }
  res.status(201).json(result.review);
}

export async function listReviews(req: Request, res: Response): Promise<void> {
  const rating = req.query.rating !== undefined ? Number(req.query.rating) : undefined;
  const tableId = req.query.tableId !== undefined ? Number(req.query.tableId) : undefined;
  const from = typeof req.query.from === "string" ? req.query.from : undefined;
  const to = typeof req.query.to === "string" ? req.query.to : undefined;
  if (rating !== undefined && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
    res.status(400).json({ error: "Rating filter must be between 1 and 5" }); return;
  }
  if (tableId !== undefined && (!Number.isInteger(tableId) || tableId <= 0)) {
    res.status(400).json({ error: "tableId filter must be a positive integer" }); return;
  }
  const reviews = await reviewService.listReviews({ rating, tableId, from, to });
  res.json(reviews);
}
