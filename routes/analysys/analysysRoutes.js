const express = require("express");
const router = new express.Router();
const analysysController = require('../../controllers/analysys/analysysController.js');

router.post("/high-support", analysysController?.highSupport);

module.exports = router;