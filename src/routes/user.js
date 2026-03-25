import {saveUser ,loginUser ,getUser ,getme  ,deleteUser ,logoutUser ,islogin  ,editUser ,getbyid ,updatestatus ,updateBothStatus, getUsers }  from "../controlllers/user.js"
import express from "express"
const userrouter = express.Router();
import {authenticateUser} from "../middleware/auth.js"


userrouter.post("/register",authenticateUser, saveUser);
userrouter.post("/login", loginUser);
userrouter.get("/user-all",authenticateUser, getUser);
userrouter.get("/", authenticateUser, getUsers);
userrouter.get("/me", authenticateUser, getme);
userrouter.delete("/user/:id", authenticateUser, deleteUser);
userrouter.post("/user/logout", authenticateUser, logoutUser);
userrouter.post("/user/islogin", authenticateUser, islogin);
userrouter.put("/:id", authenticateUser, editUser);
userrouter.get("/:id", authenticateUser, getbyid);
userrouter.patch("/:id", authenticateUser, updatestatus);
userrouter.patch("/both/:id", authenticateUser, updateBothStatus);

export default userrouter;
