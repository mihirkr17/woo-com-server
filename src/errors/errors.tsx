import { Request, Response } from "express";

const returnErrors = (err: any, req: Request, res: Response, next: any) => {
  res.status(err?.statusCode || 500).send({ message: err?.message, name: err?.name, statusCode: err?.statusCode, success: err?.success });
};

module.exports = returnErrors;
