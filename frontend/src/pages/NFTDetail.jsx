import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useWeb3 } from "../context/Web3Context";
import { useContracts } from "../hooks/useContracts";
import { DEMO_NFTS } from "../utils/constants";
import "./NFTDetail.css";

export default function NFTDetail() {
  const { id } = useParams();
  const { account, connectWallet, shortenAddress } = useWeb3();
  const { buyNFT, placeBid } = useContracts();
  const [loading, setLoading] = useState(false);
  const [txStatus, setTxStatus] = useState(null);
  const [bidAmount, setBidAmount] = useState("");
  const [activeTab, setActiveTab] = useState("details");

  const nft = DEMO_NFTS.find((n) => n.id === parseInt(id));
  if (!nft) return <div className="container"><h2>NFT not found</h2></div>;

  const handleBuyNow = async () => {
    if (!account) {
      await connectWallet();
      return;
    }

    setLoading(true);
    setTxStatus(null);

    try {
      // For demo NFTs, the listingId matches the NFT id
      const result = await buyNFT(nft.id, nft.price);

      if (result.success) {
        setTxStatus({
          type: "success",
          message: `NFT purchased! TX: ${result.hash.slice(0, 10)}...`,
        });
      } else {
        setTxStatus({
          type: "error",
          message: result.error,
        });
      }
    } catch (err) {
      setTxStatus({
        type: "error",
        message: err.message || "Transaction failed",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceBid = async () => {
    if (!account) {
      await connectWallet();
      return;
    }
    if (!bidAmount || parseFloat(bidAmount) <= 0) {
      setTxStatus({ type: "error", message: "Enter a valid bid amount" });
      return;
    }

    setLoading(true);
    setTxStatus(null);

    try {
      const result = await placeBid(nft.id, bidAmount);
      if (result.success) {
        setTxStatus({
          type: "success",
          message: `Bid placed! TX: ${result.hash.slice(0, 10)}...`,
        });
        setBidAmount("");
      } else {
        setTxStatus({ type: "error", message: result.error });
      }
    } catch (err) {
      setTxStatus({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="nft-detail container">
      <div className="nft-detail-grid">
        {/* Left: Image */}
        <div className="nft-image-section">
          <div className="nft-image-wrapper">
            <img src={nft.image} alt={nft.name} />
          </div>
        </div>

        {/* Right: Info */}
        <div className="nft-info-section">
          <p className="nft-collection">{nft.collection}</p>
          <h1 className="nft-title">{nft.name}</h1>

          <div className="nft-creators">
            <div className="creator-info">
              <div className="creator-avatar" style={{ background: "#4ade80" }} />
              <div>
                <span className="label">CREATOR</span>
                <span className="address">{shortenAddress(nft.creator)}</span>
              </div>
            </div>
            <div className="creator-info">
              <div className="creator-avatar" style={{ background: "#f472b6" }} />
              <div>
                <span className="label">OWNER</span>
                <span className="address">{shortenAddress(nft.owner)}</span>
              </div>
            </div>
          </div>

          {/* Price / Buy */}
          <div className="price-section glass">
            {nft.isAuction ? (
              <>
                <span className="label">HIGHEST BID</span>
                <div className="price">Ξ {nft.highestBid} ETH</div>
                <div className="bid-input-row">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Your bid in ETH"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    disabled={loading}
                  />
                  <button
                    className="btn-buy"
                    onClick={handlePlaceBid}
                    disabled={loading}
                  >
                    {loading ? "Placing Bid..." : "Place Bid"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <span className="label">PRICE</span>
                <div className="price">Ξ {nft.price} ETH</div>
                <button
                  className="btn-buy"
                  onClick={handleBuyNow}
                  disabled={loading}
                >
                  {loading ? "Processing..." : account ? "Buy Now" : "Connect Wallet to Buy"}
                </button>
              </>
            )}

            {/* Transaction Status */}
            {txStatus && (
              <div className={`tx-status ${txStatus.type}`}>
                {txStatus.type === "success" ? "✅" : "❌"} {txStatus.message}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="nft-tabs glass">
            <div className="tab-headers">
              {["details", "bids", "history"].map((tab) => (
                <button
                  key={tab}
                  className={`tab-btn ${activeTab === tab ? "active" : ""}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
            <div className="tab-content">
              {activeTab === "details" && (
                <div className="details-grid">
                  <div className="detail-row">
                    <span>Contract</span>
                    <span className="gradient-text">0x1234...5678</span>
                  </div>
                  <div className="detail-row">
                    <span>Token ID</span>
                    <span>#{nft.id}</span>
                  </div>
                  <div className="detail-row">
                    <span>Blockchain</span>
                    <span>Ethereum</span>
                  </div>
                  <div className="detail-row">
                    <span>Token Standard</span>
                    <span>ERC-721</span>
                  </div>
                  <div className="detail-row">
                    <span>Royalty</span>
                    <span>2.5%</span>
                  </div>
                </div>
              )}
              {activeTab === "bids" && (
                <p className="tab-empty">No bids yet</p>
              )}
              {activeTab === "history" && (
                <p className="tab-empty">No history available</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}