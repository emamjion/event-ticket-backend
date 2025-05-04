import jwt from "jsonwebtoken";

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  //   console.log(authHeader);
  // Check if token exists
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: No token provided",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_TOKEN);
    req.user = decoded; // attach decoded data to request object
    next(); // proceed to the next middleware/route handler
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Invalid token",
    });
  }
};

export default verifyToken;
