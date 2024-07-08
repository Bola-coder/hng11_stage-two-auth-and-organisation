const Organisation = require("../models/organisation.model");
const User = require("../models/user.model");
const AppError = require("../utils/AppError");

exports.getAllOrganisationsUserBelongsToAndOwn = async (user) => {
  const userOrganisation = await Organisation.findAll({
    where: { ownerId: user.userId },
  });
  const organisations = await user.getOrganisations();
  return [...organisations, ...userOrganisation];
};

exports.getOrganisation = async (user, orgId) => {
  const organisation = await Organisation.findOne({
    where: { orgid: orgId, ownerId: user.userId },
  });

  if (!organisation) {
    const org = await user.getOrganisations({
      where: { orgid: orgId },
    });

    if (!org.length) {
      throw new AppError(
        "Organisation with id ${orgId} not found for the logged in user!",
        404
      );
    }
    return org[0];
  }
  return organisation;
};

exports.createNewOrganisation = async (user, data) => {
  const { name, description } = data;

  if (!name) {
    throw new AppError("Organisation name is required", 400);
  }

  const organisation = await Organisation.create({
    name,
    ownerId: user.userId,
    description,
  });

  if (!organisation) {
    throw new AppError("Failed to create new organisation", 404);
  }

  return organisation;
};

exports.addUserToOrganisation = async (orgId, userId) => {
  const organisation = await Organisation.findByPk(orgId);

  if (!organisation) {
    throw new AppError(
      " Organisation with id ${orgId} not found for the logged in user!",
      400
    );
  }

  const user = await User.findByPk(userId);

  if (!user) {
    throw new AppError(
      "User with id ${userId} not found and cannot be added to the organisation!",
      400
    );
  }

  // Check if user is already in the organisation
  const userInOrganisation = await organisation.hasUser(user);

  if (userInOrganisation) {
    throw new AppError(
      "User with id ${userId} is already in the organisation!",
      400
    );
  }

  await organisation.addUser(user);

  return {
    status: "success",
    message: "User added to organisation successfully",
  };
};
