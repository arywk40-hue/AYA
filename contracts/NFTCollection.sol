// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";

contract NFTCollection is ERC721, ERC721URIStorage, ERC721Enumerable, Ownable, IERC2981 {
    uint256 private _tokenIdCounter;
    uint96 public royaltyFee; // basis points (e.g., 250 = 2.5%)
    address public royaltyRecipient;

    mapping(uint256 => address) public creators;

    event NFTMinted(uint256 indexed tokenId, address indexed creator, string tokenURI);

    constructor(
        string memory name,
        string memory symbol,
        uint96 _royaltyFee
    ) ERC721(name, symbol) Ownable(msg.sender) {
        royaltyFee = _royaltyFee;
        royaltyRecipient = msg.sender;
    }

    function mint(string memory _tokenURI) external returns (uint256) {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, _tokenURI);
        creators[tokenId] = msg.sender;

        emit NFTMinted(tokenId, msg.sender, _tokenURI);
        return tokenId;
    }

    function royaltyInfo(uint256, uint256 salePrice)
        external
        view
        override
        returns (address receiver, uint256 royaltyAmount)
    {
        return (royaltyRecipient, (salePrice * royaltyFee) / 10000);
    }

    function setRoyaltyFee(uint96 _royaltyFee) external onlyOwner {
        require(_royaltyFee <= 1000, "Max royalty is 10%");
        royaltyFee = _royaltyFee;
    }

    function setRoyaltyRecipient(address _recipient) external onlyOwner {
        require(_recipient != address(0), "Invalid address");
        royaltyRecipient = _recipient;
    }

    // Required overrides
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage, IERC165)
        returns (bool)
    {
        return
            interfaceId == type(IERC2981).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}