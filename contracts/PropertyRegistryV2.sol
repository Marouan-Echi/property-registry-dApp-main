// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PropertyRegistryV2 {
    address public admin;
    uint256 public adminFeePercent = 10; // 10% fee for the admin
    uint256 public adminBalance = 0; // Track admin earnings from fees
    
    struct Property {
        uint256 id;
        string title;
        string description;
        string location;
        uint256 price;
        address owner;
        bool isValidated;
        bool isSold;
    }
    
    // Property ID counter
    uint256 private nextPropertyId = 1;
    
    // Mapping from property ID to Property
    mapping(uint256 => Property) public properties;
    
    // Mapping from address to their properties (as arrays of property IDs)
    mapping(address => uint256[]) public userProperties;
    
    // Mapping to track user balances
    mapping(address => uint256) public userBalances;
    
    // Events
    event PropertyRegistered(uint256 indexed propertyId, address indexed owner);
    event PropertyValidated(uint256 indexed propertyId);
    event PropertySold(uint256 indexed propertyId, address indexed previousOwner, address indexed newOwner, uint256 price, uint256 fee);
    event BalanceWithdrawn(address indexed user, uint256 amount);
    event AdminFeeCollected(uint256 amount);
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }
    
    modifier onlyPropertyOwner(uint256 _propertyId) {
        require(properties[_propertyId].owner == msg.sender, "Only property owner can perform this action");
        _;
    }
    
    constructor() {
        admin = msg.sender;
    }
    
    function registerProperty(
        string memory _title,
        string memory _description,
        string memory _location,
        uint256 _price
    ) external returns (uint256) {
        uint256 propertyId = nextPropertyId;
        
        properties[propertyId] = Property({
            id: propertyId,
            title: _title,
            description: _description,
            location: _location,
            price: _price,
            owner: msg.sender,
            isValidated: false,
            isSold: false
        });
        
        userProperties[msg.sender].push(propertyId);
        nextPropertyId++;
        
        emit PropertyRegistered(propertyId, msg.sender);
        
        return propertyId;
    }
    
    function validateProperty(uint256 _propertyId) external onlyAdmin {
        require(_propertyId > 0 && _propertyId < nextPropertyId, "Property does not exist");
        require(!properties[_propertyId].isValidated, "Property already validated");
        require(!properties[_propertyId].isSold, "Property already sold");
        
        properties[_propertyId].isValidated = true;
        
        emit PropertyValidated(_propertyId);
    }
    
    function buyProperty(uint256 _propertyId) external payable {
        Property storage property = properties[_propertyId];
        
        require(_propertyId > 0 && _propertyId < nextPropertyId, "Property does not exist");
        require(property.isValidated, "Property not validated yet");
        require(!property.isSold, "Property already sold");
        require(msg.sender != property.owner, "Owner cannot buy own property");
        require(msg.value >= property.price, "Insufficient funds sent");
        
        address previousOwner = property.owner;
        uint256 propertyPrice = property.price;
        
        // Calculate admin fee (10%)
        uint256 adminFee = (propertyPrice * adminFeePercent) / 100;
        uint256 sellerAmount = propertyPrice - adminFee;
        
        // Update admin balance
        adminBalance += adminFee;
        
        // Update property status
        property.isSold = true;
        property.owner = msg.sender;
        
        // Update owner's property list
        userProperties[msg.sender].push(_propertyId);
        
        // Transfer funds to previous owner (minus the admin fee)
        payable(previousOwner).transfer(sellerAmount);
        
        // Return excess payment to buyer if any
        if (msg.value > propertyPrice) {
            payable(msg.sender).transfer(msg.value - propertyPrice);
        }
        
        emit PropertySold(_propertyId, previousOwner, msg.sender, propertyPrice, adminFee);
        emit AdminFeeCollected(adminFee);
    }
    
    function getUserProperties(address _user) external view returns (uint256[] memory) {
        return userProperties[_user];
    }
    
    function getPropertyDetails(uint256 _propertyId) external view returns (
        uint256 id,
        string memory title,
        string memory description,
        string memory location,
        uint256 price,
        address owner,
        bool isValidated,
        bool isSold
    ) {
        require(_propertyId > 0 && _propertyId < nextPropertyId, "Property does not exist");
        
        Property storage property = properties[_propertyId];
        
        return (
            property.id,
            property.title,
            property.description,
            property.location,
            property.price,
            property.owner,
            property.isValidated,
            property.isSold
        );
    }
    
    function getAllProperties() external view returns (uint256[] memory) {
        uint256[] memory allProperties = new uint256[](nextPropertyId - 1);
        
        for (uint256 i = 1; i < nextPropertyId; i++) {
            allProperties[i - 1] = i;
        }
        
        return allProperties;
    }
    
    function withdrawAdminBalance() external onlyAdmin {
        uint256 amount = adminBalance;
        require(amount > 0, "No admin balance to withdraw");
        adminBalance = 0;
        payable(admin).transfer(amount);
    }
    
    function getAdminBalance() external view returns (uint256) {
        return adminBalance;
    }
    
    // Allow users to check their balance
    function getUserBalance() external view returns (uint256) {
        return address(msg.sender).balance;
    }
    
    function changeAdmin(address _newAdmin) external onlyAdmin {
        require(_newAdmin != address(0), "Invalid address");
        admin = _newAdmin;
    }
}
