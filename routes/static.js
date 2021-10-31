const express = require("express");
const StaticController = require("../controllers/staticController");
const router = express.Router();

router.get("/jobRoles", StaticController.jobRoles);

module.exports = router;
