const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  sessionId: String,

  timeOnStep: Number,
  backspaceCount: Number,
  idleSeconds: Number,
  navLoops: Number,
  failedValidations: Number, // Error
  fieldRevisits: Number,
  totalKeystrokes: Number,
  inputCorrections: Number,
  cursorHesitations: Number,
  rapidClicks: Number,
  sessionDuration: Number,
  
  triggerTime: Number,
  usedAIModel: String,
  supportMode: String,
  supportTriggered: Boolean,
  completed: Boolean,

  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Session", sessionSchema);
