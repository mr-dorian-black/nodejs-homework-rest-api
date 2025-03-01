import { Schema, model } from "mongoose";
import { handleMongooseError } from "../helpers/index.js";
import Joi from "joi";

const subscriptionList = ["starter", "pro", "business"];

const user = new Schema(
  {
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
    },
    subscription: {
      type: String,
      enum: subscriptionList,
      default: "starter",
    },
    token: {
      type: String,
      default: null,
    },
    avatarURL: {
      type: String,
      required: true,
    },
    verify: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
      required: [true, "Verify token is required"],
    },
  },
  { versionKey: false, timestamps: true }
);

user.post("save", handleMongooseError);

export const userRegisterScheme = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({ "string.required": "missing required email field" }),
  password: Joi.string().required().messages({
    "string.required": "missing required password field",
  }),
});

export const userLoginScheme = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({ "string.required": "missing required email field" }),
  password: Joi.string().required().messages({
    "string.required": "missing required password field",
  }),
});

export const userSubscriptionScheme = Joi.object({
  subscription: Joi.string()
    .required()
    .valid(...subscriptionList),
});

export const verifyScheme = Joi.object({
  email: Joi.string()
    .required()
    .email()
    .messages({ "string.required": "missing required email field" }),
});

export const User = model("user", user);
