import { ethers } from "ethers";
import { useWeb3 } from "../context/Web3Context";
import { ipfsToHTTP } from "../utils/helpers";
import {
  NFT_COLLECTION_ADDRESS,
  MARKETPLACE_ADDRESS,
  AUCTION_ADDRESS,
} from "../utils/constants";

const MARKETPLACE_ABI = [
  "function listNFT(address _nftContract, uint256 _tokenId, uint256 _price) external",
  "function buyNFT(uint256 _listingId) external payable",
  "function cancelListing(uint256 _listingId) external",
  "function updatePrice(uint256 _listingId, uint256 _newPrice) external",
  "function getActiveListing(uint256 _listingId) external view returns (tuple(uint256 listingId, address nftContract, uint256 tokenId, address seller, uint256 price, bool isActive))",
  "event Listed(uint256 indexed listingId, address indexed nftContract, uint256 indexed tokenId, address seller, uint256 price)",
  "event Sale(uint256 indexed listingId, address indexed buyer, uint256 price)",
];

const NFT_ABI = [
  "function mint(string memory _tokenURI) external returns (uint256)",
  "function approve(address to, uint256 tokenId) external",
  "function setApprovalForAll(address operator, bool approved) external",
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function tokenURI(uint256 tokenId) external view returns (string)",
  "function totalSupply() external view returns (uint256)",
  "function tokenByIndex(uint256 index) external view returns (uint256)",
  "function creators(uint256 tokenId) external view returns (address)",
];

const AUCTION_ABI = [
  "function createAuction(address _nftContract, uint256 _tokenId, uint256 _startingPrice, uint256 _duration) external",
  "function placeBid(uint256 _auctionId) external payable",
  "function endAuction(uint256 _auctionId) external",
  "function withdrawBid(uint256 _auctionId) external",
  "function cancelAuction(uint256 _auctionId) external",
  "function getAuction(uint256 _auctionId) external view returns (tuple(uint256 auctionId, address nftContract, uint256 tokenId, address seller, uint256 startPrice, uint256 highestBid, address highestBidder, uint256 startTime, uint256 endTime, bool ended, bool canceled))",
  "function getAuctionBids(uint256 _auctionId) external view returns (tuple(address bidder, uint256 amount, uint256 timestamp)[])",
  "event AuctionCreated(uint256 indexed auctionId, address indexed nftContract, uint256 indexed tokenId, address seller, uint256 startPrice, uint256 startTime, uint256 endTime)",
];

