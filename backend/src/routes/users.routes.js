import { Router } from "express";
import { addToHistory, getUserHistory, login, register, verifyToken } from "../controllers/user.controller.js";

const router = Router();

router.route("/login").post(login);

router.route("/register").post(register);

router.route("/verifyToken").post(verifyToken);

router.route("/add_to_activity").post(addToHistory);

router.route("/get_all_activity").get(getUserHistory);


export default router;
