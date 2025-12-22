import jwt from 'jsonwebtoken';
import { UnauthorizedError } from './errorHandler.js';
import User from '../models/user.js';

export const authenticateUser = async (req, res, next) => {
    try {
        let token;
        
        // Check for token in cookies first
        if (req.cookies && (req.cookies.token || req.cookies.jwt)) {
            token = req.cookies.token || req.cookies.jwt;
        }
        
        // Fallback: Check Authorization header for mobile browsers
        if (!token && req.headers.authorization) {
            const authHeader = req.headers.authorization;
            if (authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            }
        }
        
        if (!token) {
            throw new UnauthorizedError('Authentication required');
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find user by ID
        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            throw new UnauthorizedError('User not found');
        }

        // Add user to request object
        req.user = user;
        next();
    } catch (error) {
        console.error('Auth Error:', error.message);
        if (error.name === 'JsonWebTokenError') {
            next(new UnauthorizedError('Invalid token'));
        } else if (error.name === 'TokenExpiredError') {
            next(new UnauthorizedError('Token expired'));
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


