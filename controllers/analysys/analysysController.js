const { getDecision } = require("../../services/decisionEngine.js");

exports.highSupport = async (req, res, next) => {
  try {
    const decision = await getDecision(req.body);
    res.status(200).json({
      status: true,
      message: "Analysys completed.",
      data: decision,
    });
  } catch (error) {
    console.error("Error:", error);

    // Service Unavailable
    res.status(503).json({
      status: false,
      data: { needSupport: false, type: null, score: 0 },
    });
    next(error);
  }
};
