import { HttpError, sendMail } from "../helpers/index.js";
import { ctrlWrapper } from "../decorators/index.js";
import { User } from "../models/user.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import "dotenv/config";
import gravatar from "gravatar";
import path from "path";
import Jimp from "jimp";
import fs from "fs/promises";
import { nanoid } from "nanoid";

const { SECRET_KEY } = process.env;

const register = async (req, res) => {
  const { host } = req.headers;
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user) {
    throw HttpError(409, "Email in use");
  }
  const hashPassword = await bcrypt.hash(password, 10);
  const avatarURL = gravatar.url(email);
  const verificationToken = nanoid();
  const newUser = await User.create({
    ...req.body,
    password: hashPassword,
    avatarURL,
    verificationToken,
  });

  await sendMail({
    to: email,
    subject: "Verification",
    html: `Verification link: ${host}/users/verify/${verificationToken}`,
  });
  res.status(201).json({
    user: {
      email: newUser.email,
      subscription: newUser.subscription,
    },
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email, verify: true });
  if (!user) {
    throw HttpError(401, "Email or password is wrong");
  }
  const passwordCompare = await bcrypt.compare(password, user.password);
  if (!passwordCompare) {
    throw HttpError(401, "Email or password is wrong");
  }
  const payload = { id: user._id };
  const token = jwt.sign(payload, SECRET_KEY, {
    expiresIn: "23h",
  });

  await User.findByIdAndUpdate(user._id, { token });
  res.json({
    token,
    user: {
      email: user.email,
      subscription: user.subscription,
    },
  });
};

const current = async (req, res) => {
  const { email, subscription } = req.user;
  res.json({
    email,
    subscription,
  });
};

const logout = async (req, res) => {
  const { _id } = req.user;
  await User.findByIdAndUpdate(_id, { token: null });
  res.status(204).json();
};

const subscription = async (req, res) => {
  const { _id } = req.user;
  const { subscription } = req.body;
  const user = await User.findByIdAndUpdate(
    _id,
    { subscription },
    {
      new: true,
    }
  );

  res.json({ user: { email: user.email, subscription: user.subscription } });
};

const updateAvatar = async (req, res, next) => {
  const { _id } = req.user;
  console.log(req.file);
  if (!req.file) {
    throw HttpError(400, "missing file");
  }
  const { path: tempUpload, originalname } = req.file;
  const filename = `${_id}_${originalname}`;
  const resultUpload = path.resolve("public", "avatars", filename);
  await fs.rename(tempUpload, resultUpload);
  Jimp.read(resultUpload, (err, image) => {
    if (err) throw err;
    image.resize(250, 250).write(resultUpload);
  });
  const avatarURL = path.join("avatars", filename);
  await User.findByIdAndUpdate(_id, { avatarURL });
  res.json({ avatarURL });
};

const verification = async (req, res, next) => {
  const { verificationToken } = req.params;
  const user = await User.findOneAndUpdate(
    { verificationToken },
    { verificationToken: null, verify: true }
  );
  if (!user) {
    throw HttpError(404, "User not found");
  }
  res.json({ message: "Verification successful" });
};

const verify = async (req, res, next) => {
  const { host } = req.headers;
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw HttpError(404, "User not found");
  }
  const { verify, verificationToken } = user;
  if (verify) {
    throw HttpError(400, "Verification has already been passed");
  }
  await sendMail({
    to: email,
    subject: "Verification",
    html: `Verification link: ${host}/users/verify/${verificationToken}`,
  });
  res.json({
    message: "Verification email sent",
  });
};

export default {
  register: ctrlWrapper(register),
  login: ctrlWrapper(login),
  current: ctrlWrapper(current),
  logout: ctrlWrapper(logout),
  subscription: ctrlWrapper(subscription),
  updateAvatar: ctrlWrapper(updateAvatar),
  verification: ctrlWrapper(verification),
  verify: ctrlWrapper(verify),
};
