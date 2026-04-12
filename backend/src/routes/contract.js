const express = require("express");
const router = express.Router();
const isAuthenticated = require("../middleware/isAuthenticated");
const Contract = require("../models/contract");

// get contract by id
router.get("/:id", isAuthenticated, async (req, res) => {
    try {
        const contract = await Contract.findById(req.params.id)
            .populate("provider", "firstName lastName email")
            .populate("client", "firstName lastName email")
            .populate("listing", "title category price");
        if (!contract) return res.status(404).json({ message: "Contract not found" });
        res.json(contract);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

// sign contract
router.put("/:id/sign", isAuthenticated, async (req, res) => {
    try {
        const contract = await Contract.findById(req.params.id);
        if (!contract) return res.status(404).json({ message: "Contract not found" });

        const userId = req.user._id.toString();

        if (contract.provider.toString() === userId) {
            contract.providerSigned = true;
            contract.providerSignedAt = new Date();
        } else if (contract.client.toString() === userId) {
            contract.clientSigned = true;
            contract.clientSignedAt = new Date();
        } else {
            return res.status(403).json({ message: "Not authorized" });
        }

        if (contract.providerSigned && contract.clientSigned) {
            contract.status = "FULLY_SIGNED";
        }

        await contract.save();
        res.json(contract);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;