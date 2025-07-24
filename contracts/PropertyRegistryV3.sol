// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PropertyRegistryV3 {
    address public superAdmin;
    mapping(address => bool) public admins;
    mapping(address => bool) public registeredUsers;
    
    uint256 public adminFeePercent = 10; // 10% fee for the admin
    mapping(address => uint256) public adminBalances; // Track admin earnings from fees
    
    struct Property {
        uint256 id;
        string title;
        string description;
        string location;
        uint256 price;
        address owner;
        PropertyStatus status;
        address approvedBy;
    }
    
    enum PropertyStatus {
        Pending,
        Approved,
        Rejected,
        Sold
    }
    
    // Property ID counter
    uint256 private nextPropertyId = 1;
    
    // Mapping from property ID to Property
    mapping(uint256 => Property) public properties;
    
    // Mapping from address to their properties (as arrays of property IDs)
    mapping(address => uint256[]) public userProperties;
    
    // Events
    event UserRegistered(address indexed user);
    event AdminAdded(address indexed admin);
    event AdminRemoved(address indexed admin);
    event PropertyRegistered(uint256 indexed propertyId, address indexed owner);
    event PropertyApproved(uint256 indexed propertyId, address indexed admin);
    event PropertyRejected(uint256 indexed propertyId, address indexed admin);
    event PropertySold(uint256 indexed propertyId, address indexed previousOwner, address indexed newOwner, uint256 price, uint256 fee);
    event BalanceWithdrawn(address indexed user, uint256 amount);
    
    modifier onlySuperAdmin() {
        require(msg.sender == superAdmin, "Only super admin can perform this action");
        _;
    }
    
    modifier onlyAdmin() {
        require(admins[msg.sender] || msg.sender == superAdmin, "Only admin can perform this action");
        _;
    }
    
    modifier onlyRegisteredUser() {
        require(registeredUsers[msg.sender] || admins[msg.sender] || msg.sender == superAdmin, "Only registered users can perform this action");
        _;
    }
    
    modifier onlyPropertyOwner(uint256 _propertyId) {
        require(properties[_propertyId].owner == msg.sender, "Only property owner can perform this action");
        _;
    }
    
    constructor() {
        superAdmin = msg.sender;
        registeredUsers[msg.sender] = true; // Super admin is also a registered user
    }
    
    // Super Admin functions
    function addAdmin(address _admin) external onlySuperAdmin {
        require(_admin != address(0), "Invalid address");
        require(!admins[_admin], "Address is already an admin");
        
        admins[_admin] = true;
        registeredUsers[_admin] = true; // Admins are also registered users
        
        emit AdminAdded(_admin);
    }
    
    function removeAdmin(address _admin) external onlySuperAdmin {
        require(admins[_admin], "Address is not an admin");
        
        admins[_admin] = false;
        
        emit AdminRemoved(_admin);
    }
    
    function registerUser(address _user) external onlySuperAdmin {
        require(_user != address(0), "Invalid address");
        require(!registeredUsers[_user], "User already registered");
        
        registeredUsers[_user] = true;
        
        emit UserRegistered(_user);
    }
    
    function changeSuperAdmin(address _newSuperAdmin) external onlySuperAdmin {
        require(_newSuperAdmin != address(0), "Invalid address");
        superAdmin = _newSuperAdmin;
        registeredUsers[_newSuperAdmin] = true; // New super admin is also a registered user
    }
    
    // Admin functions
    function approveProperty(uint256 _propertyId) external onlyAdmin {
        require(_propertyId > 0 && _propertyId < nextPropertyId, "Property does not exist");
        require(properties[_propertyId].status == PropertyStatus.Pending, "Property is not pending");
        
        properties[_propertyId].status = PropertyStatus.Approved;
        properties[_propertyId].approvedBy = msg.sender;
        
        emit PropertyApproved(_propertyId, msg.sender);
    }
    
    function rejectProperty(uint256 _propertyId) external onlyAdmin {
        require(_propertyId > 0 && _propertyId < nextPropertyId, "Property does not exist");
        require(properties[_propertyId].status == PropertyStatus.Pending, "Property is not pending");
        
        properties[_propertyId].status = PropertyStatus.Rejected;
        properties[_propertyId].approvedBy = msg.sender;
        
        emit PropertyRejected(_propertyId, msg.sender);
    }
    
    function withdrawAdminBalance() external onlyAdmin {
        uint256 amount = adminBalances[msg.sender];
        require(amount > 0, "No admin balance to withdraw");
        
        adminBalances[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
        
        emit BalanceWithdrawn(msg.sender, amount);
    }
    
    // User functions
    function registerProperty(
        string memory _title,
        string memory _description,
        string memory _location,
        uint256 _price
    ) external onlyRegisteredUser returns (uint256) {
        uint256 propertyId = nextPropertyId;
        
        properties[propertyId] = Property({
            id: propertyId,
            title: _title,
            description: _description,
            location: _location,
            price: _price,
            owner: msg.sender,
            status: PropertyStatus.Pending,
            approvedBy: address(0)
        });
        
        userProperties[msg.sender].push(propertyId);
        nextPropertyId++;
        
        emit PropertyRegistered(propertyId, msg.sender);
        
        return propertyId;
    }
    
    function buyProperty(uint256 _propertyId) external payable onlyRegisteredUser {
        Property storage property = properties[_propertyId];
        
        require(_propertyId > 0 && _propertyId < nextPropertyId, "Property does not exist");
        require(property.status == PropertyStatus.Approved, "Property not approved for sale");
        require(msg.sender != property.owner, "Owner cannot buy own property");
        require(msg.value >= property.price, "Insufficient funds sent");
        
        address previousOwner = property.owner;
        uint256 propertyPrice = property.price;
        
        // Calculate admin fee (10%)
        uint256 adminFee = (propertyPrice * adminFeePercent) / 100;
        uint256 sellerAmount = propertyPrice - adminFee;
        
        // Determine which admin gets the fee (the one who approved the property)
        address feeReceiver = property.approvedBy;
        if (feeReceiver != address(0)) {
            adminBalances[feeReceiver] += adminFee;
        } else {
            // If no specific admin approved (fallback), give to super admin
            adminBalances[superAdmin] += adminFee;
        }
        
        // Update property status
        property.status = PropertyStatus.Sold;
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
    }
    
    // View functions
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
        PropertyStatus status,
        address approvedBy
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
            property.status,
            property.approvedBy
        );
    }
    
    function getAllProperties() external view returns (uint256[] memory) {
        uint256[] memory allProperties = new uint256[](nextPropertyId - 1);
        
        for (uint256 i = 1; i < nextPropertyId; i++) {
            allProperties[i - 1] = i;
        }
        
        return allProperties;
    }
    
    function getAdminBalance(address _admin) external view returns (uint256) {
        return adminBalances[_admin];
    }
    
    function isUserRegistered(address _user) external view returns (bool) {
        return registeredUsers[_user];
    }
    
    function isAdmin(address _user) external view returns (bool) {
        return admins[_user];
    }
    
    function isSuperAdmin(address _user) external view returns (bool) {
        return _user == superAdmin;
    }
}
