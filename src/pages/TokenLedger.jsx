import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSend,
  FiPlusCircle,
  FiSearch,
  FiCode,
  FiCopy,
  FiCheck,
  FiRefreshCw,
  FiActivity,
  FiDatabase,
  FiDollarSign,
  FiTrash2,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiExternalLink,
  FiShield
} from 'react-icons/fi';
import { FaCoins, FaCube, FaExchangeAlt, FaEthereum } from 'react-icons/fa';

export default function TokenLedger() {
  const [activeTab, setActiveTab] = useState('transfer'); // 'transfer', 'mint', 'checker', 'contract'
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: string }
  const [copiedKey, setCopiedKey] = useState(null);

  // Ledger state from backend API
  const [tokenInfo, setTokenInfo] = useState({
    name: 'RentVerse Token',
    symbol: 'RNT',
    decimals: 18,
    totalSupply: 1000000,
    contractAddress: '0x3B838031d3d6333D72B7082cb79aD3958Fa6245a',
    network: 'Simulated Virtual EVM Chain (RentVerse L2 Testnet)',
    totalHolders: 5,
    totalTransactions: 5,
    currentBlock: 18452005
  });

  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [contractDetails, setContractDetails] = useState(null);

  // Form states
  const [transferForm, setTransferForm] = useState({
    from: '',
    to: '',
    amount: '',
    memo: ''
  });

  const [mintForm, setMintForm] = useState({
    to: '',
    amount: '',
    memo: '',
    label: ''
  });

  const [burnForm, setBurnForm] = useState({
    from: '',
    amount: '',
    memo: ''
  });

  const [checkerAddress, setCheckerAddress] = useState('');
  const [queriedAccount, setQueriedAccount] = useState(null);
  const [txFilterType, setTxFilterType] = useState('ALL');
  const [txSearchQuery, setTxSearchQuery] = useState('');
  const [selectedSnippet, setSelectedSnippet] = useState('ethersJs');

  // Fetch initial ledger state
  const fetchLedgerData = async () => {
    try {
      setLoading(true);
      const [infoRes, accountsRes, txRes] = await Promise.all([
        fetch('/api/ledger/info').then(r => r.json()),
        fetch('/api/ledger/accounts').then(r => r.json()),
        fetch('/api/ledger/transactions').then(r => r.json())
      ]);

      if (infoRes.success) setTokenInfo(infoRes.token);
      if (accountsRes.success) {
        setAccounts(accountsRes.accounts);
        // Default sender to treasury if not set
        if (!transferForm.from && accountsRes.accounts.length > 0) {
          setTransferForm(prev => ({ ...prev, from: accountsRes.accounts[0].address }));
        }
        if (!burnForm.from && accountsRes.accounts.length > 0) {
          setBurnForm(prev => ({ ...prev, from: accountsRes.accounts[0].address }));
        }
      }
      if (txRes.success) setTransactions(txRes.transactions);
    } catch (err) {
      console.error('Error fetching token ledger data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch contract code & ABI
  const fetchContractDetails = async () => {
    try {
      const res = await fetch('/api/ledger/contract').then(r => r.json());
      if (res.success) {
        setContractDetails(res.contract);
      }
    } catch (err) {
      console.error('Error fetching contract details:', err);
    }
  };

  useEffect(() => {
    fetchLedgerData();
    fetchContractDetails();
  }, []);

  const showNotification = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback(null);
    }, 6000);
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Execute Transfer
  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!transferForm.from || !transferForm.to || !transferForm.amount) {
      showNotification('error', 'Please fill out all required transfer fields.');
      return;
    }

    try {
      setActionLoading(true);
      const res = await fetch('/api/ledger/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transferForm)
      });
      const data = await res.json();

      if (data.success) {
        showNotification('success', data.message);
        setTransferForm(prev => ({ ...prev, amount: '', memo: '' }));
        await fetchLedgerData();
      } else {
        showNotification('error', data.message || 'Transfer failed');
      }
    } catch (err) {
      showNotification('error', err.message || 'Network error executing transfer');
    } finally {
      setActionLoading(false);
    }
  };

  // Execute Mint
  const handleMint = async (e) => {
    e.preventDefault();
    if (!mintForm.to || !mintForm.amount) {
      showNotification('error', 'Please specify a recipient address and amount to mint.');
      return;
    }

    try {
      setActionLoading(true);
      const res = await fetch('/api/ledger/mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mintForm)
      });
      const data = await res.json();

      if (data.success) {
        showNotification('success', data.message);
        setMintForm({ to: '', amount: '', memo: '', label: '' });
        await fetchLedgerData();
      } else {
        showNotification('error', data.message || 'Minting failed');
      }
    } catch (err) {
      showNotification('error', err.message || 'Network error executing mint');
    } finally {
      setActionLoading(false);
    }
  };

  // Execute Burn
  const handleBurn = async (e) => {
    e.preventDefault();
    if (!burnForm.from || !burnForm.amount) {
      showNotification('error', 'Please specify account address and amount to burn.');
      return;
    }

    try {
      setActionLoading(true);
      const res = await fetch('/api/ledger/burn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(burnForm)
      });
      const data = await res.json();

      if (data.success) {
        showNotification('success', data.message);
        setBurnForm(prev => ({ ...prev, amount: '', memo: '' }));
        await fetchLedgerData();
      } else {
        showNotification('error', data.message || 'Token burn failed');
      }
    } catch (err) {
      showNotification('error', err.message || 'Network error executing token burn');
    } finally {
      setActionLoading(false);
    }
  };

  // Request Faucet testnet tokens
  const handleFaucet = async (targetAddr) => {
    const addr = targetAddr || (accounts[0] ? accounts[0].address : '0x71c9b3a04ef962886f32cf891106e23297a7a661');
    try {
      setActionLoading(true);
      const res = await fetch('/api/ledger/faucet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: addr })
      });
      const data = await res.json();
      if (data.success) {
        showNotification('success', data.message);
        await fetchLedgerData();
      } else {
        showNotification('error', data.message || 'Faucet request failed');
      }
    } catch (err) {
      showNotification('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Reset ledger to genesis
  const handleResetLedger = async () => {
    if (!window.confirm('Reset the smart contract token ledger simulation back to genesis state?')) return;
    try {
      setActionLoading(true);
      const res = await fetch('/api/ledger/reset', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showNotification('success', data.message);
        setQueriedAccount(null);
        await fetchLedgerData();
      }
    } catch (err) {
      showNotification('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Lookup account balance
  const handleQueryBalance = async (addressToQuery) => {
    const target = addressToQuery || checkerAddress;
    if (!target) return;

    try {
      setActionLoading(true);
      const res = await fetch(`/api/ledger/balance/${encodeURIComponent(target.trim())}`);
      const data = await res.json();
      if (data.success) {
        setQueriedAccount(data);
        setCheckerAddress(target);
      } else {
        showNotification('error', data.message || 'Could not query balance');
      }
    } catch (err) {
      showNotification('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered transactions for audit explorer
  const filteredTransactions = transactions.filter(tx => {
    if (txFilterType !== 'ALL' && tx.type !== txFilterType) return false;
    if (txSearchQuery) {
      const q = txSearchQuery.toLowerCase();
      const matchHash = tx.txHash?.toLowerCase().includes(q);
      const matchFrom = tx.from?.toLowerCase().includes(q);
      const matchTo = tx.to?.toLowerCase().includes(q);
      const matchMemo = tx.memo?.toLowerCase().includes(q);
      if (!matchHash && !matchFrom && !matchTo && !matchMemo) return false;
    }
    return true;
  });

  const getSenderBalance = (addr) => {
    const acc = accounts.find(a => a.address.toLowerCase() === addr.toLowerCase());
    return acc ? acc.balance : 0;
  };

  return (
    <div id="token-ledger-page" className="min-h-screen bg-secondary-50 pb-16">
      {/* Header Banner */}
      <div className="bg-white border-b border-secondary-200">
        <div className="container py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary-100 text-primary-700">
                  <FaCube className="mr-1.5" /> ERC-20 Smart Contract
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                  <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>
                  Simulated Virtual Chain Active
                </span>
              </div>
              <h1 className="text-3xl font-bold text-secondary-900 flex items-center">
                <FaCoins className="text-primary-600 mr-3" />
                Token Ledger Engine
              </h1>
              <p className="text-secondary-600 mt-1 max-w-2xl text-sm md:text-base">
                Simulate smart contract minting, peer-to-peer transfers, address balance verification, and real-time transaction ledger state without external chain dependencies.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                id="btn-faucet-airdrop"
                onClick={() => handleFaucet()}
                disabled={actionLoading}
                className="btn-secondary text-xs sm:text-sm flex items-center"
                title="Airdrop 500 RNT test tokens"
              >
                <FaCoins className="mr-1.5" /> Faucet (+500 RNT)
              </button>
              <button
                id="btn-refresh-ledger"
                onClick={fetchLedgerData}
                disabled={loading || actionLoading}
                className="p-2.5 rounded-md border border-secondary-300 hover:bg-secondary-100 text-secondary-700 transition"
                title="Refresh Ledger"
              >
                <FiRefreshCw className={loading ? 'animate-spin' : ''} size={18} />
              </button>
              <button
                id="btn-reset-genesis"
                onClick={handleResetLedger}
                disabled={actionLoading}
                className="p-2.5 rounded-md border border-red-200 text-red-600 hover:bg-red-50 transition"
                title="Reset to Genesis State"
              >
                <FiTrash2 size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Notification Toast */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-lg shadow-xl border flex items-start space-x-3 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-red-50 border-red-300 text-red-900'
            }`}
          >
            {feedback.type === 'success' ? (
              <FiCheckCircle className="text-emerald-600 mt-0.5 flex-shrink-0" size={20} />
            ) : (
              <FiAlertCircle className="text-red-600 mt-0.5 flex-shrink-0" size={20} />
            )}
            <div className="text-sm font-medium flex-grow">{feedback.message}</div>
            <button
              onClick={() => setFeedback(null)}
              className="text-secondary-400 hover:text-secondary-600 text-sm font-bold"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container py-8 space-y-8">
        {/* Token Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-5 bg-white border border-secondary-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-secondary-500 text-sm font-medium">
              <span>Token Symbol</span>
              <span className="p-2 bg-primary-50 rounded-lg text-primary-600">
                <FaCoins size={18} />
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-secondary-900">{tokenInfo.symbol}</div>
              <div className="text-xs text-secondary-500 mt-0.5">{tokenInfo.name} ({tokenInfo.decimals} Decimals)</div>
            </div>
          </div>

          <div className="card p-5 bg-white border border-secondary-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-secondary-500 text-sm font-medium">
              <span>Total Supply</span>
              <span className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                <FiDollarSign size={18} />
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-secondary-900">
                {Number(tokenInfo.totalSupply).toLocaleString()}
              </div>
              <div className="text-xs text-emerald-600 font-medium mt-0.5">
                Active Circulating Supply
              </div>
            </div>
          </div>

          <div className="card p-5 bg-white border border-secondary-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-secondary-500 text-sm font-medium">
              <span>Active Accounts</span>
              <span className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                <FiDatabase size={18} />
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-secondary-900">
                {tokenInfo.totalHolders || accounts.length}
              </div>
              <div className="text-xs text-secondary-500 mt-0.5">
                Wallets with token balances
              </div>
            </div>
          </div>

          <div className="card p-5 bg-white border border-secondary-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-secondary-500 text-sm font-medium">
              <span>Ledger Transactions</span>
              <span className="p-2 bg-amber-50 rounded-lg text-amber-600">
                <FiActivity size={18} />
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-secondary-900">
                {tokenInfo.totalTransactions || transactions.length}
              </div>
              <div className="text-xs text-amber-700 font-medium mt-0.5 flex items-center">
                <FaCube className="mr-1" /> Block #{tokenInfo.currentBlock || 18452000}
              </div>
            </div>
          </div>
        </div>

        {/* Contract Address & Quick Details Strip */}
        <div className="bg-white rounded-lg border border-secondary-200 p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center space-x-2 text-secondary-600">
            <FiShield className="text-primary-600 flex-shrink-0" size={16} />
            <span className="font-semibold text-secondary-800">Contract Address:</span>
            <code className="bg-secondary-100 px-2 py-0.5 rounded text-secondary-800 font-mono text-xs break-all">
              {tokenInfo.contractAddress}
            </code>
            <button
              onClick={() => copyToClipboard(tokenInfo.contractAddress, 'contract_addr')}
              className="text-secondary-400 hover:text-primary-600 p-1"
              title="Copy Contract Address"
            >
              {copiedKey === 'contract_addr' ? <FiCheck className="text-green-600" /> : <FiCopy />}
            </button>
          </div>
          <div className="text-secondary-500 text-xs">
            Architecture: <span className="font-medium text-secondary-700">Self-Contained Pure Solidity ^0.8.0</span>
          </div>
        </div>

        {/* Operations Hub (Navigation Tabs & Action Panels) */}
        <div className="card bg-white border border-secondary-200 shadow-md overflow-hidden">
          {/* Tab Navigation */}
          <div className="flex border-b border-secondary-200 bg-secondary-50/50 overflow-x-auto">
            <button
              id="tab-transfer"
              onClick={() => setActiveTab('transfer')}
              className={`flex items-center space-x-2 px-6 py-4 text-sm font-semibold border-b-2 transition whitespace-nowrap ${
                activeTab === 'transfer'
                  ? 'border-primary-600 text-primary-600 bg-white'
                  : 'border-transparent text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100/50'
              }`}
            >
              <FaExchangeAlt />
              <span>Transfer Tokens</span>
            </button>

            <button
              id="tab-mint"
              onClick={() => setActiveTab('mint')}
              className={`flex items-center space-x-2 px-6 py-4 text-sm font-semibold border-b-2 transition whitespace-nowrap ${
                activeTab === 'mint'
                  ? 'border-primary-600 text-primary-600 bg-white'
                  : 'border-transparent text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100/50'
              }`}
            >
              <FiPlusCircle />
              <span>Mint / Burn Tokens</span>
            </button>

            <button
              id="tab-checker"
              onClick={() => setActiveTab('checker')}
              className={`flex items-center space-x-2 px-6 py-4 text-sm font-semibold border-b-2 transition whitespace-nowrap ${
                activeTab === 'checker'
                  ? 'border-primary-600 text-primary-600 bg-white'
                  : 'border-transparent text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100/50'
              }`}
            >
              <FiSearch />
              <span>Balance Checker & Explorer</span>
            </button>

            <button
              id="tab-contract"
              onClick={() => setActiveTab('contract')}
              className={`flex items-center space-x-2 px-6 py-4 text-sm font-semibold border-b-2 transition whitespace-nowrap ${
                activeTab === 'contract'
                  ? 'border-primary-600 text-primary-600 bg-white'
                  : 'border-transparent text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100/50'
              }`}
            >
              <FiCode />
              <span>Smart Contract & API Spec</span>
            </button>
          </div>

          <div className="p-6 md:p-8">
            {/* TAB 1: TRANSFER TOKENS */}
            {activeTab === 'transfer' && (
              <div className="max-w-3xl mx-auto">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-secondary-900">Transfer Tokens</h3>
                  <p className="text-sm text-secondary-600 mt-1">
                    Simulate execution of smart contract method <code className="text-xs bg-secondary-100 px-1.5 py-0.5 rounded font-mono">transfer(address to, uint256 amount)</code>.
                  </p>
                </div>

                <form onSubmit={handleTransfer} className="space-y-6">
                  {/* Sender Account */}
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Sender Account (From)
                    </label>
                    <select
                      id="select-transfer-from"
                      className="input py-2.5 font-mono text-sm"
                      value={transferForm.from}
                      onChange={(e) => setTransferForm({ ...transferForm, from: e.target.value })}
                      required
                    >
                      <option value="">Select a sender account...</option>
                      {accounts.map(acc => (
                        <option key={acc.address} value={acc.address}>
                          {acc.label} ({acc.address.substring(0, 8)}... - Balance: {acc.balance.toLocaleString()} RNT)
                        </option>
                      ))}
                    </select>
                    {transferForm.from && (
                      <div className="mt-1.5 flex justify-between items-center text-xs text-secondary-500">
                        <span>Available Balance: <strong>{getSenderBalance(transferForm.from).toLocaleString()} {tokenInfo.symbol}</strong></span>
                        <button
                          type="button"
                          onClick={() => setTransferForm({ ...transferForm, amount: getSenderBalance(transferForm.from).toString() })}
                          className="text-primary-600 hover:underline font-semibold"
                        >
                          Use Max
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Recipient Account */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-secondary-700">
                        Recipient Address (To)
                      </label>
                      <span className="text-xs text-secondary-500">Or pick from test wallets below</span>
                    </div>
                    <input
                      id="input-transfer-to"
                      type="text"
                      placeholder="0x..."
                      className="input py-2.5 font-mono text-sm"
                      value={transferForm.to}
                      onChange={(e) => setTransferForm({ ...transferForm, to: e.target.value })}
                      required
                    />
                    {/* Quick Pick Chips */}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {accounts.map(acc => (
                        <button
                          key={acc.address}
                          type="button"
                          onClick={() => setTransferForm({ ...transferForm, to: acc.address })}
                          className="text-xs px-2.5 py-1 rounded bg-secondary-100 hover:bg-primary-100 hover:text-primary-700 text-secondary-700 transition"
                        >
                          {acc.label.split(' ')[0]} ({acc.address.substring(0, 6)}...)
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Amount & Memo */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Amount ({tokenInfo.symbol})
                      </label>
                      <div className="relative">
                        <input
                          id="input-transfer-amount"
                          type="number"
                          min="1"
                          step="any"
                          placeholder="e.g. 500"
                          className="input py-2.5 pr-14 text-sm"
                          value={transferForm.amount}
                          onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                          required
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-xs font-bold text-secondary-500">
                          {tokenInfo.symbol}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Transaction Memo / Reference
                      </label>
                      <input
                        id="input-transfer-memo"
                        type="text"
                        placeholder="e.g. Monthly rent payout, deposit"
                        className="input py-2.5 text-sm"
                        value={transferForm.memo}
                        onChange={(e) => setTransferForm({ ...transferForm, memo: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Transaction Gas Preview */}
                  <div className="bg-secondary-50 p-4 rounded-lg border border-secondary-200 text-xs text-secondary-600 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-secondary-800">Simulated Execution:</span> Standard EVM gas estimation (~38,000 gas)
                    </div>
                    <div className="font-medium text-green-700">Instant Local Confirmation</div>
                  </div>

                  <button
                    id="btn-submit-transfer"
                    type="submit"
                    disabled={actionLoading}
                    className="btn w-full py-3 flex items-center justify-center text-base"
                  >
                    {actionLoading ? (
                      <span className="flex items-center">
                        <FiRefreshCw className="animate-spin mr-2" /> Processing Contract Execution...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <FiSend className="mr-2" /> Execute Transfer
                      </span>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* TAB 2: MINT / BURN TOKENS */}
            {activeTab === 'mint' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
                {/* Minting Column */}
                <div className="border border-secondary-200 rounded-lg p-6 bg-white shadow-sm">
                  <div className="flex items-center space-x-2 text-primary-600 font-bold mb-1">
                    <FiPlusCircle size={20} />
                    <h3 className="text-lg text-secondary-900">Mint New Tokens</h3>
                  </div>
                  <p className="text-xs text-secondary-600 mb-5">
                    Simulate contract method <code className="bg-secondary-100 px-1 py-0.5 rounded font-mono">mint(address to, uint256 amount)</code> to increase total circulating supply.
                  </p>

                  <form onSubmit={handleMint} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-secondary-700 mb-1">
                        Recipient Address (To)
                      </label>
                      <input
                        id="input-mint-to"
                        type="text"
                        placeholder="0x..."
                        className="input py-2 font-mono text-xs"
                        value={mintForm.to}
                        onChange={(e) => setMintForm({ ...mintForm, to: e.target.value })}
                        required
                      />
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {accounts.slice(0, 3).map(acc => (
                          <button
                            key={acc.address}
                            type="button"
                            onClick={() => setMintForm({ ...mintForm, to: acc.address })}
                            className="text-[11px] px-2 py-0.5 rounded bg-secondary-100 hover:bg-primary-100 text-secondary-700"
                          >
                            {acc.label.split(' ')[0]}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-secondary-700 mb-1">
                        Amount to Mint ({tokenInfo.symbol})
                      </label>
                      <input
                        id="input-mint-amount"
                        type="number"
                        min="1"
                        placeholder="e.g. 10000"
                        className="input py-2 text-xs"
                        value={mintForm.amount}
                        onChange={(e) => setMintForm({ ...mintForm, amount: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-secondary-700 mb-1">
                        Account Label / Tag (Optional)
                      </label>
                      <input
                        id="input-mint-label"
                        type="text"
                        placeholder="e.g. Strategic Real Estate Partner"
                        className="input py-2 text-xs"
                        value={mintForm.label}
                        onChange={(e) => setMintForm({ ...mintForm, label: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-secondary-700 mb-1">
                        Minting Memo / Purpose
                      </label>
                      <input
                        id="input-mint-memo"
                        type="text"
                        placeholder="e.g. Property tokenization liquidity grant"
                        className="input py-2 text-xs"
                        value={mintForm.memo}
                        onChange={(e) => setMintForm({ ...mintForm, memo: e.target.value })}
                      />
                    </div>

                    <button
                      id="btn-submit-mint"
                      type="submit"
                      disabled={actionLoading}
                      className="btn w-full py-2.5 text-sm flex items-center justify-center"
                    >
                      <FiPlusCircle className="mr-1.5" /> Execute Mint
                    </button>
                  </form>
                </div>

                {/* Burning Column */}
                <div className="border border-secondary-200 rounded-lg p-6 bg-white shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center space-x-2 text-red-600 font-bold mb-1">
                      <FiTrash2 size={20} />
                      <h3 className="text-lg text-secondary-900">Burn Tokens</h3>
                    </div>
                    <p className="text-xs text-secondary-600 mb-5">
                      Simulate contract method <code className="bg-secondary-100 px-1 py-0.5 rounded font-mono">burn(uint256 amount)</code> to permanently destroy tokens and reduce supply.
                    </p>

                    <form onSubmit={handleBurn} className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-secondary-700 mb-1">
                          Source Account (From)
                        </label>
                        <select
                          id="select-burn-from"
                          className="input py-2 font-mono text-xs"
                          value={burnForm.from}
                          onChange={(e) => setBurnForm({ ...burnForm, from: e.target.value })}
                          required
                        >
                          <option value="">Select account...</option>
                          {accounts.map(acc => (
                            <option key={acc.address} value={acc.address}>
                              {acc.label} ({acc.balance.toLocaleString()} RNT)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-secondary-700 mb-1">
                          Amount to Burn ({tokenInfo.symbol})
                        </label>
                        <input
                          id="input-burn-amount"
                          type="number"
                          min="1"
                          placeholder="e.g. 5000"
                          className="input py-2 text-xs"
                          value={burnForm.amount}
                          onChange={(e) => setBurnForm({ ...burnForm, amount: e.target.value })}
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-secondary-700 mb-1">
                          Burn Memo / Reason
                        </label>
                        <input
                          id="input-burn-memo"
                          type="text"
                          placeholder="e.g. Property buyout redemption"
                          className="input py-2 text-xs"
                          value={burnForm.memo}
                          onChange={(e) => setBurnForm({ ...burnForm, memo: e.target.value })}
                        />
                      </div>

                      <button
                        id="btn-submit-burn"
                        type="submit"
                        disabled={actionLoading}
                        className="w-full inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none transition"
                      >
                        <FiTrash2 className="mr-1.5" /> Execute Token Burn
                      </button>
                    </form>
                  </div>

                  <div className="mt-4 p-3 bg-red-50 rounded text-[11px] text-red-700 border border-red-100">
                    <strong>Note:</strong> Burning transfers tokens to dead address <code className="font-mono">0x0000...0000</code> and decreases Total Supply.
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: BALANCE CHECKER & EXPLORER */}
            {activeTab === 'checker' && (
              <div className="max-w-4xl mx-auto space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-secondary-900">Balance Checker & Account Inspector</h3>
                  <p className="text-sm text-secondary-600 mt-1">
                    Call smart contract method <code className="text-xs bg-secondary-100 px-1.5 py-0.5 rounded font-mono">balanceOf(address account)</code> to check live holdings and transaction audit trail.
                  </p>
                </div>

                {/* Search Bar */}
                <div className="flex gap-2">
                  <div className="relative flex-grow">
                    <FiSearch className="absolute left-3.5 top-3.5 text-secondary-400" size={18} />
                    <input
                      id="input-check-address"
                      type="text"
                      placeholder="Enter Ethereum address (0x...) or click a test wallet below"
                      className="input pl-10 py-2.5 font-mono text-sm"
                      value={checkerAddress}
                      onChange={(e) => setCheckerAddress(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleQueryBalance()}
                    />
                  </div>
                  <button
                    id="btn-query-balance"
                    onClick={() => handleQueryBalance()}
                    disabled={actionLoading}
                    className="btn px-6"
                  >
                    Check Balance
                  </button>
                </div>

                {/* Quick Account Chips */}
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="text-secondary-500 font-medium">Quick inspect:</span>
                  {accounts.map(acc => (
                    <button
                      key={acc.address}
                      onClick={() => handleQueryBalance(acc.address)}
                      className="px-2.5 py-1 bg-secondary-100 hover:bg-primary-50 hover:text-primary-600 rounded text-secondary-700 transition"
                    >
                      {acc.label}
                    </button>
                  ))}
                </div>

                {/* Queried Account Card */}
                {queriedAccount && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-secondary-200 rounded-lg p-6 bg-secondary-50/50 space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-secondary-200 pb-4">
                      <div>
                        <div className="text-xs text-secondary-500 font-medium">Target Account</div>
                        <div className="font-mono text-sm font-bold text-secondary-900 break-all">
                          {queriedAccount.address}
                        </div>
                        {queriedAccount.label && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-semibold rounded">
                            {queriedAccount.label}
                          </span>
                        )}
                      </div>
                      <div className="text-left sm:text-right">
                        <div className="text-xs text-secondary-500 font-medium">Verified Balance</div>
                        <div className="text-2xl font-black text-primary-600">
                          {queriedAccount.formattedBalance}
                        </div>
                      </div>
                    </div>

                    {/* Account Activity in Queried Results */}
                    <div>
                      <h4 className="text-xs font-bold text-secondary-700 uppercase tracking-wider mb-2">
                        Account Transaction History ({queriedAccount.history ? queriedAccount.history.length : 0})
                      </h4>
                      {queriedAccount.history && queriedAccount.history.length > 0 ? (
                        <div className="divide-y divide-secondary-200 border border-secondary-200 rounded bg-white max-h-60 overflow-y-auto">
                          {queriedAccount.history.map((tx, idx) => (
                            <div key={idx} className="p-3 text-xs flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                                  tx.type === 'MINT' ? 'bg-green-100 text-green-700' :
                                  tx.type === 'TRANSFER' ? 'bg-blue-100 text-blue-700' :
                                  tx.type === 'BURN' ? 'bg-red-100 text-red-700' : 'bg-purple-100 text-purple-700'
                                }`}>
                                  {tx.type}
                                </span>
                                <span className="font-mono text-secondary-600">
                                  {tx.from === queriedAccount.address ? `Sent to ${tx.to.substring(0, 8)}...` : `Received from ${tx.from.substring(0, 8)}...`}
                                </span>
                              </div>
                              <div className="font-bold text-secondary-900">
                                {tx.amount.toLocaleString()} {tokenInfo.symbol}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-secondary-500 py-3 italic bg-white border border-secondary-200 rounded text-center">
                          No transaction history recorded yet for this address.
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* TAB 4: SMART CONTRACT CODE & API SPEC */}
            {activeTab === 'contract' && (
              <div className="max-w-5xl mx-auto space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-secondary-900">Smart Contract Source & Integration</h3>
                  <p className="text-sm text-secondary-600 mt-1">
                    Pure Solidity smart contract code (<code className="font-mono text-xs">contracts/TokenLedger.sol</code>), complete ABI schema, and developer integration snippets.
                  </p>
                </div>

                {/* Sub-selector */}
                <div className="flex space-x-2 border-b border-secondary-200 pb-2">
                  <button
                    onClick={() => setSelectedSnippet('solidity')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded ${
                      selectedSnippet === 'solidity' ? 'bg-primary-600 text-white' : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                    }`}
                  >
                    TokenLedger.sol (Solidity)
                  </button>
                  <button
                    onClick={() => setSelectedSnippet('ethersJs')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded ${
                      selectedSnippet === 'ethersJs' ? 'bg-primary-600 text-white' : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                    }`}
                  >
                    Ethers.js Client Integration
                  </button>
                  <button
                    onClick={() => setSelectedSnippet('restApi')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded ${
                      selectedSnippet === 'restApi' ? 'bg-primary-600 text-white' : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                    }`}
                  >
                    REST API Documentation
                  </button>
                  <button
                    onClick={() => setSelectedSnippet('abi')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded ${
                      selectedSnippet === 'abi' ? 'bg-primary-600 text-white' : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                    }`}
                  >
                    Contract ABI (JSON)
                  </button>
                </div>

                {/* Code Display Area */}
                <div className="relative">
                  <div className="absolute right-3 top-3 z-10">
                    <button
                      onClick={() => {
                        let text = '';
                        if (selectedSnippet === 'solidity') text = contractDetails?.sourceCode || '';
                        else if (selectedSnippet === 'ethersJs') text = contractDetails?.integrationSnippet?.ethersJs || '';
                        else if (selectedSnippet === 'restApi') text = contractDetails?.integrationSnippet?.restApi || '';
                        else if (selectedSnippet === 'abi') text = JSON.stringify(contractDetails?.abi || [], null, 2);
                        copyToClipboard(text, 'snippet_copy');
                      }}
                      className="px-3 py-1.5 bg-secondary-800 hover:bg-secondary-700 text-secondary-200 text-xs rounded flex items-center space-x-1.5 shadow"
                    >
                      {copiedKey === 'snippet_copy' ? (
                        <>
                          <FiCheck className="text-green-400" /> <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <FiCopy /> <span>Copy Code</span>
                        </>
                      )}
                    </button>
                  </div>

                  <pre className="bg-secondary-900 text-secondary-100 p-5 rounded-lg text-xs font-mono overflow-x-auto max-h-96 leading-relaxed">
                    {selectedSnippet === 'solidity' && (contractDetails?.sourceCode || '// Loading contract source...')}
                    {selectedSnippet === 'ethersJs' && (contractDetails?.integrationSnippet?.ethersJs || '// Ethers.js integration code')}
                    {selectedSnippet === 'restApi' && (contractDetails?.integrationSnippet?.restApi || '// REST API code')}
                    {selectedSnippet === 'abi' && JSON.stringify(contractDetails?.abi || [], null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Active Accounts & Wallets Table */}
        <div className="card bg-white border border-secondary-200 shadow-md p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-lg font-bold text-secondary-900">Active Testnet Wallets & Balances</h3>
              <p className="text-xs text-secondary-500">
                Pre-configured test accounts and dynamically created wallets in the ledger simulation.
              </p>
            </div>
            <button
              onClick={() => {
                const randomHex = '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
                handleFaucet(randomHex);
              }}
              className="btn-secondary text-xs"
            >
              + Generate New Test Wallet
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-secondary-50 text-secondary-600 border-b border-secondary-200">
                  <th className="py-3 px-4 font-semibold">Account Label</th>
                  <th className="py-3 px-4 font-semibold">Ethereum Address</th>
                  <th className="py-3 px-4 font-semibold text-right">Balance ({tokenInfo.symbol})</th>
                  <th className="py-3 px-4 font-semibold text-right">Supply Share</th>
                  <th className="py-3 px-4 font-semibold text-center">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {accounts.map((acc, idx) => (
                  <tr key={acc.address} className="hover:bg-secondary-50/70 transition">
                    <td className="py-3 px-4 font-medium text-secondary-900">
                      <span className="font-semibold">{acc.label}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-secondary-600">
                      <div className="flex items-center space-x-1.5">
                        <span>{acc.address}</span>
                        <button
                          onClick={() => copyToClipboard(acc.address, `acc_${idx}`)}
                          className="text-secondary-400 hover:text-primary-600"
                          title="Copy Address"
                        >
                          {copiedKey === `acc_${idx}` ? <FiCheck className="text-green-600" /> : <FiCopy size={12} />}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-secondary-900">
                      {acc.balance.toLocaleString()} {tokenInfo.symbol}
                    </td>
                    <td className="py-3 px-4 text-right text-secondary-500">
                      {acc.percentageOfSupply}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => {
                            setTransferForm(prev => ({ ...prev, from: acc.address }));
                            setActiveTab('transfer');
                          }}
                          className="px-2 py-1 bg-primary-50 hover:bg-primary-100 text-primary-700 rounded text-[11px]"
                          title="Transfer from this account"
                        >
                          Transfer
                        </button>
                        <button
                          onClick={() => {
                            setMintForm(prev => ({ ...prev, to: acc.address }));
                            setActiveTab('mint');
                          }}
                          className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-[11px]"
                          title="Mint to this account"
                        >
                          Mint
                        </button>
                        <button
                          onClick={() => {
                            handleQueryBalance(acc.address);
                            setActiveTab('checker');
                          }}
                          className="px-2 py-1 bg-secondary-100 hover:bg-secondary-200 text-secondary-700 rounded text-[11px]"
                          title="Inspect account"
                        >
                          Inspect
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Transaction History & Blockchain Audit Trail */}
        <div className="card bg-white border border-secondary-200 shadow-md p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-secondary-900 flex items-center">
                <FiActivity className="text-primary-600 mr-2" />
                Ledger Transaction Audit Trail
              </h3>
              <p className="text-xs text-secondary-500 mt-0.5">
                Real-time record of all smart contract events, mints, and transfers executed on the ledger.
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-md shadow-sm border border-secondary-200 bg-secondary-50 p-0.5 text-xs font-medium">
                {['ALL', 'TRANSFER', 'MINT', 'BURN', 'FAUCET'].map(type => (
                  <button
                    key={type}
                    onClick={() => setTxFilterType(type)}
                    className={`px-3 py-1 rounded ${
                      txFilterType === type
                        ? 'bg-white text-primary-600 shadow-sm font-semibold'
                        : 'text-secondary-600 hover:text-secondary-900'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Filter by hash, address, memo..."
                  className="input py-1 px-2.5 text-xs w-48 sm:w-60"
                  value={txSearchQuery}
                  onChange={(e) => setTxSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-secondary-50 text-secondary-600 border-b border-secondary-200">
                  <th className="py-3 px-3 font-semibold">Tx Hash & Block</th>
                  <th className="py-3 px-3 font-semibold">Action</th>
                  <th className="py-3 px-3 font-semibold">From / To</th>
                  <th className="py-3 px-3 font-semibold text-right">Amount</th>
                  <th className="py-3 px-3 font-semibold">Memo / Reference</th>
                  <th className="py-3 px-3 font-semibold text-right">Time & Gas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((tx) => (
                    <tr key={tx.id || tx.txHash} className="hover:bg-secondary-50/70 transition">
                      <td className="py-3 px-3">
                        <div className="font-mono text-secondary-800 flex items-center space-x-1">
                          <span>{tx.txHash ? `${tx.txHash.substring(0, 10)}...${tx.txHash.substring(tx.txHash.length - 4)}` : `#${tx.id}`}</span>
                          {tx.txHash && (
                            <button
                              onClick={() => copyToClipboard(tx.txHash, `tx_${tx.id}`)}
                              className="text-secondary-400 hover:text-primary-600"
                              title="Copy Tx Hash"
                            >
                              {copiedKey === `tx_${tx.id}` ? <FiCheck className="text-green-600" /> : <FiCopy size={11} />}
                            </button>
                          )}
                        </div>
                        <div className="text-[10px] text-secondary-400 font-mono">
                          Block #{tx.blockNumber || 18452000}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          tx.type === 'MINT' ? 'bg-green-100 text-green-800' :
                          tx.type === 'TRANSFER' ? 'bg-blue-100 text-blue-800' :
                          tx.type === 'BURN' ? 'bg-red-100 text-red-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {tx.type}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-mono text-secondary-700">
                        <div className="flex flex-col">
                          <span className="text-secondary-500 text-[10px]">
                            From: <strong className="text-secondary-700">{tx.fromLabel || (tx.from ? `${tx.from.substring(0, 8)}...` : '0x0')}</strong>
                          </span>
                          <span className="text-secondary-500 text-[10px]">
                            To: <strong className="text-secondary-700">{tx.toLabel || (tx.to ? `${tx.to.substring(0, 8)}...` : '0x0')}</strong>
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right font-bold text-secondary-900">
                        {tx.amount.toLocaleString()} {tokenInfo.symbol}
                      </td>

                      <td className="py-3 px-3 text-secondary-600 max-w-xs truncate">
                        {tx.memo || 'Standard transaction'}
                      </td>

                      <td className="py-3 px-3 text-right text-secondary-500">
                        <div>{new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                        <div className="text-[10px] text-secondary-400 font-mono">{tx.gasUsed?.toLocaleString() || 21000} gas</div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-secondary-400 italic">
                      No transactions matched the selected filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
