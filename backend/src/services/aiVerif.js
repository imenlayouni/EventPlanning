const { execFile } = require("child_process");
const path = require("path");
const User = require("../models/User");

function verifyCINWithAI(imagePath) {
  return new Promise((resolve, reject) => {
    const pythonPath = "python";
    const scriptPath = path.join(__dirname, "../../ai/cinVerify.py");

    execFile(pythonPath, [scriptPath, imagePath], (error, stdout, stderr) => {
      if (error) {
        console.error("Python error:", error);
        if (stderr) console.error("Python stderr:", stderr);
        return resolve(false);
      }

      if (stderr) {
        console.warn("Python stderr warning:", stderr);
      }

      const result = stdout.trim().toLowerCase();
      resolve(result === "valid");

    });
  });
}

module.exports = { verifyCINWithAI };
