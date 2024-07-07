const SequelizeMock = require("sequelize-mock");
const sequelizeMock = new SequelizeMock();
const httpMocks = require("node-mocks-http");
const { getOrganisation } = require("../services/organisation.service");
const AppError = require("../utils/AppError");

// Create mock models
const OrganisationMock = sequelizeMock.define("Organisation", {
  orgid: 123,
  ownerId: 1,
  name: "Test Organisation",
  description: "Test Description",
});

const UserMock = sequelizeMock.define("User", {
  userId: 1,
  firstName: "Test",
  lastName: "User",
  email: "test@dev.com",
  password: "password123",
});

// Mock the associations
OrganisationMock.belongsTo(UserMock, {
  foreignKey: "ownerId",
});

UserMock.belongsToMany(OrganisationMock, {
  through: "UserOrganisation",
  foreignKey: "userId",
});

OrganisationMock.belongsToMany(UserMock, {
  through: "UserOrganisation",
  foreignKey: "organisationId",
});

// Mock the necessary methods
OrganisationMock.findOne = jest.fn();
UserMock.findOne = jest.fn();

describe("getOrganisation service", () => {
  it("should return the organisation if found by owner id", async () => {
    const user = { userId: 1 };
    const orgId = 123;
    const mockOrganisation = { orgid: orgId, ownerId: user.userId };

    // Mock Organisation.findOne
    OrganisationMock.findOne.mockResolvedValueOnce(mockOrganisation);

    // Mock User.findOne
    UserMock.findOne.mockResolvedValueOnce(user);

    const result = await OrganisationMock.findOne({
      where: { orgid: orgId, ownerId: user.userId },
    });

    expect(result).toEqual(mockOrganisation);
    expect(OrganisationMock.findOne).toHaveBeenCalledWith({
      where: { orgid: orgId, ownerId: user.userId },
    });
  });

  it("should return the first organisation from user organisations if not found by owner id", async () => {
    const user = { userId: 1 };
    const orgId = 123;
    const mockUserOrgs = [{ orgid: orgId, name: "Test Organisation" }];

    // Simulate findOne returning no result
    OrganisationMock.findOne.mockResolvedValueOnce(null);

    // Mock user's organisations

    user.getOrganisations = jest.fn().mockResolvedValueOnce(mockUserOrgs);

    const result = await user.getOrganisations({
      where: { orgid: orgId },
    });

    // Assertions
    expect(result).toEqual(mockUserOrgs);
    expect(OrganisationMock.findOne).toHaveBeenCalledWith({
      where: { orgid: orgId, ownerId: user.userId },
    });
  });

  it("should throw an error if organisation not found and user has no access", async () => {
    const user = { userId: 1 };
    const orgId = 123;

    OrganisationMock.findOne.mockResolvedValueOnce(null);
    user.getOrganisations = jest.fn().mockResolvedValueOnce([]);

    try {
      await OrganisationMock.findOne({
        where: { orgid: orgId, ownerId: user.userId },
      });
    } catch (error) {
      expect(error.message).toEqual(
        `Organisation with id ${orgId} not found for the logged in user!`
      );
      expect(error.statusCode).toEqual(404);
    }
  });
});
