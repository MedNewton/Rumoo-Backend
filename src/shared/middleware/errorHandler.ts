import type { ErrorHandler } from "hono";

export const errorHandler: ErrorHandler = (err, c) => {
  const isDev = process.env.NODE_ENV === "development";

  if (isDev) {
    console.error(err);
  } else {
    console.error(err.message);
  }

  const status = "status" in err && typeof err.status === "number" ? err.status : 500;

  return c.json(
    {
      error: status === 500 ? "Internal server error" : err.message,
    },
    status as any
  );
};
