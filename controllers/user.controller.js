const User = require("./../models/user.model");
const Organisation = require("./../models/organisation.model");
const AppError = require("./../utils/AppError");
const catchAsync = require("./../utils/catchAsync");

// Get User record (self) or record of users in an organisation created by user or an oranisation user belongs to
// GET /users/:userId
// Access: Private

const getUser = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  console.log(req.user.userId);
  console.log(userId);
  if (!(req.user.userId == userId)) {
    const user = await User.findByPk(userId);

    if (!user) {
      return next(new AppError(`User with id ${userId} not found!`, 404));
    }

    // Get the organization the currently logged in user belongs to
    const organisations = req.user.getOrganisations().then((orgs) => {
      console.log(orgs);
    });

    res.status(200).json({
      status: "pending",
    });
  } else {
    res.status(200).json({
      status: "success",
      message: "User record retrieved successfully",
      data: {
        user: req.user,
      },
    });
  }
});

module.exports = { getUser };
