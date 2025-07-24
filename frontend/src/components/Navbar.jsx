import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { ethers } from 'ethers';

const Navbar = () => {
  const [account, setAccount] = useState('');
  const [balance, setBalance] = useState('0');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isRegisteredUser, setIsRegisteredUser] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const checkIfConnected = async () => {
      try {
        if (window.ethereum) {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            getBalance(accounts[0]);
            checkUserRoles(accounts[0]);
          }
        }
      } catch (error) {
        console.error("Error checking connection:", error);
      }
    };

    checkIfConnected();
    window.ethereum?.on('accountsChanged', (accounts) => {
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        getBalance(accounts[0]);
        checkUserRoles(accounts[0]);
      } else {
        setAccount('');
        setBalance('');
        setIsAdmin(false);
        setIsSuperAdmin(false);
        setIsRegisteredUser(false);
      }
    });

    return () => {
      window.ethereum?.removeAllListeners('accountsChanged');
    };
  }, []);

  const getBalance = async (address) => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const balance = await provider.getBalance(address);
      setBalance(ethers.utils.formatEther(balance));
    } catch (error) {
      console.error("Error getting balance:", error);
    }
  };

  const checkUserRoles = async (address) => {
    try {
      if (!window.ethereum) return;
      
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      // Get the contract address from localStorage or use a default one
      const contractAddress = "0x295040e6d78ef0264608535e54441ca86ad3aDF6";
      
      // Access the contract ABI
      const abi = await import('../contracts/PropertyRegistry.json');
      
      // Create contract instance
      const contract = new ethers.Contract(contractAddress, abi.abi, signer);
      
      try {
        // Check if contract has the new functions (V3 contract)
        // If these functions don't exist, it will throw an error and fall back to the older contract version
        
        // Check if super admin
        const superAdmin = await contract.superAdmin();
        const isSuperAdminAccount = superAdmin.toLowerCase() === address.toLowerCase();
        setIsSuperAdmin(isSuperAdminAccount);
        
        // Check if admin
        const isAdminAccount = await contract.isAdmin(address);
        setIsAdmin(isAdminAccount);
        
        // Check if registered user
        const isUserRegistered = await contract.isUserRegistered(address);
        setIsRegisteredUser(isUserRegistered);
        
        console.log(`User roles: SuperAdmin=${isSuperAdminAccount}, Admin=${isAdminAccount}, Registered=${isUserRegistered}`);
      } catch (err) {
        // Fallback to older contract version
        try {
          // This is for V1/V2 contracts where there's only one admin role
          const admin = await contract.admin();
          const isUserAdmin = admin.toLowerCase() === address.toLowerCase();
          
          setIsAdmin(isUserAdmin);
          setIsSuperAdmin(isUserAdmin); // In old version, admin is also super admin
          setIsRegisteredUser(true); // All users are registered in old version
          
          console.log("Admin status (old contract):", isUserAdmin ? "You are admin" : "Not admin");
        } catch (oldContractErr) {
          console.error("Error checking admin status with old contract:", oldContractErr);
          setIsAdmin(false);
          setIsSuperAdmin(false);
          setIsRegisteredUser(false);
        }
      }
    } catch (error) {
      console.error("Error checking user roles:", error);
      setIsAdmin(false);
      setIsSuperAdmin(false);
      setIsRegisteredUser(false);
    }
  };

  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
        getBalance(accounts[0]);
        checkUserRoles(accounts[0]);
      } else {
        alert('Please install MetaMask to use this dApp');
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">Property Registry DApp</Link>
      </div>
      
      {account ? (
        <>
          <div className="navbar-menu">
            <Link to="/" className="navbar-item">Home</Link>
            <Link to="/marketplace" className="navbar-item">Marketplace</Link>
            <Link to="/all-properties" className="navbar-item">All Properties</Link>
            
            {/* Regular User Menu - Only shown for registered users who are not admins or super admins */}
            {isRegisteredUser && !isAdmin && !isSuperAdmin && (
              <div className="navbar-section user-menu">
                <div className="section-label">My Account</div>
                <Link to="/register" className="navbar-item">Register Property</Link>
                <Link to="/dashboard" className="navbar-item">My Properties</Link>
              </div>
            )}
            
            {/* Admin Menu */}
            {isAdmin && !isSuperAdmin && (
              <div className="navbar-section admin-menu">
                <div className="section-label admin-label">Admin</div>
                <Link to="/admin" className="navbar-item admin-item">Validate Properties</Link>
                <Link to="/admin-earnings" className="navbar-item admin-item">Admin Earnings</Link>
              </div>
            )}
            
            {/* Super Admin Menu */}
            {isSuperAdmin && (
              <div className="navbar-section super-admin-menu">
                <div className="section-label super-admin-label">Super Admin</div>
                <Link to="/super-admin" className="navbar-item super-admin-item">User Management</Link>
                <Link to="/admin" className="navbar-item super-admin-item">Validate Properties</Link>
                <Link to="/admin-earnings" className="navbar-item super-admin-item">Admin Earnings</Link>
              </div>
            )}
          </div>
          
          <div className="navbar-end">
            <div className="account-info">
              <div className="account-details">
                <span className="account-label">Balance:</span>
                <span className="balance">{balance} ETH</span>
              </div>
              <div className="account-address">
                <span className="account-label">Address:</span>
                <span className="address">{`${account.substring(0, 6)}...${account.substring(account.length - 4)}`}</span>
                {isSuperAdmin && <span className="super-admin-badge">Super Admin</span>}
                {isAdmin && !isSuperAdmin && <span className="admin-badge">Admin</span>}
                {isRegisteredUser && !isAdmin && !isSuperAdmin && <span className="user-badge">User</span>}
                {!isRegisteredUser && !isAdmin && !isSuperAdmin && <span className="unregistered-badge">Unregistered</span>}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="navbar-end-centered">
          <button className="connect-wallet" onClick={connectWallet}>Connect Wallet to Continue</button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
