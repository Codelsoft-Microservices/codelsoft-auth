import AppError from "../utils/appError.js";

const sendErrorDev = (err, req, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    msg: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, req, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      msg: err.message,
    });
  } else {
    res.status(500).json({
      status: "error",
      msg: "Algo salió mal!",
    });
  }
};

const globalErrorMiddleware = (err, req, res, next) => {
  console.log(err);
  if (err instanceof AppError) {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || "error";
  }

  let error = err;

  if (process.env.NODE_ENV === "development") {
    return sendErrorDev(error, req, res);
  }

  error = { ...err };
  error.message = err.message;

  sendErrorProd(error, req, res);
};

export default globalErrorMiddleware;