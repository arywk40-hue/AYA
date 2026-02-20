import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useWeb3 } from "../context/Web3Context";
import "./Navbar.css";

const Navbar = () => {
  const { account, connectWallet, disconnectWallet, shortenAddress, isConnecting } = useWeb3();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { path: "/", label: "Home" },
    { path: "/explore", label: "Explore" },
    { path: "/create", label: "Create" },
    { path: "/profile", label: "Profile" },
  ];

  return (
    <motion.nav
      className={`navbar glass ${scrolled ? "navbar--scrolled" : ""}`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="navbar__inner container">
        <Link to="/" className="navbar__logo">
          <span className="navbar__logo-icon">◆</span>
          <span className="navbar__logo-text">AuraVerse</span>
        </Link>

        <div className={`navbar__links ${mobileOpen ? "open" : ""}`}>
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`navbar__link ${location.pathname === link.path ? "active" : ""}`}
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
              {location.pathname === link.path && (
                <motion.div className="navbar__link-indicator" layoutId="navIndicator" />
              )}
            </Link>
          ))}
        </div>

        <div className="navbar__actions">
          {account ? (
            <div className="navbar__wallet" onClick={disconnectWallet}>
              <div className="navbar__wallet-dot" />
              <span>{shortenAddress(account)}</span>
            </div>
          ) : (
            <button className="navbar__connect-btn" onClick={connectWallet} disabled={isConnecting}>
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </button>
          )}
        </div>

        <button className="navbar__hamburger" onClick={() => setMobileOpen(!mobileOpen)}>
          <span className={mobileOpen ? "open" : ""} />
        </button>
      </div>
    </motion.nav>
  );
};

export default Navbar;