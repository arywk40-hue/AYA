// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFTAuction is ReentrancyGuard, Ownable {
    uint256 public platformFee; // basis points
    uint256 private _auctionIdCounter;

    struct Auction {
        uint256 auctionId;
        address nftContract;
        uint256 tokenId;
        address payable seller;
        uint256 startPrice;
        uint256 highestBid;
        address payable highestBidder;
        uint256 startTime;
        uint256 endTime;
        bool ended;
        bool canceled;
    }

    struct Bid {
        address bidder;
        uint256 amount;
        uint256 timestamp;
    }

    mapping(uint256 => Auction) public auctions;
    mapping(uint256 => Bid[]) public auctionBids;
    mapping(uint256 => mapping(address => uint256)) public pendingReturns;

    event AuctionCreated(
        uint256 indexed auctionId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        uint256 startPrice,
        uint256 startTime,
        uint256 endTime
    );

    event BidPlaced(
        uint256 indexed auctionId,
        address indexed bidder,
        uint256 amount
    );

    event AuctionEnded(
        uint256 indexed auctionId,
        address winner,
        uint256 amount
    );

    event AuctionCanceled(uint256 indexed auctionId);
    event BidWithdrawn(uint256 indexed auctionId, address indexed bidder, uint256 amount);

    constructor(uint256 _platformFee) Ownable(msg.sender) {
        platformFee = _platformFee;
    }

    function createAuction(
        address _nftContract,
        uint256 _tokenId,
        uint256 _startPrice,
        uint256 _duration
    ) external nonReentrant {
        require(_startPrice > 0, "Start price must be > 0");
        require(_duration >= 1 hours, "Min duration is 1 hour");
        require(_duration <= 30 days, "Max duration is 30 days");

        IERC721 nft = IERC721(_nftContract);
        require(nft.ownerOf(_tokenId) == msg.sender, "Not the owner");
        require(
            nft.isApprovedForAll(msg.sender, address(this)) ||
            nft.getApproved(_tokenId) == address(this),
            "Auction not approved"
        );

        // Transfer NFT to contract for escrow
        nft.transferFrom(msg.sender, address(this), _tokenId);

        uint256 auctionId = _auctionIdCounter;
        _auctionIdCounter++;

        auctions[auctionId] = Auction({
            auctionId: auctionId,
            nftContract: _nftContract,
            tokenId: _tokenId,
            seller: payable(msg.sender),
            startPrice: _startPrice,
            highestBid: 0,
            highestBidder: payable(address(0)),
            startTime: block.timestamp,
            endTime: block.timestamp + _duration,
            ended: false,
            canceled: false
        });

        emit AuctionCreated(
            auctionId,
            _nftContract,
            _tokenId,
            msg.sender,
            _startPrice,
            block.timestamp,
            block.timestamp + _duration
        );
    }

    function placeBid(uint256 _auctionId) external payable nonReentrant {
        Auction storage auction = auctions[_auctionId];
        require(!auction.ended && !auction.canceled, "Auction not active");
        require(block.timestamp < auction.endTime, "Auction expired");
        require(msg.sender != auction.seller, "Seller cannot bid");
        require(
            msg.value >= auction.startPrice,
            "Bid below start price"
        );
        require(msg.value > auction.highestBid, "Bid not high enough");

        // Refund previous highest bidder
        if (auction.highestBidder != address(0)) {
            pendingReturns[_auctionId][auction.highestBidder] += auction.highestBid;
        }

        auction.highestBid = msg.value;
        auction.highestBidder = payable(msg.sender);

        auctionBids[_auctionId].push(Bid({
            bidder: msg.sender,
            amount: msg.value,
            timestamp: block.timestamp
        }));

        // Extend auction by 10 min if bid placed in last 10 min
        if (auction.endTime - block.timestamp < 10 minutes) {
            auction.endTime += 10 minutes;
        }

        emit BidPlaced(_auctionId, msg.sender, msg.value);
    }

    function withdrawBid(uint256 _auctionId) external nonReentrant {
        uint256 amount = pendingReturns[_auctionId][msg.sender];
        require(amount > 0, "No funds to withdraw");

        pendingReturns[_auctionId][msg.sender] = 0;
        payable(msg.sender).transfer(amount);

        emit BidWithdrawn(_auctionId, msg.sender, amount);
    }

    function endAuction(uint256 _auctionId) external nonReentrant {
        Auction storage auction = auctions[_auctionId];
        require(!auction.ended && !auction.canceled, "Already ended/canceled");
        require(block.timestamp >= auction.endTime, "Auction still active");

        auction.ended = true;

        if (auction.highestBidder != address(0)) {
            // Calculate fees
            uint256 fee = (auction.highestBid * platformFee) / 10000;
            uint256 sellerProceeds = auction.highestBid - fee;

            // Royalties
            try IERC2981(auction.nftContract).royaltyInfo(auction.tokenId, auction.highestBid) returns (
                address royaltyReceiver,
                uint256 royaltyAmount
            ) {
                if (royaltyReceiver != address(0) && royaltyAmount > 0 && royaltyAmount < sellerProceeds) {
                    sellerProceeds -= royaltyAmount;
                    payable(royaltyReceiver).transfer(royaltyAmount);
                }
            } catch {}

            payable(owner()).transfer(fee);
            auction.seller.transfer(sellerProceeds);

            // Transfer NFT to winner
            IERC721(auction.nftContract).safeTransferFrom(
                address(this),
                auction.highestBidder,
                auction.tokenId
            );
        } else {
            // No bids — return NFT to seller
            IERC721(auction.nftContract).safeTransferFrom(
                address(this),
                auction.seller,
                auction.tokenId
            );
        }

        emit AuctionEnded(_auctionId, auction.highestBidder, auction.highestBid);
    }

    function cancelAuction(uint256 _auctionId) external nonReentrant {
        Auction storage auction = auctions[_auctionId];
        require(auction.seller == msg.sender, "Not the seller");
        require(!auction.ended && !auction.canceled, "Already ended/canceled");
        require(auction.highestBidder == address(0), "Cannot cancel with bids");

        auction.canceled = true;

        // Return NFT
        IERC721(auction.nftContract).safeTransferFrom(
            address(this),
            auction.seller,
            auction.tokenId
        );

        emit AuctionCanceled(_auctionId);
    }

    function getAuctionBids(uint256 _auctionId) external view returns (Bid[] memory) {
        return auctionBids[_auctionId];
    }

    function getAuction(uint256 _auctionId) external view returns (Auction memory) {
        return auctions[_auctionId];
    }

    function setPlatformFee(uint256 _fee) external onlyOwner {
        require(_fee <= 1000, "Max fee 10%");
        platformFee = _fee;
    }
}