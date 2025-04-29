import express, { Express, Request, Response } from 'express';

const app: Express = express();
const port = process.env.PORT || 3001; // Backend port

app.get('/', (req: Request, res: Response) => {
  res.send('Badass TCG Server is running!');
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
