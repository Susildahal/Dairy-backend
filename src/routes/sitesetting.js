import {saveSiteSettings ,getdata, update} from "../controlllers/sitesetting.js"
import express from "express"
const settingrouter =express.Router();


settingrouter.post("/", saveSiteSettings);
settingrouter.get("/", getdata);
settingrouter.put("/", update);


export default settingrouter;