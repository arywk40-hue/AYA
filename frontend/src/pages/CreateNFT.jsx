import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import MaskText from "../components/MaskText";
import { useWeb3 } from "../context/Web3Context";
import "./CreateNFT.css";

const CreateNFT = () => {
  const { account, connectWallet } = useWeb3();
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    collection: "",
    price: "",
    royalty: "2.5",
    listingType: "fixed",
    auctionDuration: "24",
  });

  const handleFileChange = (file) => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileChange(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!account) {
      connectWallet();
      return;
    }
    if (!preview) {
      alert("Please upload an image");
      return;
    }

    setIsMinting(true);
    try {
      // In production, upload to IPFS and call smart contract
      await new Promise((resolve) => setTimeout(resolve, 2000));
      alert("NFT Minted Successfully! 🎉");
    } catch (err) {
      console.error("Minting failed:", err);
      alert("Minting failed. Please try again.");
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <div className="create container">
      <div className="create__header">
        <MaskText text="Create Your NFT" className="create__title" tag="h1" />
        <p className="create__subtitle">
          Upload your artwork and mint it as an NFT on the Ethereum blockchain
        </p>
      </div>

      <form onSubmit={handleSubmit} className="create__form">
        <div className="create__layout">
          {/* Left - Upload */}
          <motion.div
            className="create__upload-section"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div
              className={`create__dropzone glass ${isDragging ? "dragging" : ""} ${preview ? "has-preview" : ""}`}
              onClick={() => fileInputRef.current.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              {preview ? (
                <>
                  <img src={preview} alt="Preview" className="create__preview" />
                  <div className="create__preview-overlay">
                    <span>Click to change</span>
                  </div>
                </>
              ) : (
                <div className="create__dropzone-content">
                  <span className="create__dropzone-icon">🖼️</span>
                  <p className="create__dropzone-title">
                    Drag & drop your file here
                  </p>
                  <p className="create__dropzone-hint">
                    PNG, JPG, GIF, WEBP. Max 50MB
                  </p>
                  <button type="button" className="create__dropzone-btn">
                    Browse Files
                  </button>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e.target.files[0])}
                hidden
              />
            </div>
          </motion.div>

          {/* Right - Form Fields */}
          <motion.div
            className="create__fields-section"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="create__field">
              <label className="create__label">Name *</label>
              <input
                type="text"
                name="name"
                placeholder="Enter NFT name"
                value={formData.name}
                onChange={handleChange}
                className="create__input glass"
                required
              />
            </div>

            <div className="create__field">
              <label className="create__label">Description</label>
              <textarea
                name="description"
                placeholder="Describe your NFT..."
                value={formData.description}
                onChange={handleChange}
                className="create__textarea glass"
                rows={4}
              />
            </div>

            <div className="create__field">
              <label className="create__label">Collection</label>
              <input
                type="text"
                name="collection"
                placeholder="e.g., Cosmic Series"
                value={formData.collection}
                onChange={handleChange}
                className="create__input glass"
              />
            </div>

            {/* Listing Type Toggle */}
            <div className="create__field">
              <label className="create__label">Listing Type</label>
              <div className="create__toggle-group">
                <button
                  type="button"
                  className={`create__toggle ${formData.listingType === "fixed" ? "active" : ""}`}
                  onClick={() => setFormData({ ...formData, listingType: "fixed" })}
                >
                  <span className="create__toggle-icon">🏷️</span>
                  Fixed Price
                </button>
                <button
                  type="button"
                  className={`create__toggle ${formData.listingType === "auction" ? "active" : ""}`}
                  onClick={() => setFormData({ ...formData, listingType: "auction" })}
                >
                  <span className="create__toggle-icon">⏱️</span>
                  Timed Auction
                </button>
              </div>
            </div>

            <div className="create__row">
              <div className="create__field create__field--half">
                <label className="create__label">
                  {formData.listingType === "auction" ? "Starting Price (ETH) *" : "Price (ETH) *"}
                </label>
                <input
                  type="number"
                  name="price"
                  step="0.001"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={handleChange}
                  className="create__input glass"
                  required
                />
              </div>

              <div className="create__field create__field--half">
                <label className="create__label">Royalty (%)</label>
                <input
                  type="number"
                  name="royalty"
                  step="0.5"
                  min="0"
                  max="10"
                  placeholder="2.5"
                  value={formData.royalty}
                  onChange={handleChange}
                  className="create__input glass"
                />
              </div>
            </div>

            {formData.listingType === "auction" && (
              <motion.div
                className="create__field"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <label className="create__label">Auction Duration</label>
                <select
                  name="auctionDuration"
                  value={formData.auctionDuration}
                  onChange={handleChange}
                  className="create__select glass"
                >
                  <option value="1">1 Hour</option>
                  <option value="6">6 Hours</option>
                  <option value="12">12 Hours</option>
                  <option value="24">24 Hours</option>
                  <option value="72">3 Days</option>
                  <option value="168">7 Days</option>
                  <option value="720">30 Days</option>
                </select>
              </motion.div>
            )}

            {/* Summary Card */}
            <div className="create__summary glass">
              <h4 className="create__summary-title">Summary</h4>
              <div className="create__summary-row">
                <span>Listing Type</span>
                <span>{formData.listingType === "auction" ? "Timed Auction" : "Fixed Price"}</span>
              </div>
              <div className="create__summary-row">
                <span>Platform Fee</span>
                <span>2.5%</span>
              </div>
              <div className="create__summary-row">
                <span>Creator Royalty</span>
                <span>{formData.royalty || "0"}%</span>
              </div>
              {formData.listingType === "auction" && (
                <div className="create__summary-row">
                  <span>Duration</span>
                  <span>{formData.auctionDuration}h</span>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              className="create__submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isMinting}
            >
              {isMinting ? (
                <span className="create__submit-loading">
                  <span className="create__spinner" />
                  Minting...
                </span>
              ) : account ? (
                <>
                  <span>🚀</span> Mint & List NFT
                </>
              ) : (
                "Connect Wallet to Mint"
              )}
            </motion.button>
          </motion.div>
        </div>
      </form>
    </div>
  );
};

export default CreateNFT;