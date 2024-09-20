import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'Gmail', // Or any email service provider (like SendGrid)
  auth: {
    user: process.env.EMAIL_ID, // Replace with your email
    pass: process.env.JWT_SECRET // Replace with your email password
  }
});

// Function to send email
export const sendEmail = async (to, subject, text) => {
  const mailOptions = {
    from: process.env.EMAIL_ID,
    to,
    subject,
    text
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.log('Error sending email:', error);
  }
};
