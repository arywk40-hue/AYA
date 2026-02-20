const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFT Marketplace & Auction", function () {
  let nftCollection, marketplace, auction;
  let owner, seller, buyer, bidder1, bidder2;
  const PLATFORM_FEE = 250; // 2.5%
  const ROYALTY_FEE = 250; // 2.5%

  beforeEach(async function () {
    [owner, seller, buyer, bidder1, bidder2] = await ethers.getSigners();

    // Deploy NFTCollection
    const NFTCollection = await ethers.getContractFactory("NFTCollection");
    nftCollection = await NFTCollection.deploy("AuraVerse", "AURA", ROYALTY_FEE);
    await nftCollection.waitForDeployment();

    // Deploy Marketplace
    const NFTMarketplace = await ethers.getContractFactory("NFTMarketplace");
    marketplace = await NFTMarketplace.deploy(PLATFORM_FEE);
    await marketplace.waitForDeployment();

    // Deploy Auction
    const NFTAuction = await ethers.getContractFactory("NFTAuction");
    auction = await NFTAuction.deploy(PLATFORM_FEE);
    await auction.waitForDeployment();
  });

  describe("NFTCollection", function () {
    it("Should mint an NFT", async function () {
      const tx = await nftCollection.connect(seller).mint("ipfs://test-uri-1");
      await tx.wait();

      expect(await nftCollection.ownerOf(0)).to.equal(seller.address);
      expect(await nftCollection.tokenURI(0)).to.equal("ipfs://test-uri-1");
      expect(await nftCollection.creators(0)).to.equal(seller.address);
    });

    it("Should return correct royalty info", async function () {
      const salePrice = ethers.parseEther("1");
      const [receiver, amount] = await nftCollection.royaltyInfo(0, salePrice);

      expect(receiver).to.equal(owner.address);
      expect(amount).to.equal(salePrice * BigInt(ROYALTY_FEE) / 10000n);
    });

    it("Should not allow royalty above 10%", async function () {
      await expect(
        nftCollection.setRoyaltyFee(1001)
      ).to.be.revertedWith("Max royalty is 10%");
    });
  });

  describe("NFTMarketplace", function () {
    beforeEach(async function () {
      // Mint an NFT for seller
      await nftCollection.connect(seller).mint("ipfs://test-uri-1");
      // Approve marketplace
      await nftCollection
        .connect(seller)
        .setApprovalForAll(await marketplace.getAddress(), true);
    });

    it("Should list an NFT", async function () {
      const price = ethers.parseEther("1");
      await marketplace
        .connect(seller)
        .listNFT(await nftCollection.getAddress(), 0, price);

      const listing = await marketplace.getActiveListing(0);
      expect(listing.seller).to.equal(seller.address);
      expect(listing.price).to.equal(price);
      expect(listing.isActive).to.be.true;
    });

    it("Should not list with price 0", async function () {
      await expect(
        marketplace.connect(seller).listNFT(await nftCollection.getAddress(), 0, 0)
      ).to.be.revertedWith("Price must be > 0");
    });

    it("Should buy an NFT", async function () {
      const price = ethers.parseEther("1");
      await marketplace
        .connect(seller)
        .listNFT(await nftCollection.getAddress(), 0, price);

      await marketplace.connect(buyer).buyNFT(0, { value: price });

      expect(await nftCollection.ownerOf(0)).to.equal(buyer.address);
      const listing = await marketplace.getActiveListing(0);
      expect(listing.isActive).to.be.false;
    });

    it("Should not allow seller to buy own NFT", async function () {
      const price = ethers.parseEther("1");
      await marketplace
        .connect(seller)
        .listNFT(await nftCollection.getAddress(), 0, price);

      await expect(
        marketplace.connect(seller).buyNFT(0, { value: price })
      ).to.be.revertedWith("Seller cannot buy own NFT");
    });

    it("Should cancel a listing", async function () {
      const price = ethers.parseEther("1");
      await marketplace
        .connect(seller)
        .listNFT(await nftCollection.getAddress(), 0, price);

      await marketplace.connect(seller).cancelListing(0);

      const listing = await marketplace.getActiveListing(0);
      expect(listing.isActive).to.be.false;
    });

    it("Should update listing price", async function () {
      const price = ethers.parseEther("1");
      const newPrice = ethers.parseEther("2");

      await marketplace
        .connect(seller)
        .listNFT(await nftCollection.getAddress(), 0, price);

      await marketplace.connect(seller).updatePrice(0, newPrice);

      const listing = await marketplace.getActiveListing(0);
      expect(listing.price).to.equal(newPrice);
    });
  });

  describe("NFTAuction", function () {
    beforeEach(async function () {
      await nftCollection.connect(seller).mint("ipfs://test-uri-1");
      await nftCollection
        .connect(seller)
        .setApprovalForAll(await auction.getAddress(), true);
    });

    it("Should create an auction", async function () {
      const startPrice = ethers.parseEther("0.5");
      const duration = 86400; // 24 hours

      await auction
        .connect(seller)
        .createAuction(await nftCollection.getAddress(), 0, startPrice, duration);

      const auctionData = await auction.getAuction(0);
      expect(auctionData.seller).to.equal(seller.address);
      expect(auctionData.startPrice).to.equal(startPrice);
      expect(auctionData.ended).to.be.false;
    });

    it("Should not create auction with duration less than 1 hour", async function () {
      const startPrice = ethers.parseEther("0.5");
      await expect(
        auction.connect(seller).createAuction(await nftCollection.getAddress(), 0, startPrice, 1800)
      ).to.be.revertedWith("Min duration is 1 hour");
    });

    it("Should place a bid", async function () {
      const startPrice = ethers.parseEther("0.5");
      const duration = 86400;

      await auction
        .connect(seller)
        .createAuction(await nftCollection.getAddress(), 0, startPrice, duration);

      const bidAmount = ethers.parseEther("1");
      await auction.connect(bidder1).placeBid(0, { value: bidAmount });

      const auctionData = await auction.getAuction(0);
      expect(auctionData.highestBid).to.equal(bidAmount);
      expect(auctionData.highestBidder).to.equal(bidder1.address);
    });

    it("Should reject bid below start price", async function () {
      const startPrice = ethers.parseEther("0.5");
      const duration = 86400;

      await auction
        .connect(seller)
        .createAuction(await nftCollection.getAddress(), 0, startPrice, duration);

      await expect(
        auction.connect(bidder1).placeBid(0, { value: ethers.parseEther("0.1") })
      ).to.be.revertedWith("Bid below start price");
    });

    it("Should reject bid not higher than current highest", async function () {
      const startPrice = ethers.parseEther("0.5");
      const duration = 86400;

      await auction
        .connect(seller)
        .createAuction(await nftCollection.getAddress(), 0, startPrice, duration);

      await auction.connect(bidder1).placeBid(0, { value: ethers.parseEther("1") });

      await expect(
        auction.connect(bidder2).placeBid(0, { value: ethers.parseEther("0.8") })
      ).to.be.revertedWith("Bid not high enough");
    });

    it("Should allow outbid users to withdraw", async function () {
      const startPrice = ethers.parseEther("0.5");
      const duration = 86400;

      await auction
        .connect(seller)
        .createAuction(await nftCollection.getAddress(), 0, startPrice, duration);

      await auction.connect(bidder1).placeBid(0, { value: ethers.parseEther("1") });
      await auction.connect(bidder2).placeBid(0, { value: ethers.parseEther("2") });

      // bidder1 should be able to withdraw
      await expect(
        auction.connect(bidder1).withdrawBid(0)
      ).to.changeEtherBalance(bidder1, ethers.parseEther("1"));
    });

    it("Should cancel auction with no bids", async function () {
      const startPrice = ethers.parseEther("0.5");
      const duration = 86400;

      await auction
        .connect(seller)
        .createAuction(await nftCollection.getAddress(), 0, startPrice, duration);

      await auction.connect(seller).cancelAuction(0);

      const auctionData = await auction.getAuction(0);
      expect(auctionData.canceled).to.be.true;

      // NFT returned to seller
      expect(await nftCollection.ownerOf(0)).to.equal(seller.address);
    });

    it("Should not cancel auction with bids", async function () {
      const startPrice = ethers.parseEther("0.5");
      const duration = 86400;

      await auction
        .connect(seller)
        .createAuction(await nftCollection.getAddress(), 0, startPrice, duration);

      await auction.connect(bidder1).placeBid(0, { value: ethers.parseEther("1") });

      await expect(
        auction.connect(seller).cancelAuction(0)
      ).to.be.revertedWith("Cannot cancel with bids");
    });

    it("Should end auction and transfer NFT to winner", async function () {
      const startPrice = ethers.parseEther("0.5");
      const duration = 3600; // 1 hour

      await auction
        .connect(seller)
        .createAuction(await nftCollection.getAddress(), 0, startPrice, duration);

      await auction.connect(bidder1).placeBid(0, { value: ethers.parseEther("1") });

      // Fast forward time
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");

      await auction.connect(seller).endAuction(0);

      const auctionData = await auction.getAuction(0);
      expect(auctionData.ended).to.be.true;
      expect(await nftCollection.ownerOf(0)).to.equal(bidder1.address);
    });

    it("Should return NFT to seller if no bids", async function () {
      const startPrice = ethers.parseEther("0.5");
      const duration = 3600;

      await auction
        .connect(seller)
        .createAuction(await nftCollection.getAddress(), 0, startPrice, duration);

      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");

      await auction.connect(seller).endAuction(0);

      expect(await nftCollection.ownerOf(0)).to.equal(seller.address);
    });

    it("Should track bid history", async function () {
      const startPrice = ethers.parseEther("0.5");
      const duration = 86400;

      await auction
        .connect(seller)
        .createAuction(await nftCollection.getAddress(), 0, startPrice, duration);

      await auction.connect(bidder1).placeBid(0, { value: ethers.parseEther("1") });
      await auction.connect(bidder2).placeBid(0, { value: ethers.parseEther("2") });

      const bids = await auction.getAuctionBids(0);
      expect(bids.length).to.equal(2);
      expect(bids[0].bidder).to.equal(bidder1.address);
      expect(bids[1].bidder).to.equal(bidder2.address);
    });
  });
});