const express = require("express");
const router = express.Router();
const controller = require("../controllers/connectionController");
const { isLoggedIn, isAuthor, isNotAuthor } = require("../middlewares/auth");
const {
  validateId,
  validateResult,
  validateconnection,
} = require("../middlewares/validator");

//GET /connections: send all the connection
router.get("/", controller.index);

//GET /connections/new send new connection form
router.get("/new", isLoggedIn, controller.new);

//POST /connections create new connection
router.post(
  "/",
  isLoggedIn,
  validateconnection,
  validateResult,
  controller.createConnection
);

//GET /connections/:id send specific connection
router.get("/:id", validateId, controller.findById);

//GET /connections/:id/edit send edit page for specific connection
router.get("/:id/edit", isLoggedIn, validateId, isAuthor, controller.editById);

//POST /connections/:id edit the specific connection
router.put(
  "/:id",
  isLoggedIn,
  validateId,
  isAuthor,
  validateconnection,
  validateResult,
  controller.updateById
);

//DELETE /connections/:id delete the specific connection and show all connection.
router.delete("/:id", isLoggedIn, validateId, isAuthor, controller.deleteById);

// create new RSVP
router.post(
  "/:id/rsvp/",
  isLoggedIn,
  validateId,
  isNotAuthor,
  controller.doRSVP
);

router.delete("/:id/rsvp", isLoggedIn, validateId, controller.deleteRSVP);

module.exports = router;
