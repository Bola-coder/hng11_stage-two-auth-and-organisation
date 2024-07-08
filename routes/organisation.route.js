const router = require("express").Router();
const organisationController = require("../controllers/organisation.controller");
const authMiddleware = require("../middlewares/auth");

router.get(
  "/",
  authMiddleware.protectRoute,
  organisationController.getAllOrganisationsUserBelongsToAndOwn
);

router.get(
  "/:orgId",
  authMiddleware.protectRoute,
  organisationController.getOrganisation
);

router.post(
  "/",
  authMiddleware.protectRoute,
  organisationController.createNewOrganisation
);

router.post("/:orgId/users", organisationController.addUserToOrganisation);

module.exports = router;
