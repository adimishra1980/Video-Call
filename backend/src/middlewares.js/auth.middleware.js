// import jwt from "jsonwebtoken";
// import { User } from "../models/user.model.js";

// const authenticateUser = async (req, res, next) => {
//   try {
//     const token = req.cookies.token; // Get the token from cookies

//     if (!token) {
//       return res.status(401).json({ message: "Authentication required" });
//     }

//     // Verify the token
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     // Find the user and attach it to req.user
//     const user = await User.findById(decoded.id).select("-password"); // Exclude password
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     req.user = user; // Attach user to request object
//     next(); // Proceed to the next middleware or route handler
//   } catch (error) {
//     res.status(401).json({ message: "Invalid or expired token" });
//   }
// };

// export {authenticateUser}