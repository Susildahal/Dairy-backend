import { savemilk, getAdminTotal ,allmilk ,dailyuserhistory  ,getUserTotal ,getTotalMonth} from "../controlllers/milk.js";
import express from "express"

const milkrouter = express.Router();
import { authenticateUser } from "../middleware/auth.js"

// Save milk data
milkrouter.post("/savemilk", authenticateUser, savemilk);

// Get all milk data
milkrouter.get("/allmilk", authenticateUser, allmilk);
milkrouter.get("/dailyuserhistory", authenticateUser, dailyuserhistory);

// Get admin total for a specific month
milkrouter.get("/admin-total", authenticateUser, getAdminTotal);
milkrouter.get("/usermonthly", authenticateUser, getUserTotal);
milkrouter.get("/total-month", authenticateUser, getTotalMonth);

export default milkrouter;