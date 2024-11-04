import cron from "node-cron";
import { User } from "../models/user.model.js";

const cleanupExpiredTokens = async () => {
  try {
    // Get the current time
    const now = new Date();

    // Find users with expired tokens
    const expiredUsers = await User.find({
      tokenExpiresAt: { $lte: now },
    });

    if (expiredUsers.length > 0) {
      // Remove tokens from expired users
      await User.updateMany(
        { _id: { $in: expiredUsers.map((user) => user._id) } },
        { $unset: { token: 1, tokenExpiresAt: 1 } }
      );
      console.log("Expired tokens cleaned up:", expiredUsers.length, "users");
    } else {
      console.log("No expired tokens to clean up");
    }
  } catch (error) {
    console.error("Error cleaning up expired tokens:", error);
  } 
};

// Schedule the cleanup job to run every hour
cron.schedule("*/1 * * * *", cleanupExpiredTokens); 

export default cleanupExpiredTokens;
