import express from "express";
import { matchRouter } from "./routes/matches.js";
const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello from the Express server");
});

app.use("/matches", matchRouter);

const PORT = 8000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
