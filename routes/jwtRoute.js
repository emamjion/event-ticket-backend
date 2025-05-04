// jwtRoute.js
import express from "express";
import jwt from "jsonwebtoken";

const jwtRouter = express.Router();

jwtRouter.post("/jwt", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Token payload — ekhane email diyechi. Dorkar hole aro fields add korte paro.
    const token = jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({
      success: true,
      message: "JWT token generated successfully",
      token,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to generate JWT token",
      error: error.message,
    });
  }
});

export default jwtRouter;







/** JWT routes example 
 * API method: POST
 * API: POST /api/jwt

request
{
  "email": "user@example.com"
}

response
{
  "success": true,
  "message": "JWT token generated successfully",
  "token": "eyJhbGciOi..."
}


*/
