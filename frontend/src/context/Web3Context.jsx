import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";

const Web3Context = createContext();

export const useWeb3 = () => useContext(Web3Context);

export function Web3Provider({ children }) {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask!");
      return;
    }
    try {
      setIsConnecting(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const network = await provider.getNetwork();

      setProvider(provider);
      setSigner(signer);
      setAccount(accounts[0]);
      setChainId(Number(network.chainId));
    } catch (err) {
      console.error("Connection failed:", err);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setChainId(null);
  }, []);

  const shortenAddress = (addr) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length > 0) setAccount(accounts[0]);
        else disconnectWallet();
      });
      window.ethereum.on("chainChanged", () => window.location.reload());
    }
  }, [disconnectWallet]);

  return (
    <Web3Context.Provider
      value={{
        account,
        provider,
        signer,
        chainId,
        isConnecting,
        connectWallet,
        disconnectWallet,
        shortenAddress,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}