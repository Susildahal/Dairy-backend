// Custom error handling middleware
import { StatusCodes } from 'http-status-codes';

class CustomError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

class BadRequestError extends CustomError {
  constructor(message) {
    super(message, StatusCodes.BAD_REQUEST);
  }
}

class NotFoundError extends CustomError {
  constructor(message) {
    super(message, StatusCodes.NOT_FOUND);
  }
}

class UnauthorizedError extends CustomError {
  constructor(message) {
    super(message, StatusCodes.UNAUTHORIZED);
  }
}

class ForbiddenError extends CustomError {
  constructor(message) {
    super(message, StatusCodes.FORBIDDEN);
  }
}

const errorHandlerMiddleware = (err, req, res, next) => {
  console.log('Error:', err);
  
  const defaultError = {
    statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    message: err.message || 'Something went wrong, please try again later'
  };

  if (err.name === 'ValidationError') {
    defaultError.statusCode = StatusCodes.BAD_REQUEST;
    defaultError.message = Object.values(err.errors)
      .map(item => item.message)
      .join(', ');
  }

  if (err.code && err.code === 11000) {
    defaultError.statusCode = StatusCodes.BAD_REQUEST;
    defaultError.message = `Duplicate value for ${Object.keys(err.keyValue)} field`;
  }

  res.status(defaultError.statusCode).json({ 
    success: false,
    error: defaultError.message 
  });
};

export {
  errorHandlerMiddleware,
  CustomError,
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError
};
