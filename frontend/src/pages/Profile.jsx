import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import MaskText from "../components/MaskText";
import NFTCard from "../components/NFTCard";
import { useWeb3 } from "../context/Web3Context";
import { useContracts } from "../hooks/useContracts";
import { formatAddress } from "../utils/helpers";
import "./Profile.css";

const Profile = () => {
  const { account, connectWallet, shortenAddress } = useWeb3();
  const { fetchAllNFTs, fetchListings } = useContracts();
  const [activeTab, setActiveTab] = useState("owned");
  const [allNFTs, setAllNFTs] = useState([]);
  const [listings, setListings] = useState([]);
  const [loadingNFTs, setLoadingNFTs] = useState(false);

  useEffect(() => {
    if (!account) return;
    const load = async () => {
      setLoadingNFTs(true);
      const [nfts, ls] = await Promise.all([fetchAllNFTs(), fetchListings()]);
      const mapped = nfts.map((nft) => ({
        ...nft,
        id: nft.tokenId,
        price: null,
        likes: 0,
        isAuction: false,
      }));
      setAllNFTs(mapped);
      setListings(ls);
      setLoadingNFTs(false);
    };
    load();
  }, [account]);

  const ownedNFTs = allNFTs.filter((n) => n.owner?.toLowerCase() === account?.toLowerCase());
  const createdNFTs = allNFTs.filter((n) => n.creator?.toLowerCase() === account?.toLowerCase());
  const listedNFTs = listings
    .filter((l) => l.seller?.toLowerCase() === account?.toLowerCase() && l.isActive)
    .map((l) => allNFTs.find((n) => n.id === Number(l.tokenId)))
    .filter(Boolean);

  const tabs = [
    { id: "owned", label: "Owned", count: ownedNFTs.length },
    { id: "created", label: "Created", count: createdNFTs.length },
    { id: "listed", label: "Listed", count: listedNFTs.length },
  ];

  if (!account) {
    return (
      <div className="profile container">
        <div className="profile__connect">
          <motion.div
            className="profile__connect-card glass"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="profile__connect-icon">🔗</span>
            <MaskText text="Connect Your Wallet" className="profile__connect-title" tag="h2" />
            <p className="profile__connect-desc">
              Connect your wallet to view your profile, owned NFTs, and active bids.
            </p>
            <button className="profile__connect-btn" onClick={connectWallet}>
              Connect Wallet
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile">
      {/* Banner */}
      <div className="profile__banner">
        <div className="profile__banner-gradient" />
        <div className="profile__banner-grid" />
      </div>

      <div className="container">
        {/* Profile Info */}
        <motion.div
          className="profile__info"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="profile__avatar-wrapper">
            <div className="profile__avatar">
              <div className="profile__avatar-inner" />
            </div>
            <div className="profile__avatar-ring" />
          </div>

          <div className="profile__details">
            <h1 className="profile__name gradient-text">
              {shortenAddress(account)}
            </h1>
            <div className="profile__address glass">
              <span className="profile__address-dot" />
              <span>{account}</span>
              <button
                className="profile__copy-btn"
                onClick={() => navigator.clipboard.writeText(account)}
                title="Copy address"
              >
                📋
              </button>
            </div>
          </div>

          <div className="profile__stats">
            <div className="profile__stat">
              <span className="profile__stat-value gradient-text">{ownedNFTs.length}</span>
              <span className="profile__stat-label">Owned</span>
            </div>
            <div className="profile__stat">
              <span className="profile__stat-value gradient-text">{createdNFTs.length}</span>
              <span className="profile__stat-label">Created</span>
            </div>
            <div className="profile__stat">
              <span className="profile__stat-value gradient-text">{listedNFTs.length}</span>
              <span className="profile__stat-label">Listed</span>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="profile__tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`profile__tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              <span className="profile__tab-count">{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <motion.div
          className="profile__content"
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {loadingNFTs ? (
            <p style={{ color: "var(--text-secondary)" }}>Loading your NFTs...</p>
          ) : (
            <>
              {activeTab === "owned" && (
                <div className="profile__grid">
                  {ownedNFTs.length > 0 ? ownedNFTs.map((nft, i) => <NFTCard key={nft.id} nft={nft} index={i} />) : <p style={{ color: "var(--text-secondary)" }}>No NFTs owned yet.</p>}
                </div>
              )}
              {activeTab === "created" && (
                <div className="profile__grid">
                  {createdNFTs.length > 0 ? createdNFTs.map((nft, i) => <NFTCard key={nft.id} nft={nft} index={i} />) : <p style={{ color: "var(--text-secondary)" }}>No NFTs created yet.</p>}
                </div>
              )}
              {activeTab === "listed" && (
                <div className="profile__grid">
                  {listedNFTs.length > 0 ? listedNFTs.map((nft, i) => <NFTCard key={nft.id} nft={nft} index={i} />) : <p style={{ color: "var(--text-secondary)" }}>No active listings.</p>}
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;