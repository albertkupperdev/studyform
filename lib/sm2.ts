import type { ReviewRating } from "@/types";

export interface CardState {
  ease_factor: number;
  interval_days: number;
  repetitions: number;
}

export interface SM2Result extends CardState {
  due_date: string;
}

const QUALITY: Record<ReviewRating, number> = {
  again: 0,
  hard: 2,
  good: 4,
  easy: 5,
};

export function applyReview(state: CardState, rating: ReviewRating): SM2Result {
  const quality = QUALITY[rating];
  let { ease_factor, interval_days, repetitions } = state;

  if (quality < 3) {
    repetitions = 0;
    interval_days = 1;
  } else {
    if (repetitions === 0) interval_days = 1;
    else if (repetitions === 1) interval_days = 6;
    else interval_days = Math.round(interval_days * ease_factor);

    ease_factor =
      ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    ease_factor = Math.max(1.3, ease_factor);
    repetitions += 1;
  }

  const due = new Date();
  due.setDate(due.getDate() + interval_days);
  const due_date = due.toISOString().split("T")[0];

  return { ease_factor, interval_days, repetitions, due_date };
}
