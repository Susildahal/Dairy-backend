import { savemilk ,allmilk  ,updatemilk ,delatemilk} from "../controlllers/milk.js";
import express from "express"

const milkrouter = express.Router();
import { authenticateUser } from "../middleware/auth.js"

// Save milk data
milkrouter.post("/savemilk", authenticateUser, savemilk);
milkrouter.put("/updatemilk/:id", authenticateUser, updatemilk);
// Get all milk data
milkrouter.get("/allmilk", authenticateUser, allmilk);
milkrouter.delete("/:id", authenticateUser, delatemilk);




export default milkrouter;