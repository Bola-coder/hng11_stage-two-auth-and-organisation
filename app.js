const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const errorHandler = require("./middlewares/error");
const AppError = require("./utils/AppError");
const authRoutes = require("./routes/auth.route");
const userRoutes = require("./routes/user.route");
const organisationRoutes = require("./routes/organisation.route");

const app = express();

app.use(express.json());
app.use(morgan("dev"));

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());

app.get("/", (req, res) => {
  res.status(200).send("Welcome to HNG11 Backend Stage Two!");
});

app.get("/api/v1/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Welcome to HNG11 Backend Stage Two API v1!",
  });
});

app.use("/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/organisations", organisationRoutes);

app.all("*", (req, res, next) => {
  const error = new AppError(
    `Can't find ${req.originalUrl} using method ${req.method} on this server. Route not defined`,
    404
  );
  next(error);
});

app.use(errorHandler);

module.exports = app;
