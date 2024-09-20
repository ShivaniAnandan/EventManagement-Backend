import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { validationResult } from 'express-validator';

// Register a new user
export const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password, role} = req.body;

  try {
    const user = new User({ name, email, password, role });
    await user.save();

    // Create JWT token
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({ token, user });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message});
  }
};

// Login an existing user
// export const login = async (req, res) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     return res.status(400).json({ errors: errors.array() });
//   }

//   const { email, password } = req.body;

//   try {
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(400).json({ message: 'Invalid credentials' });
//     }

//     const isMatch = await user.comparePassword(password);
//     if (!isMatch) {
//       return res.status(400).json({ message: 'Invalid credentials' });
//     }

//     // Create JWT token
//     const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

//     res.json({ token, user });
//   } catch (error) {
//     res.status(500).json({ message: 'Server Error' });
//   }
// };

export const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Set token in cookie
    res.cookie('token', token, {
      httpOnly: true, // Helps to prevent XSS attacks
      secure: process.env.NODE_ENV === 'production', // Use HTTPS in production
      maxAge: 3600000, // 1 hour in milliseconds
    });

    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' , error: error.message});
  }
};

export const getAllUser = async(req,res)=>{
  try {
     const allusers = await User.find({},{password:0,_id:0,createdAt:0,updatedAt:0})
     res.status(200).send({
      message:"users Fetched Successfully",
      allusers
     })
  } catch (error) {
      res.status(500).send({
          message:"Internal Server Error",
          error:error.message
      })
  }
}

export const forgetPassword = async (req, res) => {
  try {
      const { email } = req.body;
      let user = await User.findOne({ email });
      
      if (user) {
          // Generate JWT token with expiration time
          const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: '15m' });

          const resetLink = `${process.env.ResetUrl}/reset-password/${token}`;

          const transporter = nodemailer.createTransport({
              service: "gmail",
              auth: {
                  user: process.env.EMAIL_ID,
                  pass: process.env.JWT_SECRET,
              }
          });

          const mailOptions = {
              from: process.env.EMAIL_ID,
              to: user.email,
              subject: "Password Reset Link",
              html: `
                  <p> Dear ${user.name}, </p>
                  <p> Sorry to hear you’re having trouble logging into your account. We got a message that you forgot your password. If this was you, you can get right back into your account or reset your password now. </p>
                  <p> Click the following link to reset your password: <a href="${resetLink}">${resetLink}</a> </p>
                  <p> If you didn’t request a login link or a password reset, you can ignore this message. </p>
                  <p> Only people who know your account password or click the login link in this email can log into your account. </p>
              `
          };

          transporter.sendMail(mailOptions, (error, info) => {
              if (error) {
                  console.log(error);
                  return res.status(500).send({ message: "Failed to send the password reset mail" });
              }
              console.log("Password reset email sent: " + info.response);
              res.status(201).send({ message: "Password reset mail sent successfully" });
          });
      } else {
          res.status(400).send({ message: `User with ${email} does not exist` });
      }
  } catch (error) {
      console.log(error);
      res.status(500).send({ message: "Internal Server Error" });
  }
};


export const resetPassword = async (req, res) => {
  try {
      const { token } = req.params;

      // Verify JWT token
      jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
          if (err) {
              return res.status(400).send({ message: "Invalid or expired token" });
          }

          // Find the user by email from the decoded token
          const user = await User.findOne({ email: decoded.email });

          if (!user) {
              return res.status(400).send({ message: "User not found" });
          }

          // Check if newPassword is provided
          if (req.body.newPassword) {
              const newPassword = req.body.newPassword;
              user.password = newPassword;
              await user.save();
              res.status(201).send({ message: "Your new password has been updated" });
          } else {
              res.status(400).send({ message: "New password not provided" });
          }
      });
  } catch (error) {
      console.log(error);
      res.status(500).send({ message: "Internal Server Error" });
  }
};
