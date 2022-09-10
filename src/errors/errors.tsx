import { Request, Response } from "express";

const errorHandlers = (err: any, req: Request, res: Response, next: any) => {
  res.status(500).send({ error: err?.message });
};

module.exports = errorHandlers;
