import httpStatus from "http-status";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { Meeting } from "../models/meeting.model.js";
import { createSecretToken } from "../utils/SecretToken.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

const register = asyncHandler( async (req, res, next) => {
  try {
    const { name, username, password } = req.body;
    if (!username || !password || !name) {
      return res.status(400).json({ message: "All fields are required!!" });
    }

    const existingUser = await User.findOne({ username: username });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this username" });
    }


    const newUser = new User({ name, username, password });

    // const token = createSecretToken(newUser._id);
    // res.cookie("token", token, {
    //   withCredentials: true,
    //   httpOnly: false,
    // });

    await newUser.save();

    return res
      .status(httpStatus.CREATED)
      .json({ message: "User Registered!!", success: true, newUser });

  } catch (error) {
    throw new ApiError(500, `Something went wrong while registering the user ${error}`);
  }
});

const login = asyncHandler(async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "All fields are required!!" });
    }

    const user = await User.findOne({ username: username });
    if (!user) {
      return res.status(401).json({message: "Incorrect password or username"})
    }

    const auth = await bcrypt.compare(password, user.password);

    if (!auth) {
      return res.status(401).json({message: "Incorrect password or username"})
    }

    const token = createSecretToken(user._id);
    res.cookie("token", token, {
      withCredentials: true,
      httpOnly: false,
    });

    return res
      .status(httpStatus.OK)
      .json({ message: "User logged in successfully", success: true });
  } catch (error) {
    throw new ApiError(error.statusCode || 500, error.message || "Authentication failed");
  }
});

//token validation 
const verifyToken = asyncHandler(async(req, res) => { 
  const token = req.cookie.token;
  
  if(!token){
    return res.status(401).json({valid: false, message: "No token provided"})
  }

  try {
    const decodedToken = jwt.verify(token, process.env.TOKEN_KEY)

    if(!decodedToken){
      return res.status(401).json({ valid: false, message: 'Invalid or expired token' });
    }

    return res.status(200).json({ valid: true, message: 'Token is valid', decodedToken });

  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid token")
  }
})

const getUserHistory = async (req, res) => {
  const { token } = req.query;

  try {
    const user = await User.findOne({ token: token });
    const meetings = await Meeting.find({ user_id: user.username });
    res.json(meetings);
  } catch (e) {
    res.json({ message: `Something went wrong: ${e}` });
  }
};

const addToHistory = async (req, res) => {
  const { token, meeting_code } = req.body;

  try {
    const user = await User.findOne({ token: token });

    const newMeeting = new Meeting({
      user_id: user.username,
      meetingCode: meeting_code,
    });

    await newMeeting.save();
    res.status(httpStatus.CREATED).json({ message: "Added code to history!" });
  } catch (e) {
    res.json({ message: `Something went wrong: ${e}` });
  }
};

export { register, login, getUserHistory, addToHistory, verifyToken };
