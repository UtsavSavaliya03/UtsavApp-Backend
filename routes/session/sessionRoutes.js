const express = require("express");
const router = new express.Router();
const sessionController = require('../../controllers/session/sessionController.js');

router.post("/", sessionController?.createSession);

module.exports = router;