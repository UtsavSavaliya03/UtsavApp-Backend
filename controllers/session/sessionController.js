const Session = require("../../models/session/session.js");
const { v4: uuidv4 } = require("uuid");

exports.createSession = async (req, res, next) => {
  try {
    const session = new Session({
      sessionId: uuidv4(), // 🔑 auto generate
      ...req?.body,
    });
    await session.save();

    res.status(200).json({
      status: true,
      message: "Session saved successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      status: false,
      message: "Error saving session",
    });
  }
};
