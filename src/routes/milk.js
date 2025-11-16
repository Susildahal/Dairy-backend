import { savemilk ,allmilk  ,updatemilk} from "../controlllers/milk.js";
import express from "express"

const milkrouter = express.Router();
import { authenticateUser } from "../middleware/auth.js"

// Save milk data
milkrouter.post("/savemilk", authenticateUser, savemilk);
milkrouter.put("/updatemilk/:id", authenticateUser, savemilk);
// Get all milk data
milkrouter.get("/allmilk", authenticateUser, allmilk);




export default milkrouter;