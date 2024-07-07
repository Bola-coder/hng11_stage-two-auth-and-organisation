const dotenv = require("dotenv").config();
const { signJWTToken } = require("../utils/jwt");
const jwt = require("jsonwebtoken");
const request = require("supertest");
const app = require("../app");
const SequelizeMock = require("sequelize-mock");
const sequelizeMock = new SequelizeMock();

describe("Token Generation", () => {
  it("Should generate a token with correct expiration and user details", () => {
    const user = {
      userId: 1,
      email: "test@example.com,",
      firstName: "Test",
      lastName: "User",
    };
    const token = signJWTToken(user);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    expect(decoded.user.userId).toBe(user.userId);
    expect(decoded.user.email).toBe(user.email);
    expect(decoded.user.firstName).toBe(user.firstName);
    expect(decoded.user.lastName).toBe(user.lastName);
    expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });
});

const UserMock = sequelizeMock.define("User", {
  userId: 1,
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  phone: "",
});

UserMock.create = jest.fn((user) => Promise.resolve({ userId: 1, ...user }));
UserMock.findOne = jest.fn();

describe("Auth Endpoints", () => {
  it("should register user successfully and confirm that an organisation was created with the user's name", async () => {
    const random = Math.floor(Math.random() * 1000);
    const user = {
      firstName: "John",
      lastName: "Doe",
      email: `john.doe.${random}@example.com`,
      password: "password123",
      phone: "09012345678",
    };

    // Mock user creation
    // const User = require("../models/user.model");
    UserMock.create.mockResolvedValue({ userId: 1, ...user });

    const res = await request(app).post("/auth/register").send(user);

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty("data");
    expect(res.body.data).toHaveProperty("accessToken");
    expect(res.body.data.user.firstName).toBe(user.firstName);
    expect(res.body.data.user.email).toBe(user.email);

    // Additional checks for organisation creation
    const orgRes = await request(app)
      .get("/api/organisations")
      .set("Authorization", `Bearer ${res.body.data.accessToken}`);

    expect(orgRes.statusCode).toEqual(200);
    expect(orgRes.body.data.organisations.length).toBeGreaterThan(0);
    expect(orgRes.body.data.organisations[0].name.split("'")[0]).toBe(
      user.firstName
    );
  });

  it("should log the user in successfully", async () => {
    const user = {
      email: "test@gmail.com",
      password: "test1234",
    };

    // Mock user findOne
    // const User = require("../models/user.model");
    UserMock.findOne.mockResolvedValue({ userId: 1, ...user });

    const res = await request(app).post("/auth/login").send(user);

    const token = signJWTToken(res.body.data.user);

    expect(res.statusCode).toEqual(200);
    expect(res.body.data.user.email).toBe(user.email);
    expect(res.body.data.accessToken).toBe(token);
  });

  it("should fail if required fields are missing", async () => {
    const res = await request(app).post("/auth/register").send({
      firstName: "John",
    });

    expect(res.statusCode).toEqual(422);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors).toContainEqual(
      expect.objectContaining({
        message: expect.any(String),
        field: expect.any(String),
      })
    );
  });

  it("should fail if there's duplicate email or userID", async () => {
    const user = {
      firstName: "Test",
      lastName: "Doe",
      email: "test@gmail.com",
      password: "password123",
    };

    // Mocking duplicate user creation
    // const User = require("../models/user.model");
    UserMock.create.mockResolvedValueOnce({ userId: 1, ...user });
    UserMock.create.mockRejectedValueOnce({
      message: `user with email ${user.email} already exists`,
    });

    await request(app).post("/auth/register").send(user);

    const res = await request(app).post("/auth/register").send(user);

    expect(res.statusCode).toEqual(422);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors).toContainEqual(
      expect.objectContaining({
        message: `user with email ${user.email} already exists`,
        field: "email",
      })
    );
  });
});

// describe("Auth Endpoints", () => {
//   it("should register user successfully and confirm that an organisation was created with the user's name", async () => {
//     const random = Math.floor(Math.random() * 1000);
//     const user = {
//       firstName: "John",
//       lastName: "Doe",
//       email: `john.doe.${random}@example.com`,
//       password: "password123",
//       phone: "09012345678",
//     };

//     const res = await request(app).post("/auth/register").send(user);

//     expect(res.statusCode).toEqual(201);
//     expect(res.body).toHaveProperty("data");
//     expect(res.body.data).toHaveProperty("accessToken");
//     expect(res.body.data.user.firstName).toBe(user.firstName);
//     expect(res.body.data.user.email).toBe(user.email);

//     // Additional checks for organisation creation
//     const orgRes = await request(app)
//       .get("/api/organisations")
//       .set("Authorization", `Bearer ${res.body.data.accessToken}`);

//     expect(orgRes.statusCode).toEqual(200);
//     expect(orgRes.body.data.organisations.length).toBeGreaterThan(0);
//     expect(orgRes.body.data.organisations[0].name.split("'")[0]).toBe(
//       user.firstName
//     );
//   }, 20000);

//   it("should log the user in successfully", async () => {
//     const user = {
//       email: "test@gmail.com",
//       password: "test1234",
//     };
//     const res = await request(app).post("/auth/login").send(user);

//     const token = signJWTToken(res.body.data.user);

//     expect(res.statusCode).toEqual(200);
//     expect(res.body.data.user.email).toBe(user.email);
//     expect(res.body.data.accessToken).toBe(token);
//   });

//   it("should fail if required fields are missing", async () => {
//     const res = await request(app).post("/auth/register").send({
//       firstName: "John",
//     });

//     expect(res.statusCode).toEqual(422);
//     expect(res.body).toHaveProperty("errors");
//     expect(res.body.errors).toContainEqual(
//       expect.objectContaining({
//         message: expect.any(String),
//         field: expect.any(String),
//       })
//     );
//   });

//   it("should fail if there's duplicate email or userID", async () => {
//     const user = {
//       firstName: "Test",
//       lastName: "Doe",
//       email: "test@gmail.com",
//       password: "password123",
//     };

//     await request(app).post("/auth/register").send(user);

//     const res = await request(app).post("/auth/register").send(user);

//     expect(res.statusCode).toEqual(422);
//     expect(res.body).toHaveProperty("errors");
//     expect(res.body.errors).toContainEqual(
//       expect.objectContaining({
//         message: `user with email ${user.email} already exists`,
//         field: "email",
//       })
//     );
//   });
// });
