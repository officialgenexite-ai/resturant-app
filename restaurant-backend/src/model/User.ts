import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  address?: string;
  isEmailVerified: boolean;
  emailVerificationCode?: string;
  emailVerificationCodeExpiry?: Date;
  googleId?: string;
  authProvider: "local" | "google";
  role: "customer" | "admin";
  createdAt: Date;
  updatedAt: Date;
}
const UserSchema: Schema<IUser> = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      // Password sirf "local" (email/password) users ke liye required hai
      required: [
        function (this: IUser) {
          return this.authProvider === "local";
        },
        "Password is required",
      ],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    phone: {
      type: String,
      trim: true,
      // Google users pehli dafa phone nahi dete — baad mein profile complete kar sakte hain
      required: [
        function (this: IUser) {
          return this.authProvider === "local";
        },
        "Phone number is required",
      ],
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationCode: {
      type: String,
      select: false,
    },
    emailVerificationCodeExpiry: {
      type: Date,
      select: false,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true, // allows multiple docs with no googleId (null) without unique conflict
      select: false,
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
      required: true,
    },
       role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer",
    },
  },
  {
    timestamps: true,
  }
);

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
