import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import MaskText from "../components/MaskText";
import NFTCard from "../components/NFTCard";
import { useContracts } from "../hooks/useContracts";
import { ipfsToHTTP } from "../utils/helpers";
import "./Explore.css";

const categories = ["All", "Art", "Auction", "Photography", "Music", "Collectibles"];

const Explore = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [allNFTs, setAllNFTs] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const { fetchAllNFTs, fetchListings, fetchAuctions, getNFTContract } = useContracts();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [nfts, ls, auctions] = await Promise.all([fetchAllNFTs(), fetchListings(), fetchAuctions()]);
      // Merge listing price into NFT objects
      const merged = nfts.map((nft) => {
        const listing = ls.find((l) => Number(l.tokenId) === nft.tokenId);
        return {
          ...nft,
          id: nft.tokenId,
          image: nft.image,
          price: listing ? parseFloat(listing.price.toString()) / 1e18 : null,
          listingId: listing ? Number(listing.listingId) : null,
          isListed: !!listing,
          likes: 0,
          isAuction: false,
        };
      });

      // Build auction NFT entries
      const auctionItems = await Promise.all(
        auctions.map(async (a) => {
          let name = `NFT #${Number(a.tokenId)}`;
          let image = `https://picsum.photos/seed/nft${Number(a.tokenId)}/500/500`;
          try {
            const { ethers } = await import("ethers");
            const p = window.ethereum ? new ethers.BrowserProvider(window.ethereum) : null;
            if (p) {
              const nftC = getNFTContract(p);
              const uri = await nftC.tokenURI(a.tokenId);
              const metaURL = ipfsToHTTP(uri);
              const res = await fetch(metaURL);
              const meta = await res.json();
              name = meta.name || name;
              image = meta.image ? ipfsToHTTP(meta.image) : image;
            }
          } catch {}
          return {
            id: Number(a.tokenId),
            name,
            image,
            collection: "AuraVerse",
            price: parseFloat(a.startPrice.toString()) / 1e18,
            highestBid: parseFloat(a.highestBid.toString()) / 1e18,
            endTime: Number(a.endTime) * 1000,
            auctionId: Number(a.auctionId),
            isAuction: true,
            likes: 0,
            creator: a.seller,
            owner: a.seller,
          };
        })
      );

      setAllNFTs([...merged, ...auctionItems]);
      setListings(ls);
      setLoading(false);
    };
    load();
  }, []);

  const filteredNFTs = allNFTs
    .filter((nft) => {
      const matchesSearch = nft.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        activeCategory === "All" ||
        (activeCategory === "Auction" && nft.isAuction);
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === "price-low") return (a.price || 0) - (b.price || 0);
      if (sortBy === "price-high") return (b.price || 0) - (a.price || 0);
      if (sortBy === "popular") return (b.likes || 0) - (a.likes || 0);
      return (b.id || 0) - (a.id || 0); // recent
    });

  return (
    <div className="explore container">
      <div className="explore__header">
        <MaskText text="Explore NFTs" className="explore__title" tag="h1" />
        <p className="explore__subtitle">
          Browse the latest and most trending NFTs on the marketplace
        </p>
      </div>

      {/* Search & Filters */}
      <div className="explore__controls">
        <div className="explore__search glass">
          <span className="explore__search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search NFTs by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="explore__search-input"
          />
        </div>

        <select
          className="explore__sort glass"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="recent">Recently Added</option>
          <option value="price-low">Price: Low → High</option>
          <option value="price-high">Price: High → Low</option>
          <option value="popular">Most Popular</option>
        </select>
      </div>

      {/* Category Tabs */}
      <div className="explore__categories">
        {categories.map((cat) => (
          <motion.button
            key={cat}
            className={`explore__category ${activeCategory === cat ? "active" : ""}`}
            onClick={() => setActiveCategory(cat)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {cat}
          </motion.button>
        ))}
      </div>

      {/* Results count */}
      <p className="explore__results-count">
        Showing <span className="gradient-text">{filteredNFTs.length}</span> results
      </p>

      {/* NFT Grid */}
      {loading ? (
        <div className="explore__empty">
          <span className="explore__empty-icon">⏳</span>
          <p>Loading NFTs from blockchain...</p>
        </div>
      ) : (
        <div className="explore__grid">
          {filteredNFTs.map((nft, index) => (
            <NFTCard key={nft.id} nft={nft} index={index} />
          ))}
        </div>
      )}

      {!loading && filteredNFTs.length === 0 && (
        <div className="explore__empty">
          <span className="explore__empty-icon">🎨</span>
          <p>No NFTs found. Mint the first one!</p>
        </div>
      )}
    </div>
  );
};

export default Explore;