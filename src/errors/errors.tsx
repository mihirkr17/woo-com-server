import { Request, Response } from "express";

const errorHandlers = (error:any, req:Request, res:Response) => {
console.log(error);
  return res.status(500).send({ error: error?.message });
};

module.exports = errorHandlers