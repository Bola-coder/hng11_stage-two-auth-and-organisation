const catchAsync = require("../utils/catchAsync");
const organisationService = require("../services/organisation.service");

exports.getAllOrganisationsUserBelongsToAndOwn = catchAsync(
  async (req, res, next) => {
    const organisations =
      await organisationService.getAllOrganisationsUserBelongsToAndOwn(
        req.user
      );
    res.status(200).json({
      status: "success",
      message: "Organisations retrieved successfully",
      data: {
        organisations,
      },
    });
  }
);

exports.getOrganisation = catchAsync(async (req, res, next) => {
  const { orgId } = req.params;
  const organisation = await organisationService.getOrganisation(
    req.user,
    orgId
  );

  if (!organisation) {
    return next(
      new AppError(
        "Organisation with id ${orgId} not found for the logged in user!",
        404
      )
    );
  }

  res.status(200).json({
    status: "success",
    message: "Organisation record retrieved successfully",
    data: organisation,
  });
});

exports.createNewOrganisation = catchAsync(async (req, res, next) => {
  const organisation = await organisationService.createNewOrganisation(
    req.user,
    req.body
  );
  res.status(201).json({
    status: "success",
    message: "Organisation created successfully",
    data: organisation,
  });
});

exports.addUserToOrganisation = catchAsync(async (req, res, next) => {
  const { orgId } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return next(new AppError("User ID is required", 400));
  }
  const result = await organisationService.addUserToOrganisation(orgId, userId);

  res.status(200).json(result);
});