export function useContracts() {
  const { signer, provider } = useWeb3();

  const getMarketplace = (signerOrProvider) =>
    new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signerOrProvider || signer);

  const getNFTContract = (signerOrProvider) =>
    new ethers.Contract(NFT_COLLECTION_ADDRESS, NFT_ABI, signerOrProvider || signer);

  const getAuctionContract = (signerOrProvider) =>
    new ethers.Contract(AUCTION_ADDRESS, AUCTION_ABI, signerOrProvider || signer);

  // ─── Read: fetch all minted NFTs ───────────────────────────────────────────
  const fetchAllNFTs = async () => {
    try {
      const p = provider || (window.ethereum ? new ethers.BrowserProvider(window.ethereum) : null);
      if (!p) return [];
      const nft = getNFTContract(await p.getSigner().catch(() => p));
      const total = await nft.totalSupply().catch(() => 0n);
      const items = [];
      for (let i = 0; i < Number(total); i++) {
        try {
          const tokenId = await nft.tokenByIndex(i);
          const uri = await nft.tokenURI(tokenId);
          const owner = await nft.ownerOf(tokenId);
          const creator = await nft.creators(tokenId);
          // Try to fetch JSON metadata from IPFS
          let meta = {};
          try {
            const metaURL = ipfsToHTTP(uri);
            const res = await fetch(metaURL);
            meta = await res.json();
          } catch {}
          items.push({
            tokenId: Number(tokenId),
            uri,
            owner,
            creator,
            name: meta.name || `NFT #${Number(tokenId)}`,
            image: meta.image ? ipfsToHTTP(meta.image) : `https://picsum.photos/seed/nft${Number(tokenId)}/500/500`,
            description: meta.description || "",
            collection: meta.collection || "AuraVerse",
          });
        } catch {}
      }
      return items;
    } catch (err) {
      console.error("fetchAllNFTs:", err);
      return [];
    }
  };

  // ─── Read: fetch all active marketplace listings ────────────────────────────
  const fetchListings = async () => {
    try {
      const p = provider || (window.ethereum ? new ethers.BrowserProvider(window.ethereum) : null);
      if (!p) return [];
      const mp = getMarketplace(await p.getSigner().catch(() => p));
      const filter = mp.filters.Listed();
      const events = await mp.queryFilter(filter, 0, "latest");
      const listings = [];
      for (const ev of events) {
        try {
          const l = await mp.getActiveListing(ev.args.listingId);
          if (l.isActive) listings.push(l);
        } catch {}
      }
      return listings;
    } catch (err) {
      console.error("fetchListings:", err);
      return [];
    }
  };

  // ─── Write: mint NFT ────────────────────────────────────────────────────────
  const mintNFT = async (tokenURI) => {
    try {
      if (!signer) throw new Error("Wallet not connected");
      const nft = getNFTContract();
      const tx = await nft.mint(tokenURI);
      const receipt = await tx.wait();
      return { success: true, hash: tx.hash, receipt };
    } catch (error) {
      return { success: false, error: error.reason || error.message };
    }
  };

  // ─── Write: list NFT on marketplace ────────────────────────────────────────
  const listNFT = async (tokenId, priceInEth) => {
    try {
      if (!signer) throw new Error("Wallet not connected");
      const nft = getNFTContract();
      const mp = getMarketplace();
      const approveTx = await nft.approve(MARKETPLACE_ADDRESS, tokenId);
      await approveTx.wait();
      const priceBN = ethers.parseEther(priceInEth.toString());
      const listTx = await mp.listNFT(NFT_COLLECTION_ADDRESS, tokenId, priceBN);
      await listTx.wait();
      return { success: true, hash: listTx.hash };
    } catch (error) {
      return { success: false, error: error.reason || error.message };
    }
  };

  // ─── Write: buy NFT ─────────────────────────────────────────────────────────
  const buyNFT = async (listingId, priceInEth) => {
    try {
      if (!signer) throw new Error("Wallet not connected");
      const mp = getMarketplace();
      const tx = await mp.buyNFT(listingId, {
        value: ethers.parseEther(priceInEth.toString()),
      });
      await tx.wait();
      return { success: true, hash: tx.hash };
    } catch (error) {
      return { success: false, error: error.reason || error.message };
    }
  };

  // ─── Write: create auction ──────────────────────────────────────────────────
  const createAuction = async (tokenId, startingPriceEth, durationSeconds) => {
    try {
      if (!signer) throw new Error("Wallet not connected");
      const nft = getNFTContract();
      const auc = getAuctionContract();
      const approveTx = await nft.approve(AUCTION_ADDRESS, tokenId);
      await approveTx.wait();
      const priceBN = ethers.parseEther(startingPriceEth.toString());
      const tx = await auc.createAuction(NFT_COLLECTION_ADDRESS, tokenId, priceBN, durationSeconds);
      await tx.wait();
      return { success: true, hash: tx.hash };
    } catch (error) {
      return { success: false, error: error.reason || error.message };
    }
  };

  // ─── Write: place bid ───────────────────────────────────────────────────────
  const placeBid = async (auctionId, bidAmountInEth) => {
    try {
      if (!signer) throw new Error("Wallet not connected");
      const auc = getAuctionContract();
      const tx = await auc.placeBid(auctionId, {
        value: ethers.parseEther(bidAmountInEth.toString()),
      });
      await tx.wait();
      return { success: true, hash: tx.hash };
    } catch (error) {
      return { success: false, error: error.reason || error.message };
    }
  };

  // ─── Write: end auction ─────────────────────────────────────────────────────
  const endAuction = async (auctionId) => {
    try {
      if (!signer) throw new Error("Wallet not connected");
      const auc = getAuctionContract();
      const tx = await auc.endAuction(auctionId);
      await tx.wait();
      return { success: true, hash: tx.hash };
    } catch (error) {
      return { success: false, error: error.reason || error.message };
    }
  };

  // ─── Read: fetch all active auctions ────────────────────────────────────────
  const fetchAuctions = async () => {
    try {
      const p = provider || (window.ethereum ? new ethers.BrowserProvider(window.ethereum) : null);
      if (!p) return [];
      const auc = getAuctionContract(await p.getSigner().catch(() => p));
      const filter = auc.filters.AuctionCreated();
      const events = await auc.queryFilter(filter, 0, "latest");
      const auctions = [];
      for (const ev of events) {
        try {
          const a = await auc.getAuction(ev.args.auctionId);
          if (!a.ended && !a.canceled) auctions.push(a);
        } catch {}
      }
      return auctions;
    } catch (err) {
      console.error("fetchAuctions:", err);
      return [];
    }
  };

  // ─── Write: cancel marketplace listing ──────────────────────────────────────
  const cancelListing = async (listingId) => {
    try {
      if (!signer) throw new Error("Wallet not connected");
      const mp = getMarketplace();
      const tx = await mp.cancelListing(listingId);
      await tx.wait();
      return { success: true, hash: tx.hash };
    } catch (error) {
      return { success: false, error: error.reason || error.message };
    }
  };

  // ─── Write: cancel auction ──────────────────────────────────────────────────
  const cancelAuction = async (auctionId) => {
    try {
      if (!signer) throw new Error("Wallet not connected");
      const auc = getAuctionContract();
      const tx = await auc.cancelAuction(auctionId);
      await tx.wait();
      return { success: true, hash: tx.hash };
    } catch (error) {
      return { success: false, error: error.reason || error.message };
    }
  };

  // ─── Write: withdraw outbid funds ───────────────────────────────────────────
  const withdrawBid = async (auctionId) => {
    try {
      if (!signer) throw new Error("Wallet not connected");
      const auc = getAuctionContract();
      const tx = await auc.withdrawBid(auctionId);
      await tx.wait();
      return { success: true, hash: tx.hash };
    } catch (error) {
      return { success: false, error: error.reason || error.message };
    }
  };

  // ─── Read: fetch bid history for an auction ─────────────────────────────────
  const fetchAuctionBids = async (auctionId) => {
    try {
      const p = provider || (window.ethereum ? new ethers.BrowserProvider(window.ethereum) : null);
      if (!p) return [];
      const auc = getAuctionContract(await p.getSigner().catch(() => p));
      return await auc.getAuctionBids(auctionId);
    } catch (err) {
      console.error("fetchAuctionBids:", err);
      return [];
    }
  };

  return {
    fetchAllNFTs,
    fetchListings,
    fetchAuctions,
    fetchAuctionBids,
    mintNFT,
    listNFT,
    buyNFT,
    createAuction,
    placeBid,
    endAuction,
    cancelListing,
    cancelAuction,
    withdrawBid,
    getMarketplace,
    getNFTContract,
    getAuctionContract,
  };
}
