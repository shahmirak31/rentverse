const express = require("express");
const {
  getLedgerInfo,
  getAccounts,
  getBalance,
  mintTokens,
  transferTokens,
  burnTokens,
  getTransactions,
  requestFaucet,
  resetLedger,
  getContractDetails
} = require("../controllers/tokenLedgerController");

const router = express.Router();

router.route("/info").get(getLedgerInfo);
router.route("/accounts").get(getAccounts);
router.route("/balance/:address").get(getBalance);
router.route("/mint").post(mintTokens);
router.route("/transfer").post(transferTokens);
router.route("/burn").post(burnTokens);
router.route("/transactions").get(getTransactions);
router.route("/faucet").post(requestFaucet);
router.route("/reset").post(resetLedger);
router.route("/contract").get(getContractDetails);

module.exports = router;
