import nodemailer from "nodemailer";
import { User } from "../Models/user.model.js";

const resetCode = () => {
  let code = "";
  const length = 6;
  const characters = "0123456789";
  for (let i = 0; i < length; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
};

const email = async (req, res) => {
  const { to } = req.body;
  if (!to || to.trim() === "") {
    return res.status(400).json({ message: "Email is required" });
  }

  const user = await User.findOne({ email: to });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    auth: {
      user: `${process.env.ID}`,
      pass: `${process.env.KEY}`,
    },
  });

  const code = resetCode();

  async function info() {
    await transporter.sendMail({
      from: "Badminton App",
      to: `${to}`,
      subject: "Request For Password Reset",
      text: `To reset your password use this code ${code}`,
      html: `To reset your password use this code <h3> ${code}</h3>`,
    });
    return res.json({ otp: code, message: "Email is sent" });
  }

  info().catch(console.error);
};

export default email;
