// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFTMarketplace is ReentrancyGuard, Ownable {
    uint256 public platformFee; // basis points (e.g., 250 = 2.5%)
    uint256 private _listingIdCounter;

    struct Listing {
        uint256 listingId;
        address nftContract;
        uint256 tokenId;
        address payable seller;
        uint256 price;
        bool isActive;
    }

    mapping(uint256 => Listing) public listings;
    mapping(address => mapping(uint256 => uint256)) public nftToListingId;

    event Listed(
        uint256 indexed listingId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        uint256 price
    );

    event Sale(
        uint256 indexed listingId,
        address indexed buyer,
        uint256 price
    );

    event ListingCanceled(uint256 indexed listingId);
    event PriceUpdated(uint256 indexed listingId, uint256 newPrice);

    constructor(uint256 _platformFee) Ownable(msg.sender) {
        platformFee = _platformFee;
    }

    function listNFT(
        address _nftContract,
        uint256 _tokenId,
        uint256 _price
    ) external nonReentrant {
        require(_price > 0, "Price must be > 0");
        IERC721 nft = IERC721(_nftContract);
        require(nft.ownerOf(_tokenId) == msg.sender, "Not the owner");
        require(
            nft.isApprovedForAll(msg.sender, address(this)) ||
            nft.getApproved(_tokenId) == address(this),
            "Marketplace not approved"
        );

        uint256 listingId = _listingIdCounter;
        _listingIdCounter++;

        listings[listingId] = Listing({
            listingId: listingId,
            nftContract: _nftContract,
            tokenId: _tokenId,
            seller: payable(msg.sender),
            price: _price,
            isActive: true
        });

        nftToListingId[_nftContract][_tokenId] = listingId;

        emit Listed(listingId, _nftContract, _tokenId, msg.sender, _price);
    }

    function buyNFT(uint256 _listingId) external payable nonReentrant {
        Listing storage listing = listings[_listingId];
        require(listing.isActive, "Listing not active");
        require(msg.value >= listing.price, "Insufficient payment");
        require(msg.sender != listing.seller, "Seller cannot buy own NFT");

        listing.isActive = false;

        // Calculate fees
        uint256 fee = (listing.price * platformFee) / 10000;
        uint256 sellerProceeds = listing.price - fee;

        // Check for royalties (ERC-2981)
        try IERC2981(listing.nftContract).royaltyInfo(listing.tokenId, listing.price) returns (
            address royaltyReceiver,
            uint256 royaltyAmount
        ) {
            if (royaltyReceiver != address(0) && royaltyAmount > 0 && royaltyAmount < sellerProceeds) {
                sellerProceeds -= royaltyAmount;
                payable(royaltyReceiver).transfer(royaltyAmount);
            }
        } catch {}

        // Transfer payments
        payable(owner()).transfer(fee);
        listing.seller.transfer(sellerProceeds);

        // Transfer NFT
        IERC721(listing.nftContract).safeTransferFrom(
            listing.seller,
            msg.sender,
            listing.tokenId
        );

        // Refund excess payment
        if (msg.value > listing.price) {
            payable(msg.sender).transfer(msg.value - listing.price);
        }

        emit Sale(_listingId, msg.sender, listing.price);
    }

    function cancelListing(uint256 _listingId) external nonReentrant {
        Listing storage listing = listings[_listingId];
        require(listing.isActive, "Listing not active");
        require(listing.seller == msg.sender, "Not the seller");

        listing.isActive = false;
        emit ListingCanceled(_listingId);
    }

    function updatePrice(uint256 _listingId, uint256 _newPrice) external {
        Listing storage listing = listings[_listingId];
        require(listing.isActive, "Listing not active");
        require(listing.seller == msg.sender, "Not the seller");
        require(_newPrice > 0, "Price must be > 0");

        listing.price = _newPrice;
        emit PriceUpdated(_listingId, _newPrice);
    }

    function setPlatformFee(uint256 _fee) external onlyOwner {
        require(_fee <= 1000, "Max fee is 10%");
        platformFee = _fee;
    }

    function getActiveListing(uint256 _listingId) external view returns (Listing memory) {
        return listings[_listingId];
    }
}