import jwt from "jsonwebtoken";

export const createToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET_TOKEN, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};
