import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useWeb3 } from "../context/Web3Context";
import { useContracts } from "../hooks/useContracts";
import { ipfsToHTTP, formatAddress } from "../utils/helpers";
import { NFT_COLLECTION_ADDRESS } from "../utils/constants";
import "./NFTDetail.css";

export default function NFTDetail() {
  const { id } = useParams();
  const { account, connectWallet, shortenAddress } = useWeb3();
  const { buyNFT, placeBid, endAuction, cancelListing, cancelAuction, withdrawBid, getNFTContract, fetchListings, fetchAuctions, fetchAuctionBids } = useContracts();
  const [loading, setLoading] = useState(false);
  const [txStatus, setTxStatus] = useState(null);
  const [bidAmount, setBidAmount] = useState("");
  const [activeTab, setActiveTab] = useState("details");
  const [nft, setNft] = useState(null);
  const [listing, setListing] = useState(null);
  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const load = async () => {
      setFetching(true);
      try {
        const { ethers } = await import("ethers");
        const p = window.ethereum ? new ethers.BrowserProvider(window.ethereum) : null;
        if (!p) { setFetching(false); return; }
        const nftContract = getNFTContract(p);
        const tokenId = parseInt(id);
        const uri = await nftContract.tokenURI(tokenId);
        const owner = await nftContract.ownerOf(tokenId);
        const creator = await nftContract.creators(tokenId);
        // Fetch metadata from IPFS
        let meta = {};
        try {
          const metaURL = ipfsToHTTP(uri);
          const res = await fetch(metaURL);
          meta = await res.json();
        } catch {}
        // Check marketplace listing
        const ls = await fetchListings();
        const activeListing = ls.find((l) => Number(l.tokenId) === tokenId);
        setListing(activeListing || null);
        // Check auction
        const auctions = await fetchAuctions();
        const activeAuction = auctions.find((a) => Number(a.tokenId) === tokenId);
        setAuction(activeAuction || null);
        // Fetch bids if auction exists
        if (activeAuction) {
          const bidHistory = await fetchAuctionBids(Number(activeAuction.auctionId));
          setBids(bidHistory);
        }

        const isAuction = !!activeAuction;
        setNft({
          id: tokenId,
          name: meta.name || `NFT #${tokenId}`,
          image: meta.image ? ipfsToHTTP(meta.image) : (uri.startsWith("http") ? uri : `https://picsum.photos/seed/nft${tokenId}/500/500`),
          description: meta.description || "",
          collection: meta.collection || "AuraVerse",
          creator,
          owner,
          price: activeListing ? parseFloat(activeListing.price.toString()) / 1e18 : null,
          listingId: activeListing ? Number(activeListing.listingId) : null,
          isAuction,
          auctionId: activeAuction ? Number(activeAuction.auctionId) : null,
          highestBid: activeAuction ? parseFloat(activeAuction.highestBid.toString()) / 1e18 : 0,
          endTime: activeAuction ? Number(activeAuction.endTime) * 1000 : null,
          seller: activeAuction ? activeAuction.seller : null,
          likes: 0,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setFetching(false);
      }
    };
    load();
  }, [id]);

  if (fetching) return <div className="container" style={{ paddingTop: "8rem", textAlign: "center" }}><p>Loading NFT...</p></div>;
  if (!nft) return <div className="container"><h2 style={{ paddingTop: "8rem" }}>NFT not found</h2></div>;

  const handleBuyNow = async () => {
    if (!account) { await connectWallet(); return; }
    if (!listing) { setTxStatus({ type: "error", message: "This NFT is not listed for sale" }); return; }
    setLoading(true); setTxStatus(null);
    try {
      const result = await buyNFT(listing.listingId, nft.price);
      if (result.success) setTxStatus({ type: "success", message: `NFT purchased! TX: ${result.hash.slice(0, 10)}...` });
      else setTxStatus({ type: "error", message: result.error });
    } catch (err) {
      setTxStatus({ type: "error", message: err.message || "Transaction failed" });
    } finally { setLoading(false); }
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
      const result = await placeBid(nft.auctionId, bidAmount);
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

  const handleEndAuction = async () => {
    setLoading(true); setTxStatus(null);
    try {
      const result = await endAuction(nft.auctionId);
      if (result.success) setTxStatus({ type: "success", message: "Auction ended!" });
      else setTxStatus({ type: "error", message: result.error });
    } catch (err) {
      setTxStatus({ type: "error", message: err.message });
    } finally { setLoading(false); }
  };

  const handleCancelListing = async () => {
    setLoading(true); setTxStatus(null);
    try {
      const result = await cancelListing(nft.listingId);
      if (result.success) setTxStatus({ type: "success", message: "Listing cancelled!" });
      else setTxStatus({ type: "error", message: result.error });
    } catch (err) {
      setTxStatus({ type: "error", message: err.message });
    } finally { setLoading(false); }
  };

  const handleCancelAuction = async () => {
    setLoading(true); setTxStatus(null);
    try {
      const result = await cancelAuction(nft.auctionId);
      if (result.success) setTxStatus({ type: "success", message: "Auction cancelled!" });
      else setTxStatus({ type: "error", message: result.error });
    } catch (err) {
      setTxStatus({ type: "error", message: err.message });
    } finally { setLoading(false); }
  };

  const handleWithdrawBid = async () => {
    setLoading(true); setTxStatus(null);
    try {
      const result = await withdrawBid(nft.auctionId);
      if (result.success) setTxStatus({ type: "success", message: "Bid withdrawn!" });
      else setTxStatus({ type: "error", message: result.error });
    } catch (err) {
      setTxStatus({ type: "error", message: err.message });
    } finally { setLoading(false); }
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
                {nft.endTime && (
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
                    Ends: {new Date(nft.endTime).toLocaleString()}
                  </p>
                )}
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
                {/* Seller controls */}
                {account && nft.seller && account.toLowerCase() === nft.seller.toLowerCase() && (
                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                    <button className="btn-buy" onClick={handleEndAuction} disabled={loading} style={{ flex: 1 }}>
                      End Auction
                    </button>
                    <button className="btn-buy" onClick={handleCancelAuction} disabled={loading} style={{ flex: 1, background: "#ef4444" }}>
                      Cancel Auction
                    </button>
                  </div>
                )}
                {/* Withdraw outbid funds */}
                {account && nft.seller && account.toLowerCase() !== nft.seller.toLowerCase() && (
                  <button className="btn-buy" onClick={handleWithdrawBid} disabled={loading} style={{ marginTop: "0.5rem", background: "#f59e0b" }}>
                    Withdraw Previous Bid
                  </button>
                )}
              </>
            ) : (
              <>
                <span className="label">PRICE</span>
                <div className="price">{nft.price ? `Ξ ${nft.price} ETH` : "Not listed"}</div>
                {nft.price && (
                  <button
                    className="btn-buy"
                    onClick={handleBuyNow}
                    disabled={loading}
                  >
                    {loading ? "Processing..." : account ? "Buy Now" : "Connect Wallet to Buy"}
                  </button>
                )}
                {/* Cancel listing (seller only) */}
                {account && listing && listing.seller && account.toLowerCase() === listing.seller.toLowerCase() && (
                  <button className="btn-buy" onClick={handleCancelListing} disabled={loading} style={{ marginTop: "0.5rem", background: "#ef4444" }}>
                    Cancel Listing
                  </button>
                )}
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
                    <span className="gradient-text">{shortenAddress(NFT_COLLECTION_ADDRESS)}</span>
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
                bids.length > 0 ? (
                  <div className="details-grid">
                    {bids.map((b, i) => (
                      <div key={i} className="detail-row">
                        <span>{shortenAddress(b.bidder)}</span>
                        <span>Ξ {parseFloat(b.amount.toString()) / 1e18} ETH</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="tab-empty">No bids yet</p>
                )
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