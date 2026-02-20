import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="footer glass">
      <div className="footer__inner container">
        <div className="footer__top">
          <div className="footer__brand">
            <Link to="/" className="footer__logo">
              <span className="footer__logo-icon">◆</span>
              <span className="footer__logo-text">AuraVerse</span>
            </Link>
            <p className="footer__tagline">
              The next generation NFT marketplace with live auctions,
              royalty support, and a stunning experience.
            </p>
          </div>

          <div className="footer__links-group">
            <h4 className="footer__heading">Marketplace</h4>
            <Link to="/explore" className="footer__link">Explore</Link>
            <Link to="/create" className="footer__link">Create</Link>
            <Link to="/profile" className="footer__link">Profile</Link>
          </div>

          <div className="footer__links-group">
            <h4 className="footer__heading">Resources</h4>
            <a href="#" className="footer__link">Docs</a>
            <a href="#" className="footer__link">FAQ</a>
            <a href="#" className="footer__link">Blog</a>
          </div>

          <div className="footer__links-group">
            <h4 className="footer__heading">Community</h4>
            <a href="#" className="footer__link">Discord</a>
            <a href="#" className="footer__link">Twitter</a>
            <a href="#" className="footer__link">GitHub</a>
          </div>
        </div>

        <div className="footer__bottom">
          <p>&copy; 2026 AuraVerse. All rights reserved.</p>
          <div className="footer__bottom-links">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;