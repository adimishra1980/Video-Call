import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: [true, "Your username is required!!"],
  },
  password: {
    type: String,
    required: [true, "Your password is required!!"],
  },
});

userSchema.pre("save", async function () {
  this.password = await bcrypt.hash(this.password, 12);
});

const User = mongoose.model("User", userSchema);

export { User };
