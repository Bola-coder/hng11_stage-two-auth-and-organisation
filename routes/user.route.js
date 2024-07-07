const router = require("express").Router();
const userController = require("../controllers/user.controller");
const authMiddleware = require("../middlewares/auth");

router.get("/:userId", authMiddleware.protectRoute, userController.getUser);

module.exports = router;
