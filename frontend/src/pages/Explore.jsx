import React, { useState } from "react";
import { motion } from "framer-motion";
import MaskText from "../components/MaskText";
import NFTCard from "../components/NFTCard";
import { DEMO_NFTS } from "../utils/constants";
import "./Explore.css";

const categories = ["All", "Art", "Auction", "Photography", "Music", "Collectibles"];

const Explore = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");

  const filteredNFTs = DEMO_NFTS.filter((nft) => {
    const matchesSearch = nft.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      activeCategory === "All" ||
      (activeCategory === "Auction" && nft.isAuction);
    return matchesSearch && matchesCategory;
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
      <div className="explore__grid">
        {filteredNFTs.map((nft, index) => (
          <NFTCard key={nft.id} nft={nft} index={index} />
        ))}
      </div>

      {filteredNFTs.length === 0 && (
        <div className="explore__empty">
          <span className="explore__empty-icon">🎨</span>
          <p>No NFTs found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};

export default Explore;