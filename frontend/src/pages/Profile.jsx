import React, { useState } from "react";
import { motion } from "framer-motion";
import MaskText from "../components/MaskText";
import NFTCard from "../components/NFTCard";
import { useWeb3 } from "../context/Web3Context";
import { DEMO_NFTS } from "../utils/constants";
import { formatAddress } from "../utils/helpers";
import "./Profile.css";

const Profile = () => {
  const { account, connectWallet, shortenAddress } = useWeb3();
  const [activeTab, setActiveTab] = useState("owned");

  const tabs = [
    { id: "owned", label: "Owned", count: 4 },
    { id: "created", label: "Created", count: 2 },
    { id: "listed", label: "Listed", count: 3 },
    { id: "bids", label: "Active Bids", count: 1 },
    { id: "favorites", label: "Favorites", count: 6 },
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
              <span className="profile__stat-value gradient-text">12</span>
              <span className="profile__stat-label">Owned</span>
            </div>
            <div className="profile__stat">
              <span className="profile__stat-value gradient-text">5</span>
              <span className="profile__stat-label">Created</span>
            </div>
            <div className="profile__stat">
              <span className="profile__stat-value gradient-text">3.2</span>
              <span className="profile__stat-label">ETH Spent</span>
            </div>
            <div className="profile__stat">
              <span className="profile__stat-value gradient-text">8.7</span>
              <span className="profile__stat-label">ETH Earned</span>
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
          {activeTab === "owned" && (
            <div className="profile__grid">
              {DEMO_NFTS.slice(0, 4).map((nft, i) => (
                <NFTCard key={nft.id} nft={nft} index={i} />
              ))}
            </div>
          )}

          {activeTab === "created" && (
            <div className="profile__grid">
              {DEMO_NFTS.slice(0, 2).map((nft, i) => (
                <NFTCard key={nft.id} nft={nft} index={i} />
              ))}
            </div>
          )}

          {activeTab === "listed" && (
            <div className="profile__grid">
              {DEMO_NFTS.slice(1, 4).map((nft, i) => (
                <NFTCard key={nft.id} nft={nft} index={i} />
              ))}
            </div>
          )}

          {activeTab === "bids" && (
            <div className="profile__bids-list">
              {DEMO_NFTS.filter((n) => n.isAuction).map((nft, i) => (
                <motion.div
                  key={nft.id}
                  className="profile__bid-item glass"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <img src={nft.image} alt={nft.name} className="profile__bid-image" />
                  <div className="profile__bid-info">
                    <h4 className="profile__bid-name">{nft.name}</h4>
                    <p className="profile__bid-collection">{nft.collection}</p>
                  </div>
                  <div className="profile__bid-details">
                    <span className="profile__bid-label">Your Bid</span>
                    <span className="profile__bid-amount gradient-text">
                      Ξ {nft.highestBid}
                    </span>
                  </div>
                  <div className="profile__bid-status">
                    <span className="profile__bid-status-badge profile__bid-status-badge--leading">
                      Leading
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {activeTab === "favorites" && (
            <div className="profile__grid">
              {DEMO_NFTS.map((nft, i) => (
                <NFTCard key={nft.id} nft={nft} index={i} />
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;