cat > frontend/src/hooks/useContracts.js << 'ENDOFFILE'
import { ethers } from "ethers";
import { useWeb3 } from "../context/Web3Context";
import {
  NFT_COLLECTION_ADDRESS,
  MARKETPLACE_ADDRESS,
  AUCTION_ADDRESS,
} from "../utils/constants";

const MARKETPLACE_ABI = [
  "function listNFT(address _nftContract, uint256 _tokenId, uint256 _price) external returns (uint256)",
  "function buyNFT(uint256 _listingId) external payable",
  "function cancelListing(uint256 _listingId) external",
  "function getListing(uint256 _listingId) external view returns (tuple(uint256 listingId, address nftContract, uint256 tokenId, address seller, uint256 price, bool active))",
  "function listingCount() external view returns (uint256)",
];

const NFT_ABI = [
  "function mint(string memory uri) external payable returns (uint256)",
  "function approve(address to, uint256 tokenId) external",
  "function setApprovalForAll(address operator, bool approved) external",
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function tokenURI(uint256 tokenId) external view returns (string)",
  "function mintPrice() external view returns (uint256)",
];

const AUCTION_ABI = [
  "function createAuction(address _nftContract, uint256 _tokenId, uint256 _startingPrice, uint256 _duration) external returns (uint256)",
  "function placeBid(uint256 _auctionId) external payable",
  "function endAuction(uint256 _auctionId) external",
  "function withdrawBid(uint256 _auctionId) external",
  "function getAuction(uint256 _auctionId) external view returns (tuple(uint256 auctionId, address nftContract, uint256 tokenId, address seller, uint256 startingPrice, uint256 highestBid, address highestBidder, uint256 endTime, bool active, bool ended))",
];

export function useContracts() {
  const { signer, account } = useWeb3();

  const getMarketplace = () => {
    if (!signer) return null;
    return new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signer);
  };

  const getNFTContract = () => {
    if (!signer) return null;
    return new ethers.Contract(NFT_COLLECTION_ADDRESS, NFT_ABI, signer);
  };

  const getAuction = () => {
    if (!signer) return null;
    return new ethers.Contract(AUCTION_ADDRESS, AUCTION_ABI, signer);
  };

  const buyNFT = async (listingId, priceInEth) => {
    try {
      const marketplace = getMarketplace();
      if (!marketplace) throw new Error("Wallet not connected");
      const tx = await marketplace.buyNFT(listingId, {
        value: ethers.parseEther(priceInEth.toString()),
      });
      const receipt = await tx.wait();
      return { success: true, hash: tx.hash };
    } catch (error) {
      return { success: false, error: error.reason || error.message };
    }
  };

  const mintNFT = async (tokenURI) => {
    try {
      const nft = getNFTContract();
      if (!nft) throw new Error("Wallet not connected");
      const mintPrice = await nft.mintPrice();
      const tx = await nft.mint(tokenURI, { value: mintPrice });
      const receipt = await tx.wait();
      return { success: true, hash: tx.hash };
    } catch (error) {
      return { success: false, error: error.reason || error.message };
    }
  };

  const listNFT = async (tokenId, priceInEth) => {
    try {
      const nft = getNFTContract();
      const marketplace = getMarketplace();
      if (!nft || !marketplace) throw new Error("Wallet not connected");
      const approveTx = await nft.approve(MARKETPLACE_ADDRESS, tokenId);
      await approveTx.wait();
      const priceBN = ethers.parseEther(priceInEth.toString());
      const listTx = await marketplace.listNFT(NFT_COLLECTION_ADDRESS, tokenId, priceBN);
      await listTx.wait();
      return { success: true, hash: listTx.hash };
    } catch (error) {
      return { success: false, error: error.reason || error.message };
    }
  };

  const placeBid = async (auctionId, bidAmountInEth) => {
    try {
      const auctionContract = getAuction();
      if (!auctionContract) throw new Error("Wallet not connected");
      const tx = await auctionContract.placeBid(auctionId, {
        value: ethers.parseEther(bidAmountInEth.toString()),
      });
      await tx.wait();
      return { success: true, hash: tx.hash };
    } catch (error) {
      return { success: false, error: error.reason || error.message };
    }
  };

  const createAuction = async (tokenId, startingPriceEth, durationSeconds) => {
    try {
      const nft = getNFTContract();
      const auctionContract = getAuction();
      if (!nft || !auctionContract) throw new Error("Wallet not connected");
      const approveTx = await nft.approve(AUCTION_ADDRESS, tokenId);
      await approveTx.wait();
      const priceBN = ethers.parseEther(startingPriceEth.toString());
      const tx = await auctionContract.createAuction(NFT_COLLECTION_ADDRESS, tokenId, priceBN, durationSeconds);
      await tx.wait();
      return { success: true, hash: tx.hash };
    } catch (error) {
      return { success: false, error: error.reason || error.message };
    }
  };

  return { buyNFT, mintNFT, listNFT, placeBid, createAuction };
}