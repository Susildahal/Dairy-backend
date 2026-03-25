import {saveSiteSettings ,getdata, update} from "../controlllers/sitesetting.js"
import express from "express"
import { authenticateUser, restrictTo } from "../middleware/auth.js";
const settingrouter =express.Router();


settingrouter.post("/", authenticateUser, restrictTo('admin'), saveSiteSettings);
settingrouter.get("/", authenticateUser, restrictTo('admin'), getdata);
settingrouter.put("/", authenticateUser, restrictTo('admin'), update);


export default settingrouter;