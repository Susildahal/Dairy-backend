import jwt from 'jsonwebtoken';
import { UnauthorizedError } from './errorHandler.js';
import User from '../models/user.js';



export const authenticateUser = async (req, res, next) => {
  try {
   const token =
      req.cookies?.token ||
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : null);

        console.log(token)

    if (!token) {
      throw new UnauthorizedError("Authentication required");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      throw new UnauthorizedError("User not found");
    }

    req.user = user;
    next();

  } catch (error) {
    if (error.name === "TokenExpiredError") {
      next(new UnauthorizedError("Token expired"));
    } else if (error.name === "JsonWebTokenError") {
      next(new UnauthorizedError("Invalid token"));
    } else {
      next(error);
    }
  }
};


// Middleware to require admin access
export const requireAdmin = async (req, res, next) => {
    try {
        // Check if user is authenticated first
        if (!req.user) {
            throw new UnauthorizedError('Authentication required');
        }

        // Check if user is admin
        if (!req.user.isAdmin) {
            throw new UnauthorizedError('Admin access required');
        }

        next();
    } catch (error) {
        next(error);
    }
};


