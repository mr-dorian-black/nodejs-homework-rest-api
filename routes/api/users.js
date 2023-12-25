import express from "express";
import validateBody from "../../decorators/validateBody.js";
import { authenticate, isEmptyBody } from "../../middlewares/index.js";
import {
  userLoginScheme,
  userRegisterScheme,
  userSubscriptionScheme,
  verifyScheme,
} from "../../models/user.js";
import usersController from "../../controllers/users-conroller.js";
import upload from "../../middlewares/upload.js";

const usersRouter = express.Router();

usersRouter.post(
  "/register",
  isEmptyBody(),
  validateBody(userRegisterScheme),
  usersController.register
);

usersRouter.post(
  "/login",
  isEmptyBody(),
  validateBody(userLoginScheme),
  usersController.login
);

usersRouter.get("/current", authenticate, usersController.current);

usersRouter.post("/logout", authenticate, usersController.logout);

usersRouter.patch(
  "/",
  authenticate,
  isEmptyBody(),
  validateBody(userSubscriptionScheme),
  usersController.subscription
);

usersRouter.patch(
  "/avatars",
  authenticate,
  upload.single("avatar"),
  usersController.updateAvatar
);

usersRouter.get("/verify/:verificationToken", usersController.verification);

usersRouter.post(
  "/verify",
  isEmptyBody("missing required field email"),
  validateBody(verifyScheme),
  usersController.verify
);

export default usersRouter;
