import React, { useRef } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import AuctionTimer from "./AuctionTimer";
import { formatAddress } from "../utils/helpers";
import "./NFTCard.css";

const NFTCard = ({ nft, index = 0 }) => {
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03, 1.03, 1.03)`;
    card.style.setProperty("--mouse-x", `${x}px`);
    card.style.setProperty("--mouse-y", `${y}px`);
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Link to={`/nft/${nft.id}`}>
        <div
          ref={cardRef}
          className="nft-card glass"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <div className="nft-card__glow" />

          <div className="nft-card__image-wrapper">
            <img src={nft.image} alt={nft.name} className="nft-card__image" />
            {nft.isAuction && (
              <div className="nft-card__auction-badge">🔥 Live Auction</div>
            )}
            <div className="nft-card__overlay">
              <span className="nft-card__view">View Details →</span>
            </div>
          </div>

          <div className="nft-card__info">
            <p className="nft-card__collection">{nft.collection}</p>
            <h3 className="nft-card__name">{nft.name}</h3>

            <div className="nft-card__creator">
              <div className="nft-card__avatar" />
              <span>{formatAddress(nft.creator)}</span>
            </div>

            <div className="nft-card__footer">
              <div className="nft-card__price">
                <span className="nft-card__price-label">
                  {nft.isAuction ? "Current Bid" : "Price"}
                </span>
                <span className="nft-card__price-value">
                  <span className="eth-icon">Ξ</span>
                  {nft.isAuction ? nft.highestBid : nft.price}
                </span>
              </div>

              {nft.isAuction && nft.endTime && (
                <AuctionTimer endTime={nft.endTime} compact />
              )}

              <div className="nft-card__likes">
                <span>♡</span> {nft.likes}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default NFTCard;