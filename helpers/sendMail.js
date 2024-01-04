import "dotenv/config";
import nodemailer from "nodemailer";

const { META_PASS, META_USER } = process.env;

const metaConfig = {
  host: "smtp.meta.ua",
  port: 465,
  secure: true,
  auth: {
    user: META_USER,
    pass: META_PASS,
  },
};

const transport = nodemailer.createTransport(metaConfig);

const sendMail = async (data) => {
  const email = { ...data, from: META_USER };
  await transport.sendMail(email);
  return true;
};

export default sendMail;
