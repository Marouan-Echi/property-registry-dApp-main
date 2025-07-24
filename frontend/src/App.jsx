/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import './App.css'

// Components
import Navbar from './components/Navbar'

// Contract utilities
import { getContract, checkUserRoles } from './utils/contract'

function App() {
  // State for wallet connection and user roles
  const [account, setAccount] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isRegisteredUser, setIsRegisteredUser] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // State for active view
  const [activeView, setActiveView] = useState('home'); // 'home', 'properties', 'register', 'admin'
  
  // State for properties
  const [properties, setProperties] = useState([]);
  const [userProperties, setUserProperties] = useState([]);
  const [pendingProperties, setPendingProperties] = useState([]);
  
  // State for forms
  const [newPropertyForm, setNewPropertyForm] = useState({
    title: '',
    description: '',
    location: '',
    price: ''
  });
  
  // State for admin functions
  const [adminBalance, setAdminBalance] = useState('0');
  const [newAdminAddress, setNewAdminAddress] = useState('');
  const [newUserAddress, setNewUserAddress] = useState('');
  
  // State for error and success messages
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [ethBalance, setEthBalance] = useState('0');

  const fetchEthBalance = async (address) => {
    if (window.ethereum && address) {
      try {
        const balance = await window.ethereum.request({
          method: 'eth_getBalance',
          params: [address, 'latest']
        });
        setEthBalance(ethers.utils.formatEther(balance));
      } catch (error) {
        console.error("Error fetching balance:", error);
      }
    }
  };


  useEffect(() => {
    // Check if MetaMask is installed and connected
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          // Check if we're already connected
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          const isConnected = accounts.length > 0;
          setIsConnected(isConnected);
          
          if (isConnected) {
            setAccount(accounts[0]);
            await checkUserRolesAndLoadData(accounts[0]);
          }
          
          setLoading(false);
        } catch (error) {
          console.error('Error checking connection:', error);
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    checkConnection();

    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(true);
          checkUserRolesAndLoadData(accounts[0]);
        } else {
          setAccount('');
          setIsConnected(false);
          setIsAdmin(false);
          setIsSuperAdmin(false);
          setIsRegisteredUser(false);
        }
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
      }
    };
  }, []);
  
  // Check user roles and load relevant data
  const checkUserRolesAndLoadData = async (userAccount) => {
    try {
      const { isAdmin: admin, isSuperAdmin: superAdmin, isRegisteredUser: regUser } = 
        await checkUserRoles(userAccount);
      
      setIsAdmin(admin);
      setIsSuperAdmin(superAdmin);
      setIsRegisteredUser(regUser);
      
      // Load properties
      await loadProperties();
      
      // If admin or super admin, load pending properties
      if (admin || superAdmin) {
        await loadPendingProperties();
        await loadAdminBalance(userAccount);
      }
      
      // Load user properties if registered
      if (regUser || admin || superAdmin) {
        await loadUserProperties(userAccount);
      }
    } catch (error) {
      console.error('Error checking user roles:', error);
      setError('Failed to load user data. Please try again.');
    }
  };
  
  // Load all approved properties
  const loadProperties = async () => {
    try {
      const contract = await getContract();
      const propertyIds = await contract.getAllProperties();
      
      const propertiesData = [];
      
      for (const id of propertyIds) {
        try {
          const property = await contract.getPropertyDetails(id);
          
          // Only add approved properties that are not sold
          if (property.status === 1) { // PropertyStatus.Approved = 1
            propertiesData.push({
              id: property.id.toString(),
              title: property.title,
              description: property.description,
              location: property.location,
              price: ethers.utils.formatEther(property.price),
              owner: property.owner,
              status: property.status,
              approvedBy: property.approvedBy
            });
          }
        } catch (err) {
          console.error(`Error loading property ${id}:`, err);
        }
      }
      
      setProperties(propertiesData);
    } catch (error) {
      console.error('Error loading properties:', error);
      setError('Failed to load properties. Please try again.');
    }
  };
  
  // Load user's properties
  const loadUserProperties = async (userAccount) => {
    try {
      const contract = await getContract();
      const propertyIds = await contract.getUserProperties(userAccount);
      
      const userPropertiesData = [];
      
      for (const id of propertyIds) {
        try {
          const property = await contract.getPropertyDetails(id);
          
          userPropertiesData.push({
            id: property.id.toString(),
            title: property.title,
            description: property.description,
            location: property.location,
            price: ethers.utils.formatEther(property.price),
            owner: property.owner,
            status: property.status,
            approvedBy: property.approvedBy
          });
        } catch (err) {
          console.error(`Error loading user property ${id}:`, err);
        }
      }
      
      setUserProperties(userPropertiesData);
    } catch (error) {
      console.error('Error loading user properties:', error);
      setError('Failed to load your properties. Please try again.');
    }
  };
  
  // Load pending properties (for admins)
  const loadPendingProperties = async () => {
    try {
      const contract = await getContract();
      const propertyIds = await contract.getAllProperties();
      
      const pendingPropertiesData = [];
      
      for (const id of propertyIds) {
        try {
          const property = await contract.getPropertyDetails(id);
          
          // Only add pending properties
          if (property.status === 0) { // PropertyStatus.Pending = 0
            pendingPropertiesData.push({
              id: property.id.toString(),
              title: property.title,
              description: property.description,
              location: property.location,
              price: ethers.utils.formatEther(property.price),
              owner: property.owner,
              status: property.status,
              approvedBy: property.approvedBy
            });
          }
        } catch (err) {
          console.error(`Error loading pending property ${id}:`, err);
        }
      }
      
      setPendingProperties(pendingPropertiesData);
    } catch (error) {
      console.error('Error loading pending properties:', error);
      setError('Failed to load pending properties. Please try again.');
    }
  };
  
  // Load admin balance
  const loadAdminBalance = async (adminAddress) => {
    try {
      const contract = await getContract();
      const balance = await contract.getAdminBalance(adminAddress);
      setAdminBalance(ethers.utils.formatEther(balance));
    } catch (error) {
      console.error('Error loading admin balance:', error);
      setError('Failed to load admin earnings. Please try again.');
    }
  };
  
  // Connect wallet
  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
        setIsConnected(true);
        await checkUserRolesAndLoadData(accounts[0]);
        setSuccess('Wallet connected successfully!');
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('MetaMask is not installed. Please install it to use this dApp.');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setError('Failed to connect wallet. Please try again.');
    }
  };
  
  // SUPER ADMIN FUNCTIONS
  
  // Add a new admin
  const addAdmin = async () => {
    try {
      if (!newAdminAddress || !ethers.utils.isAddress(newAdminAddress)) {
        setError('Please enter a valid Ethereum address');
        return;
      }
      
      const contract = await getContract();
      const tx = await contract.addAdmin(newAdminAddress);
      
      setSuccess('Adding admin... Please wait for transaction confirmation.');
      await tx.wait();
      
      setSuccess(`Admin ${newAdminAddress} added successfully!`);
      setNewAdminAddress('');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error adding admin:', error);
      setError(`Failed to add admin: ${error.message || 'Unknown error'}`);
    }
  };
  
  // Register a new user
  const registerUser = async () => {
    try {
      if (!newUserAddress || !ethers.utils.isAddress(newUserAddress)) {
        setError('Please enter a valid Ethereum address');
        return;
      }
      
      const contract = await getContract();
      const tx = await contract.registerUser(newUserAddress);
      
      setSuccess('Registering user... Please wait for transaction confirmation.');
      await tx.wait();
      
      setSuccess(`User ${newUserAddress} registered successfully!`);
      setNewUserAddress('');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error registering user:', error);
      setError(`Failed to register user: ${error.message || 'Unknown error'}`);
    }
  };
  
  // ADMIN FUNCTIONS
  
  // Approve a property
  const approveProperty = async (propertyId) => {
    try {
      const contract = await getContract();
      const tx = await contract.approveProperty(propertyId);
      
      setSuccess('Approving property... Please wait for transaction confirmation.');
      await tx.wait();
      
      // Reload pending properties
      await loadPendingProperties();
      await loadProperties();
      
      setSuccess('Property approved successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error approving property:', error);
      setError(`Failed to approve property: ${error.message || 'Unknown error'}`);
    }
  };
  
  // Reject a property
  const rejectProperty = async (propertyId) => {
    try {
      const contract = await getContract();
      const tx = await contract.rejectProperty(propertyId);
      
      setSuccess('Rejecting property... Please wait for transaction confirmation.');
      await tx.wait();
      
      // Reload pending properties
      await loadPendingProperties();
      
      setSuccess('Property rejected successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error rejecting property:', error);
      setError(`Failed to reject property: ${error.message || 'Unknown error'}`);
    }
  };
  
  // Withdraw admin earnings
  const withdrawEarnings = async () => {
    try {
      const contract = await getContract();
      const tx = await contract.withdrawAdminBalance();
      
      setSuccess('Withdrawing earnings... Please wait for transaction confirmation.');
      await tx.wait();
      
      // Update admin balance
      await loadAdminBalance(account);
      
      setSuccess('Earnings withdrawn successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error withdrawing earnings:', error);
      setError(`Failed to withdraw earnings: ${error.message || 'Unknown error'}`);
    }
  };
  
  // USER FUNCTIONS
  
  // Register a new property
  const registerProperty = async () => {
    try {
      const { title, description, location, price } = newPropertyForm;
      
      if (!title || !description || !location || !price) {
        setError('Please fill in all fields');
        return;
      }
      
      const priceInWei = ethers.utils.parseEther(price.toString());
      
      const contract = await getContract();
      const tx = await contract.registerProperty(title, description, location, priceInWei);
      
      setSuccess('Registering property... Please wait for transaction confirmation.');
      await tx.wait();
      
      // Reset form
      setNewPropertyForm({
        title: '',
        description: '',
        location: '',
        price: ''
      });
      
      // Reload user properties
      await loadUserProperties(account);
      
      setSuccess('Property registered successfully! Waiting for admin approval.');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error registering property:', error);
      setError(`Failed to register property: ${error.message || 'Unknown error'}`);
    }
  };
  
  // Buy a property
  const buyProperty = async (propertyId, price) => {
    try {
      const priceInWei = ethers.utils.parseEther(price.toString());
      
      const contract = await getContract();
      const tx = await contract.buyProperty(propertyId, { value: priceInWei });
      
      setSuccess('Buying property... Please wait for transaction confirmation.');
      await tx.wait();
      
      // Reload properties
      await loadProperties();
      await loadUserProperties(account);
      
      setSuccess('Property purchased successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error buying property:', error);
      setError(`Failed to buy property: ${error.message || 'Unknown error'}`);
    }
  };
  
  // Handle property form input changes
  const handlePropertyFormChange = (e) => {
    const { name, value } = e.target;
    setNewPropertyForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Navigation handler
  const handleNavigation = (view) => {
    setActiveView(view);
  };
  
  // Render loading state
  if (loading) {
    return (
      <div className="app-container">
        <div className="loading-container">
          <h2>Loading Property Registry DApp...</h2>
          <p>Please wait while we connect to the blockchain</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="app-container">
    {/* Gradient header with glass morphism effect */}
    <header className="app-header">
      <div className="header-content">
        <h1>🏠 EtherEstate</h1>
        <p className="tagline">Decentralized Property Registry on Blockchain</p>
        
        <div className="wallet-info">
          {isConnected ? (
            <div className="connected-wallet">
              <div className="wallet-address">
                <span className="wallet-icon">🔗</span>
                {`${account.substring(0, 6)}...${account.substring(account.length - 4)}`}
              </div>
              <div className="role-badges">
                {isSuperAdmin && <span className="role-badge super-admin">👑 Super Admin</span>}
                {isAdmin && !isSuperAdmin && <span className="role-badge admin">🛡️ Admin</span>}
                {isRegisteredUser && !isAdmin && !isSuperAdmin && <span className="role-badge user">👤 User</span>}
                {!isRegisteredUser && !isAdmin && !isSuperAdmin && <span className="role-badge">🔒 Not Registered</span>}
              </div>
              
            </div>
          ) : (
            <button className="connect-button" onClick={connectWallet}>
              <span className="button-icon">🔌</span> Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
    
    {/* Modern navigation with role-based options */}
    <nav className="app-nav">
      <ul>
        <li 
          className={activeView === 'home' ? 'active' : ''} 
          onClick={() => handleNavigation('home')}
        >
          <span className="nav-icon">🏠</span> Home
        </li>
        <li 
          className={activeView === 'properties' ? 'active' : ''} 
          onClick={() => handleNavigation('properties')}
        >
          <span className="nav-icon">🏙️</span> Marketplace
        </li>
        
        {/* Only show "My Properties" for registered users who aren't admins */}
        {isRegisteredUser && !isAdmin && !isSuperAdmin && (
          <li 
            className={activeView === 'my-properties' ? 'active' : ''} 
            onClick={() => handleNavigation('my-properties')}
          >
            <span className="nav-icon">📋</span> My Properties
          </li>
        )}
        
        {/* Only show "Register Property" for registered users who aren't admins */}
        {isRegisteredUser && !isAdmin && !isSuperAdmin && (
          <li 
            className={activeView === 'register-property' ? 'active' : ''} 
            onClick={() => handleNavigation('register-property')}
          >
            <span className="nav-icon">✍️</span> Register Property
          </li>
        )}
        
        {/* Admin-specific navigation */}
        {(isAdmin || isSuperAdmin) && (
          <li 
            className={activeView === 'admin-panel' ? 'active' : ''} 
            onClick={() => handleNavigation('admin-panel')}
          >
            <span className="nav-icon">⚙️</span> Admin Panel
          </li>
        )}
        
        {/* Super Admin-specific navigation */}
        {isSuperAdmin && (
          <li 
            className={activeView === 'super-admin' ? 'active' : ''} 
            onClick={() => handleNavigation('super-admin')}
          >
            <span className="nav-icon">👑</span> Super Admin
          </li>
        )}
      </ul>
    </nav>
    
    {/* Notification system */}
    <div className="notifications">
      {error && (
        <div className="notification error">
          <span className="notification-icon">❌</span>
          {error}
          <button className="close-notification" onClick={() => setError('')}>×</button>
        </div>
      )}
      {success && (
        <div className="notification success">
          <span className="notification-icon">✅</span>
          {success}
          <button className="close-notification" onClick={() => setSuccess('')}>×</button>
        </div>
      )}
    </div>
    
    <main className="main-content">
      {/* Home View */}
      {activeView === 'home' && (
        <div className="home-view view-container">
          <div className="hero-section">
            <h2>Welcome to EtherEstate</h2>
            <p className="hero-description">
              A revolutionary decentralized platform for property registration 
              and trading on the Ethereum blockchain.
            </p>
            
            {!isConnected && (
              <div className="connect-prompt">
                <p>Connect your wallet to access the platform</p>
                <button className="connect-button large" onClick={connectWallet}>
                  <span className="button-icon">🔗</span> Connect Wallet
                </button>
              </div>
            )}
            
            {isConnected && !isRegisteredUser && !isAdmin && !isSuperAdmin && (
              <div className="not-registered">
                <div className="info-card warning">
                  <h3>Account Not Registered</h3>
                  <p>Your wallet address needs to be registered to use the platform.</p>
                  <p>Please contact the administrator to get registered.</p>
                </div>
              </div>
            )}
          </div>
          
          {(isConnected && (isRegisteredUser || isAdmin || isSuperAdmin)) && (
            <div className="quick-stats">
              <div className="stat-card">
                <h3>Total Properties</h3>
                <p className="stat-value">{properties.length}</p>
              </div>
              <div className="stat-card">
                <h3>Your Properties</h3>
                <p className="stat-value">{userProperties.length}</p>
              </div>
              {(isAdmin || isSuperAdmin) && (
                <div className="stat-card">
                  <h3>Pending Approvals</h3>
                  <p className="stat-value">{pendingProperties.length}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Properties Marketplace View */}
      {activeView === 'properties' && (
        <div className="properties-view view-container">
          <div className="view-header">
            <h2>Property Marketplace</h2>
            <p>Browse and purchase properties on the blockchain</p>
          </div>
          
          {properties.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🏚️</div>
              <h3>No properties available</h3>
              <p>Check back later or register a new property</p>
            </div>
          ) : (
            <div className="properties-grid">
              {properties.map(property => (
                <div className="property-card" key={property.id}>
                  <div className="property-image-placeholder">
                    {property.title.charAt(0).toUpperCase()}
                  </div>
                  <div className="property-details">
                    <h3>{property.title}</h3>
                    <p className="property-location">
                      <span className="detail-icon">📍</span> {property.location}
                    </p>
                    <p className="property-price">
                      <span className="detail-icon">💰</span> {property.price} ETH
                    </p>
                    <p className="property-owner">
                      <span className="detail-icon">👤</span> {`${property.owner.substring(0, 6)}...${property.owner.substring(property.owner.length - 4)}`}
                    </p>
                    <p className="property-description">{property.description}</p>
                    
                    {isConnected && isRegisteredUser && property.owner.toLowerCase() !== account.toLowerCase() && (
                      <button 
                        className="action-button buy-button" 
                        onClick={() => buyProperty(property.id, property.price)}
                      >
                        <span className="button-icon">🛒</span> Buy Property
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* My Properties View */}
      {activeView === 'my-properties' && (isRegisteredUser || isAdmin || isSuperAdmin) && (
        <div className="my-properties-view view-container">
          <div className="view-header">
            <h2>My Properties</h2>
            <p>Manage your property portfolio</p>
          </div>
          
          {userProperties.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h3>No properties registered</h3>
              <p>Register your first property to get started</p>
              <button 
                className="action-button" 
                onClick={() => handleNavigation('register-property')}
              >
                <span className="button-icon">✍️</span> Register Property
              </button>
            </div>
          ) : (
            <div className="properties-grid">
              {userProperties.map(property => (
                <div className="property-card" key={property.id}>
                  <div className="property-image-placeholder">
                    {property.title.charAt(0).toUpperCase()}
                  </div>
                  <div className="property-details">
                    <h3>{property.title}</h3>
                    <div className={`status-badge status-${property.status}`}>
                      {property.status === 0 ? 'Pending' :
                       property.status === 1 ? 'Approved' :
                       property.status === 2 ? 'Rejected' : 'Sold'}
                    </div>
                    <p className="property-location">
                      <span className="detail-icon">📍</span> {property.location}
                    </p>
                    <p className="property-price">
                      <span className="detail-icon">💰</span> {property.price} ETH
                    </p>
                    <p className="property-description">{property.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Register Property View */}
      {activeView === 'register-property' && (isRegisteredUser || isAdmin || isSuperAdmin) && (
        <div className="register-property-view view-container">
          <div className="view-header">
            <h2>Register New Property</h2>
            <p>Add your property to the blockchain registry</p>
          </div>
          
          <div className="property-form-container">
            <div className="property-form">
              <div className="form-group">
                <label htmlFor="title">
                  <span className="form-icon">🏷️</span> Title
                </label>
                <input 
                  type="text" 
                  id="title" 
                  name="title" 
                  value={newPropertyForm.title} 
                  onChange={handlePropertyFormChange} 
                  placeholder="Luxury Beachfront Villa"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="description">
                  <span className="form-icon">📝</span> Description
                </label>
                <textarea 
                  id="description" 
                  name="description" 
                  value={newPropertyForm.description} 
                  onChange={handlePropertyFormChange} 
                  placeholder="Describe your property in detail..."
                  rows="4"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="location">
                  <span className="form-icon">🌍</span> Location
                </label>
                <input 
                  type="text" 
                  id="location" 
                  name="location" 
                  value={newPropertyForm.location} 
                  onChange={handlePropertyFormChange} 
                  placeholder="123 Blockchain Ave, Crypto City"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="price">
                  <span className="form-icon">Ξ</span> Price (ETH)
                </label>
                <input 
                  type="number" 
                  id="price" 
                  name="price" 
                  value={newPropertyForm.price} 
                  onChange={handlePropertyFormChange} 
                  placeholder="2.5"
                  step="0.01"
                  min="0"
                />
              </div>
              
              <button className="action-button submit-button" onClick={registerProperty}>
                <span className="button-icon">✍️</span> Register Property
              </button>
            </div>
            
            <div className="form-preview">
              <h3>Property Preview</h3>
              <div className="preview-card">
                {newPropertyForm.title ? (
                  <>
                    <div className="preview-image">
                      {newPropertyForm.title.charAt(0).toUpperCase()}
                    </div>
                    <h4>{newPropertyForm.title}</h4>
                    <p className="preview-location">
                      <span className="preview-icon">📍</span> 
                      {newPropertyForm.location || 'Location not specified'}
                    </p>
                    <p className="preview-price">
                      <span className="preview-icon">💰</span> 
                      {newPropertyForm.price ? `${newPropertyForm.price} ETH` : 'Price not set'}
                    </p>
                    <p className="preview-description">
                      {newPropertyForm.description || 'No description provided'}
                    </p>
                  </>
                ) : (
                  <div className="empty-preview">
                    <span className="preview-icon">👀</span>
                    <p>Your property details will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Admin Panel View */}
      {activeView === 'admin-panel' && (isAdmin || isSuperAdmin) && (
        <div className="admin-panel-view view-container">
          <div className="view-header">
            <h2>Admin Dashboard</h2>
            <p>Manage property approvals and platform administration</p>
          </div>
          
          <div className="admin-tabs">
            <div className="admin-tab active">
              <h3>Pending Approvals</h3>
              {pendingProperties.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">👍</div>
                  <h3>No pending properties</h3>
                  <p>All caught up with approvals!</p>
                </div>
              ) : (
                <div className="pending-properties-list">
                  {pendingProperties.map(property => (
                    <div className="pending-property-card" key={property.id}>
                      <div className="property-header">
                        <h4>{property.title}</h4>
                        <span className="submitted-by">
                          Submitted by: {`${property.owner.substring(0, 6)}...${property.owner.substring(property.owner.length - 4)}`}
                        </span>
                      </div>
                      <p className="property-location">
                        <span className="detail-icon">📍</span> {property.location}
                      </p>
                      <p className="property-price">
                        <span className="detail-icon">💰</span> {property.price} ETH
                      </p>
                      <p className="property-description">{property.description}</p>
                      
                      <div className="approval-actions">
                        <button 
                          className="action-button approve-button" 
                          onClick={() => approveProperty(property.id)}
                        >
                          <span className="button-icon">✓</span> Approve
                        </button>
                        <button 
                          className="action-button reject-button" 
                          onClick={() => rejectProperty(property.id)}
                        >
                          <span className="button-icon">✗</span> Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="admin-tab">
              <h3>Earnings & Balance</h3>
              <div className="earnings-card">
                <div className="balance-display">
                  <span className="balance-icon">💰</span>
                  <span className="balance-amount">{adminBalance}</span>
                  <span className="balance-currency">ETH</span>
                </div>
                <p className="balance-description">
                  This is your accumulated commission from property sales
                </p>
                <button 
                  className="action-button withdraw-button" 
                  onClick={withdrawEarnings}
                  disabled={parseFloat(adminBalance) === 0}
                >
                  <span className="button-icon">💸</span> Withdraw Earnings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Super Admin View */}
      {activeView === 'super-admin' && isSuperAdmin && (
        <div className="super-admin-view view-container">
          <div className="view-header">
            <h2>Super Admin Console</h2>
            <p>Manage platform roles and permissions</p>
          </div>
          
          <div className="super-admin-cards">
            <div className="admin-card">
              <h3>Add New Admin</h3>
              <div className="card-content">
                <p>Grant admin privileges to a wallet address:</p>
                <div className="address-input">
                  <input 
                    type="text" 
                    value={newAdminAddress} 
                    onChange={(e) => setNewAdminAddress(e.target.value)} 
                    placeholder="0x123...abc"
                  />
                  <button 
                    className="action-button" 
                    onClick={addAdmin}
                    disabled={!newAdminAddress || !ethers.utils.isAddress(newAdminAddress)}
                  >
                    <span className="button-icon">🛡️</span> Add Admin
                  </button>
                </div>
              </div>
            </div>
            
            <div className="admin-card">
              <h3>Register New User</h3>
              <div className="card-content">
                <p>Register a new user wallet address:</p>
                <div className="address-input">
                  <input 
                    type="text" 
                    value={newUserAddress} 
                    onChange={(e) => setNewUserAddress(e.target.value)} 
                    placeholder="0x123...abc"
                  />
                  <button 
                    className="action-button" 
                    onClick={registerUser}
                    disabled={!newUserAddress || !ethers.utils.isAddress(newUserAddress)}
                  >
                    <span className="button-icon">👤</span> Register User
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
    
    <footer className="footer">
      <div className="footer-content">
        <p>© {new Date().getFullYear()} EtherEstate - Decentralized Property Registry</p>
        <div className="footer-links">
          <a href="#" className="footer-link">Terms</a>
          <a href="#" className="footer-link">Privacy</a>
          <a href="#" className="footer-link">Docs</a>
        </div>
      </div>
    </footer>
  </div>
)
}

export default App
