import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import MaskText from "../components/MaskText";
import NFTCard from "../components/NFTCard";
import { DEMO_NFTS } from "../utils/constants";
import "./Home.css";

const stats = [
  { label: "Artworks", value: "12.5K+" },
  { label: "Artists", value: "3.2K+" },
  { label: "Auctions", value: "890+" },
  { label: "ETH Volume", value: "5.4K+" },
];

const Home = () => {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

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

        <div className="featured__grid">
          {DEMO_NFTS.slice(0, 4).map((nft, index) => (
            <NFTCard key={nft.id} nft={nft} index={index} />
          ))}
        </div>
      </section>

      {/* ============ LIVE AUCTIONS ============ */}
      <section className="live-auctions container">
        <div className="featured__header">
          <MaskText text="Live Auctions" className="featured__title" tag="h2" />
        </div>

        <div className="featured__grid">
          {DEMO_NFTS.filter((n) => n.isAuction).map((nft, index) => (
            <NFTCard key={nft.id} nft={nft} index={index} />
          ))}
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