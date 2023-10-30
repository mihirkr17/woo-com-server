export {};

declare global {
  namespace Express {
    interface Request {
      decoded: any;
      appUri: string;
    }
  }
}
