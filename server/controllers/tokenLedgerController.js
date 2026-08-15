const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

// Smart Contract ABI representation for TokenLedger
const TOKEN_LEDGER_ABI = [
  {
    "inputs": [{ "internalType": "uint256", "name": "initialSupply", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "owner", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "spender", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" }
    ],
    "name": "Approval",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "from", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "to", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" }
    ],
    "name": "Transfer",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "to", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" },
      { "indexed": false, "internalType": "string", "name": "memo", "type": "string" }
    ],
    "name": "Mint",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "from", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" }
    ],
    "name": "Burn",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "account", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "transfer",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "internalType": "string", "name": "memo", "type": "string" }
    ],
    "name": "mint",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "amount", "type": "uint256" }],
    "name": "burn",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "spender", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "tokenOwner", "type": "address" },
      { "internalType": "address", "name": "spender", "type": "address" }
    ],
    "name": "allowance",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "from", "type": "address" },
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "transferFrom",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTransactionHistory",
    "outputs": [
      {
        "components": [
          { "internalType": "uint256", "name": "id", "type": "uint256" },
          { "internalType": "string", "name": "txType", "type": "string" },
          { "internalType": "address", "name": "from", "type": "address" },
          { "internalType": "address", "name": "to", "type": "address" },
          { "internalType": "uint256", "name": "amount", "type": "uint256" },
          { "internalType": "uint256", "name": "timestamp", "type": "uint256" },
          { "internalType": "string", "name": "memo", "type": "string" }
        ],
        "internalType": "struct TokenLedger.TransactionRecord[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Helper to format mock hex address
const normalizeAddress = (addr) => {
  if (!addr) return "0x0000000000000000000000000000000000000000";
  let clean = addr.trim().toLowerCase();
  if (!clean.startsWith("0x")) {
    clean = "0x" + clean;
  }
  return clean;
};

// Generate deterministic-looking mock transaction hash
const generateTxHash = () => {
  return "0x" + crypto.randomBytes(32).toString("hex");
};

// Initial Seeded Ledger State
const createInitialState = () => {
  const TREASURY_ADDR = "0x9852f863d0434cc221295b958863aa992f913d9a";
  const ESCROW_ADDR = "0x4a1e948cbbca2219803159e867451ab01e9d4432";
  const TENANT_ALICE = "0x71c9b3a04ef962886f32cf891106e23297a7a661";
  const INVESTOR_BOB = "0x53d26fb516f499b9cf9b61d28331bb14f85e4933";
  const LANDLORD_CHARLIE = "0x28a8d11c750e3954605175cf51e70e9f16e4db55";

  const balances = {
    [TREASURY_ADDR]: 500000,
    [ESCROW_ADDR]: 250000,
    [INVESTOR_BOB]: 150000,
    [TENANT_ALICE]: 75000,
    [LANDLORD_CHARLIE]: 25000
  };

  const accountLabels = {
    [TREASURY_ADDR]: "RentVerse Treasury (Deployer)",
    [ESCROW_ADDR]: "Smart Escrow Pool",
    [INVESTOR_BOB]: "Investor Bob",
    [TENANT_ALICE]: "Tenant Alice",
    [LANDLORD_CHARLIE]: "Landlord Charlie"
  };

  const now = Date.now();
  let blockNumber = 18452000;

  const transactions = [
    {
      id: 1,
      txHash: "0x3f5c9284ba284918e95026e1081a28185c1815e9821817e10891516e881284a1",
      blockNumber: blockNumber++,
      type: "MINT",
      from: "0x0000000000000000000000000000000000000000",
      to: TREASURY_ADDR,
      toLabel: "RentVerse Treasury (Deployer)",
      amount: 1000000,
      timestamp: now - 3600000 * 24 * 3,
      memo: "Genesis initial supply minting",
      gasUsed: 65420,
      status: "CONFIRMED"
    },
    {
      id: 2,
      txHash: "0xa817c182583719183751a02938471b1938571829385718928374918237491823",
      blockNumber: blockNumber++,
      type: "TRANSFER",
      from: TREASURY_ADDR,
      fromLabel: "RentVerse Treasury (Deployer)",
      to: ESCROW_ADDR,
      toLabel: "Smart Escrow Pool",
      amount: 250000,
      timestamp: now - 3600000 * 24 * 2,
      memo: "Escrow liquidity allocation for property leases",
      gasUsed: 42100,
      status: "CONFIRMED"
    },
    {
      id: 3,
      txHash: "0x7812948127391827391823719823719823719827391827391827391827391827",
      blockNumber: blockNumber++,
      type: "TRANSFER",
      from: TREASURY_ADDR,
      fromLabel: "RentVerse Treasury (Deployer)",
      to: INVESTOR_BOB,
      toLabel: "Investor Bob",
      amount: 150000,
      timestamp: now - 3600000 * 24 * 1,
      memo: "Seed investor allocation for fractional properties",
      gasUsed: 42100,
      status: "CONFIRMED"
    },
    {
      id: 4,
      txHash: "0x1928371928371928371928371928371928371928371928371928371928371928",
      blockNumber: blockNumber++,
      type: "TRANSFER",
      from: TREASURY_ADDR,
      fromLabel: "RentVerse Treasury (Deployer)",
      to: TENANT_ALICE,
      toLabel: "Tenant Alice",
      amount: 75000,
      timestamp: now - 3600000 * 12,
      memo: "Tenant rental deposit grant",
      gasUsed: 42100,
      status: "CONFIRMED"
    },
    {
      id: 5,
      txHash: "0x9876543210abcdef9876543210abcdef9876543210abcdef9876543210abcdef",
      blockNumber: blockNumber++,
      type: "TRANSFER",
      from: TREASURY_ADDR,
      fromLabel: "RentVerse Treasury (Deployer)",
      to: LANDLORD_CHARLIE,
      toLabel: "Landlord Charlie",
      amount: 25000,
      timestamp: now - 3600000 * 2,
      memo: "Property manager payout",
      gasUsed: 42100,
      status: "CONFIRMED"
    }
  ];

  return {
    tokenInfo: {
      name: "RentVerse Token",
      symbol: "RNT",
      decimals: 18,
      contractAddress: "0x3B838031d3d6333D72B7082cb79aD3958Fa6245a",
      network: "Simulated Virtual EVM Chain (RentVerse L2 Testnet)",
      owner: TREASURY_ADDR,
      standard: "ERC-20 Standalone Ledger"
    },
    balances,
    accountLabels,
    transactions,
    currentBlock: blockNumber
  };
};

let ledgerState = createInitialState();

// Read Solidity contract code directly from contracts folder
const getContractSolidityCode = () => {
  try {
    const contractPath = path.resolve(__dirname, "../../contracts/TokenLedger.sol");
    if (fs.existsSync(contractPath)) {
      return fs.readFileSync(contractPath, "utf8");
    }
  } catch (e) {
    console.error("Error reading contract file:", e);
  }
  return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TokenLedger {
    string public name = "RentVerse Token";
    string public symbol = "RNT";
    uint8 public decimals = 18;
    uint256 public totalSupply;
    mapping(address => uint256) private _balances;

    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }
}`;
};

/**
 * Controller Endpoints
 */

// GET /api/ledger/info
exports.getLedgerInfo = async (req, res) => {
  try {
    let totalSupply = 0;
    Object.values(ledgerState.balances).forEach(val => {
      totalSupply += Number(val) || 0;
    });

    const activeAccounts = Object.keys(ledgerState.balances).filter(addr => (ledgerState.balances[addr] || 0) > 0);

    res.status(200).json({
      success: true,
      token: {
        ...ledgerState.tokenInfo,
        totalSupply,
        formattedSupply: `${totalSupply.toLocaleString()} ${ledgerState.tokenInfo.symbol}`,
        totalHolders: activeAccounts.length,
        totalTransactions: ledgerState.transactions.length,
        currentBlock: ledgerState.currentBlock
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/ledger/accounts
exports.getAccounts = async (req, res) => {
  try {
    let totalSupply = 0;
    Object.values(ledgerState.balances).forEach(val => {
      totalSupply += Number(val) || 0;
    });

    const accounts = Object.keys(ledgerState.balances).map(address => {
      const balance = Number(ledgerState.balances[address]) || 0;
      const txCount = ledgerState.transactions.filter(
        tx => tx.from?.toLowerCase() === address.toLowerCase() || tx.to?.toLowerCase() === address.toLowerCase()
      ).length;

      const percentage = totalSupply > 0 ? ((balance / totalSupply) * 100).toFixed(2) : 0;

      return {
        address,
        label: ledgerState.accountLabels[address] || "Custom Account",
        balance,
        formattedBalance: `${balance.toLocaleString()} ${ledgerState.tokenInfo.symbol}`,
        percentageOfSupply: `${percentage}%`,
        transactionCount: txCount
      };
    }).sort((a, b) => b.balance - a.balance);

    res.status(200).json({
      success: true,
      accounts,
      count: accounts.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/ledger/balance/:address
exports.getBalance = async (req, res) => {
  try {
    const { address } = req.params;
    if (!address) {
      return res.status(400).json({ success: false, message: "Address parameter is required" });
    }

    const normalized = normalizeAddress(address);
    const balance = Number(ledgerState.balances[normalized]) || 0;
    const label = ledgerState.accountLabels[normalized] || null;

    // Filter transactions involving this account
    const history = ledgerState.transactions.filter(
      tx => tx.from?.toLowerCase() === normalized.toLowerCase() || tx.to?.toLowerCase() === normalized.toLowerCase()
    );

    res.status(200).json({
      success: true,
      address: normalized,
      label,
      balance,
      symbol: ledgerState.tokenInfo.symbol,
      formattedBalance: `${balance.toLocaleString()} ${ledgerState.tokenInfo.symbol}`,
      transactionCount: history.length,
      history
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/ledger/mint
exports.mintTokens = async (req, res) => {
  try {
    const { to, amount, memo, label } = req.body;

    if (!to) {
      return res.status(400).json({ success: false, message: "Recipient address ('to') is required" });
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, message: "Amount must be a positive number" });
    }

    const normalizedTo = normalizeAddress(to);

    // Update balance
    ledgerState.balances[normalizedTo] = (Number(ledgerState.balances[normalizedTo]) || 0) + numAmount;

    if (label && !ledgerState.accountLabels[normalizedTo]) {
      ledgerState.accountLabels[normalizedTo] = label;
    }

    ledgerState.currentBlock += 1;
    const txHash = generateTxHash();

    const newTx = {
      id: ledgerState.transactions.length + 1,
      txHash,
      blockNumber: ledgerState.currentBlock,
      type: "MINT",
      from: "0x0000000000000000000000000000000000000000",
      fromLabel: "0x0 (Zero Address / Minter)",
      to: normalizedTo,
      toLabel: ledgerState.accountLabels[normalizedTo] || `Account ${normalizedTo.substring(0, 6)}...`,
      amount: numAmount,
      timestamp: Date.now(),
      memo: memo || "Simulated Smart Contract Mint",
      gasUsed: Math.floor(45000 + Math.random() * 15000),
      status: "CONFIRMED"
    };

    ledgerState.transactions.unshift(newTx);

    res.status(201).json({
      success: true,
      message: `Successfully minted ${numAmount.toLocaleString()} ${ledgerState.tokenInfo.symbol} to ${normalizedTo}`,
      receipt: newTx,
      newBalance: ledgerState.balances[normalizedTo]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/ledger/transfer
exports.transferTokens = async (req, res) => {
  try {
    const { from, to, amount, memo } = req.body;

    if (!from || !to) {
      return res.status(400).json({ success: false, message: "Both 'from' and 'to' addresses are required" });
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, message: "Amount must be a positive number" });
    }

    const normalizedFrom = normalizeAddress(from);
    const normalizedTo = normalizeAddress(to);

    if (normalizedFrom === normalizedTo) {
      return res.status(400).json({ success: false, message: "Sender and recipient addresses cannot be identical" });
    }

    const senderBalance = Number(ledgerState.balances[normalizedFrom]) || 0;
    if (senderBalance < numAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient token balance. Sender has ${senderBalance.toLocaleString()} ${ledgerState.tokenInfo.symbol}, but attempted to transfer ${numAmount.toLocaleString()} ${ledgerState.tokenInfo.symbol}.`
      });
    }

    // Execute transfer
    ledgerState.balances[normalizedFrom] = senderBalance - numAmount;
    ledgerState.balances[normalizedTo] = (Number(ledgerState.balances[normalizedTo]) || 0) + numAmount;

    ledgerState.currentBlock += 1;
    const txHash = generateTxHash();

    const newTx = {
      id: ledgerState.transactions.length + 1,
      txHash,
      blockNumber: ledgerState.currentBlock,
      type: "TRANSFER",
      from: normalizedFrom,
      fromLabel: ledgerState.accountLabels[normalizedFrom] || `Account ${normalizedFrom.substring(0, 6)}...`,
      to: normalizedTo,
      toLabel: ledgerState.accountLabels[normalizedTo] || `Account ${normalizedTo.substring(0, 6)}...`,
      amount: numAmount,
      timestamp: Date.now(),
      memo: memo || "P2P Token Transfer",
      gasUsed: Math.floor(38000 + Math.random() * 12000),
      status: "CONFIRMED"
    };

    ledgerState.transactions.unshift(newTx);

    res.status(200).json({
      success: true,
      message: `Successfully transferred ${numAmount.toLocaleString()} ${ledgerState.tokenInfo.symbol} from ${normalizedFrom.substring(0, 8)}... to ${normalizedTo.substring(0, 8)}...`,
      receipt: newTx,
      senderBalance: ledgerState.balances[normalizedFrom],
      recipientBalance: ledgerState.balances[normalizedTo]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/ledger/burn
exports.burnTokens = async (req, res) => {
  try {
    const { from, amount, memo } = req.body;

    if (!from) {
      return res.status(400).json({ success: false, message: "Account address ('from') is required" });
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, message: "Amount must be a positive number" });
    }

    const normalizedFrom = normalizeAddress(from);
    const senderBalance = Number(ledgerState.balances[normalizedFrom]) || 0;

    if (senderBalance < numAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance to burn. Available: ${senderBalance} ${ledgerState.tokenInfo.symbol}.`
      });
    }

    ledgerState.balances[normalizedFrom] = senderBalance - numAmount;
    ledgerState.currentBlock += 1;
    const txHash = generateTxHash();

    const newTx = {
      id: ledgerState.transactions.length + 1,
      txHash,
      blockNumber: ledgerState.currentBlock,
      type: "BURN",
      from: normalizedFrom,
      fromLabel: ledgerState.accountLabels[normalizedFrom] || `Account ${normalizedFrom.substring(0, 6)}...`,
      to: "0x0000000000000000000000000000000000000000",
      toLabel: "0x0 (Dead Address / Burned)",
      amount: numAmount,
      timestamp: Date.now(),
      memo: memo || "Token Burn",
      gasUsed: Math.floor(32000 + Math.random() * 8000),
      status: "CONFIRMED"
    };

    ledgerState.transactions.unshift(newTx);

    res.status(200).json({
      success: true,
      message: `Successfully burned ${numAmount.toLocaleString()} ${ledgerState.tokenInfo.symbol} from ${normalizedFrom}`,
      receipt: newTx,
      remainingBalance: ledgerState.balances[normalizedFrom]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/ledger/transactions
exports.getTransactions = async (req, res) => {
  try {
    const { address, type, limit = 50 } = req.query;

    let filtered = [...ledgerState.transactions];

    if (address) {
      const normalized = normalizeAddress(address).toLowerCase();
      filtered = filtered.filter(
        tx => tx.from?.toLowerCase() === normalized || tx.to?.toLowerCase() === normalized
      );
    }

    if (type) {
      filtered = filtered.filter(tx => tx.type.toUpperCase() === type.toUpperCase());
    }

    const limited = filtered.slice(0, Number(limit) || 50);

    res.status(200).json({
      success: true,
      transactions: limited,
      totalCount: filtered.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/ledger/faucet
exports.requestFaucet = async (req, res) => {
  try {
    const { to } = req.body;
    if (!to) {
      return res.status(400).json({ success: false, message: "Recipient address is required" });
    }

    const normalizedTo = normalizeAddress(to);
    const faucetAmount = 500;

    ledgerState.balances[normalizedTo] = (Number(ledgerState.balances[normalizedTo]) || 0) + faucetAmount;

    ledgerState.currentBlock += 1;
    const txHash = generateTxHash();

    const newTx = {
      id: ledgerState.transactions.length + 1,
      txHash,
      blockNumber: ledgerState.currentBlock,
      type: "FAUCET",
      from: "0x0000000000000000000000000000000000000000",
      fromLabel: "RentVerse Testnet Faucet",
      to: normalizedTo,
      toLabel: ledgerState.accountLabels[normalizedTo] || `Account ${normalizedTo.substring(0, 6)}...`,
      amount: faucetAmount,
      timestamp: Date.now(),
      memo: "Free Testnet Test Tokens Allocation",
      gasUsed: 21000,
      status: "CONFIRMED"
    };

    ledgerState.transactions.unshift(newTx);

    res.status(200).json({
      success: true,
      message: `Airdropped ${faucetAmount} ${ledgerState.tokenInfo.symbol} to ${normalizedTo}`,
      receipt: newTx,
      newBalance: ledgerState.balances[normalizedTo]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/ledger/reset
exports.resetLedger = async (req, res) => {
  try {
    ledgerState = createInitialState();
    res.status(200).json({
      success: true,
      message: "Token ledger simulation reset to genesis initial state."
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/ledger/contract
exports.getContractDetails = async (req, res) => {
  try {
    const solidityCode = getContractSolidityCode();

    res.status(200).json({
      success: true,
      contract: {
        name: "TokenLedger",
        filename: "TokenLedger.sol",
        solidityVersion: "^0.8.0",
        license: "MIT",
        address: ledgerState.tokenInfo.contractAddress,
        abi: TOKEN_LEDGER_ABI,
        sourceCode: solidityCode,
        supportedMethods: [
          { name: "balanceOf", type: "read", params: ["address account"], description: "Check token balance of an account" },
          { name: "transfer", type: "write", params: ["address to", "uint256 amount"], description: "Transfer tokens to a recipient" },
          { name: "mint", type: "write", params: ["address to", "uint256 amount", "string memo"], description: "Mint new tokens to target account" },
          { name: "burn", type: "write", params: ["uint256 amount"], description: "Burn tokens from caller balance" },
          { name: "approve", type: "write", params: ["address spender", "uint256 amount"], description: "Approve 3rd party spender allowance" },
          { name: "allowance", type: "read", params: ["address owner", "address spender"], description: "Check remaining allowance" },
          { name: "transferFrom", type: "write", params: ["address from", "address to", "uint256 amount"], description: "Delegated transfer via allowance" },
          { name: "getTransactionHistory", type: "read", params: [], description: "Retrieve array of all executed ledger records" }
        ],
        integrationSnippet: {
          ethersJs: `import { ethers } from "ethers";\nimport TokenLedgerABI from "./TokenLedger.json";\n\nconst CONTRACT_ADDRESS = "${ledgerState.tokenInfo.contractAddress}";\n\n// Connect to contract\nconst provider = new ethers.providers.Web3Provider(window.ethereum);\nconst signer = provider.getSigner();\nconst ledgerContract = new ethers.Contract(CONTRACT_ADDRESS, TokenLedgerABI, signer);\n\n// 1. Check Balance\nconst balance = await ledgerContract.balanceOf("0xYourAddress");\n\n// 2. Mint Tokens\nconst txMint = await ledgerContract.mint("0xRecipient", ethers.utils.parseUnits("100", 18), "Lease deposit");\nawait txMint.wait();\n\n// 3. Transfer Tokens\nconst txTransfer = await ledgerContract.transfer("0xRecipient", ethers.utils.parseUnits("50", 18));\nawait txTransfer.wait();`,
          restApi: `// REST API Endpoint Examples\n\n// Check Balance\nfetch('/api/ledger/balance/0xYourAddress')\n  .then(res => res.json())\n  .then(data => console.log(data.balance));\n\n// Mint Tokens\nfetch('/api/ledger/mint', {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify({\n    to: '0xRecipientAddress',\n    amount: 100,\n    memo: 'Property deposit grant'\n  })\n});\n\n// Transfer Tokens\nfetch('/api/ledger/transfer', {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify({\n    from: '0xSenderAddress',\n    to: '0xRecipientAddress',\n    amount: 50,\n    memo: 'Monthly rental fee'\n  })\n});`
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
