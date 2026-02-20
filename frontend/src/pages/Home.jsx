import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import MaskText from "../components/MaskText";
import NFTCard from "../components/NFTCard";
import { useContracts } from "../hooks/useContracts";
import { ipfsToHTTP } from "../utils/helpers";
import "./Home.css";

const stats = [
  { label: "Artworks", value: "12.5K+" },
  { label: "Artists", value: "3.2K+" },
  { label: "Auctions", value: "890+" },
  { label: "ETH Volume", value: "5.4K+" },
];

const Home = () => {
  const heroRef = useRef(null);
  const [nfts, setNfts] = useState([]);
  const [auctionNFTs, setAuctionNFTs] = useState([]);
  const { fetchAllNFTs, fetchAuctions, getNFTContract } = useContracts();
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  useEffect(() => {
    // Fetch minted NFTs
    fetchAllNFTs().then((items) => {
      setNfts(
        items.map((nft) => ({
          ...nft,
          id: nft.tokenId,
          price: "—",
          likes: 0,
          isAuction: false,
        }))
      );
    });
    // Fetch live auctions
    fetchAuctions().then(async (auctions) => {
      const mapped = await Promise.all(
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
      setAuctionNFTs(mapped);
    });
  }, []);

  return (
    <div className="home">
      {/* ============ HERO SECTION ============ */}
      <section className="hero" ref={heroRef}>
        <motion.div
          className="hero__content container"
          style={{ y: heroY, opacity: heroOpacity }}
        >
          <motion.div
            className="hero__badge"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <span className="hero__badge-dot" />
            Live Auctions Available
          </motion.div>

          <MaskText
            text="Discover Collect & Sell Extraordinary NFTs"
            className="hero__title"
            tag="h1"
          />

          <motion.p
            className="hero__subtitle"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            The premier marketplace for unique digital art. Buy, sell, and
            auction NFTs with built-in royalty support and stunning visuals.
          </motion.p>

          <motion.div
            className="hero__actions"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <Link to="/explore" className="hero__btn hero__btn--primary">
              Explore Collection
              <span className="hero__btn-arrow">→</span>
            </Link>
            <Link to="/create" className="hero__btn hero__btn--secondary">
              Create NFT
            </Link>
          </motion.div>

          {/* Floating orbs */}
          <div className="hero__orb hero__orb--1" />
          <div className="hero__orb hero__orb--2" />
          <div className="hero__orb hero__orb--3" />
        </motion.div>
      </section>

      {/* ============ STATS SECTION ============ */}
      <section className="stats container">
        <div className="stats__grid">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="stats__item glass"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <span className="stats__value gradient-text">{stat.value}</span>
              <span className="stats__label">{stat.label}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ============ FEATURED NFTs ============ */}
      <section className="featured container">
        <div className="featured__header">
          <MaskText text="Featured Artworks" className="featured__title" tag="h2" />
          <Link to="/explore" className="featured__see-all">
            See All <span>→</span>
          </Link>
        </div>

        {nfts.length > 0 ? (
          <div className="featured__grid">
            {nfts.slice(0, 4).map((nft, index) => (
              <NFTCard key={nft.id} nft={nft} index={index} />
            ))}
          </div>
        ) : (
          <div className="explore__empty">
            <span className="explore__empty-icon">🎨</span>
            <p>No NFTs yet. <Link to="/create">Mint the first one!</Link></p>
          </div>
        )}
      </section>

      {/* ============ LIVE AUCTIONS ============ */}
      <section className="live-auctions container">
        <div className="featured__header">
          <MaskText text="Live Auctions" className="featured__title" tag="h2" />
        </div>

        <div className="featured__grid">
          {auctionNFTs.map((nft, index) => (
            <NFTCard key={nft.id} nft={nft} index={index} />
          ))}
          {auctionNFTs.length === 0 && (
            <p style={{ color: "var(--text-secondary)" }}>No live auctions right now.</p>
          )}
        </div>
      </section>

      {/* ============ CTA SECTION ============ */}
      <section className="cta container">
        <motion.div
          className="cta__card glass"
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <MaskText text="Start Creating Today" className="cta__title" tag="h2" />
          <p className="cta__description">
            Join thousands of artists and collectors on AuraVerse. Mint your
            first NFT in minutes.
          </p>
          <Link to="/create" className="hero__btn hero__btn--primary">
            Get Started <span className="hero__btn-arrow">→</span>
          </Link>
        </motion.div>
      </section>
    </div>
  );
};

export default Home;