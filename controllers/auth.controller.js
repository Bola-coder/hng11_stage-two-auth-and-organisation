const { body, validationResult } = require("express-validator");
const User = require("./../models/user.model");
const Organisation = require("./../models/organisation.model");
const AppError = require("./../utils/AppError");
const catchAsync = require("./../utils/catchAsync");
const bcrypt = require("bcryptjs");
const { signJWTToken } = require("./../utils/jwt");
const {
  encryptString,
  compareEncryptedString,
} = require("../utils/encryption");

// Register a new user
// POST /auth/register
// Access: Public
const register = catchAsync(async (req, res, next) => {
  // Inline validation rules
  await body("email").isEmail().withMessage("Invalid email format").run(req);
  await body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .run(req);
  await body("firstName")
    .notEmpty()
    .withMessage("First name is required")
    .run(req);
  await body("lastName")
    .notEmpty()
    .withMessage("Last name is required")
    .run(req);
  await body("phone").optional().run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }

  const { email, password, firstName, lastName, phone } = req.body;

  const salt = await bcrypt.genSalt(12);
  const hashedPassword = encryptString(password, salt);

  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    return res.status(422).json({
      errors: [
        {
          field: "email",
          message: `user with email ${email} already exists`,
        },
      ],
    });
  }

  const user = await User.create({
    email,
    password: hashedPassword,
    firstName,
    lastName,
    phone,
  });

  if (!user) {
    return res.status(400).json({
      status: "Bad request",
      message: "Registration unsuccessful",
      statusCode: 400,
    });
  }

  // Remove the password from the user object
  user.password = undefined;

  const token = signJWTToken(user);

  // Create an organisation for the user after signup
  const userOrganisationName = `${user.firstName}'s Organisation`;
  const organisation = await Organisation.create({
    name: userOrganisationName,
    ownerId: user.userId,
  });

  if (!organisation) {
    return res.status(400).json({
      status: "Bad request",
      message: "Registration unsuccessful",
      statusCode: 400,
    });
  }

  res.status(201).json({
    status: "success",
    message: "Registration successful",
    data: {
      accessToken: token,
      user: {
        userId: user.userId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
      },
    },
  });
});

// Login a user
// POST /auth/login
// Access: Public
const login = catchAsync(async (req, res, next) => {
  // Inline validation rules
  await body("email").isEmail().withMessage("Invalid email format").run(req);
  await body("password")
    .notEmpty()
    .withMessage("Password is required")
    .run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }

  const { email, password } = req.body;

  const user = await User.findOne({
    where: { email },
    attributes: { include: ["password"] },
  });
  if (!user) {
    return res.status(401).json({
      status: "Bad request",
      message: "Authentication failed",
      statusCode: 401,
    });
  }

  const isPasswordCorrect = await compareEncryptedString(
    password,
    user.password
  );
  if (!isPasswordCorrect) {
    return res.status(401).json({
      status: "Bad request",
      message: "Authentication failed",
      statusCode: 401,
    });
  }

  // Remove the password from the user object
  user.password = undefined;

  const token = signJWTToken(user);

  res.status(200).json({
    status: "success",
    message: "Login successful",
    data: {
      accessToken: token,
      user: {
        userId: user.userId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
      },
    },
  });
});

module.exports = {
  register,
  login,
};
