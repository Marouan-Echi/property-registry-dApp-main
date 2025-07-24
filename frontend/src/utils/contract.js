import { ethers } from 'ethers';
import PropertyRegistryABI from '../contracts/PropertyRegistryV3.json';
import { CONTRACT_ADDRESS } from './constants';

/**
 * Gets an instance of the PropertyRegistry contract
 * @returns {Promise<ethers.Contract>} The contract instance
 */
export const getContract = async () => {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed. Please install it to use this dApp');
  }

  // Get the provider and signer
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();

  // Create a contract instance
  const contract = new ethers.Contract(
    CONTRACT_ADDRESS,
    PropertyRegistryABI.abi,
    signer
  );

  return contract;
};

/**
 * Gets the read-only contract (no signer, no write operations)
 * @returns {Promise<ethers.Contract>} The contract instance
 */
export const getReadOnlyContract = async () => {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed. Please install it to use this dApp');
  }

  // Get the provider only (no signer)
  const provider = new ethers.providers.Web3Provider(window.ethereum);

  // Create a contract instance (read-only)
  const contract = new ethers.Contract(
    CONTRACT_ADDRESS,
    PropertyRegistryABI.abi,
    provider
  );

  return contract;
};

/**
 * Checks user roles (including admin, superAdmin, and registeredUser) for the connected wallet
 * @param {string} account - The account address to check roles for
 * @returns {Promise<Object>} User roles (isAdmin, isSuperAdmin, isRegisteredUser)
 */
export const checkUserRoles = async (account) => {
  try {
    const contract = await getReadOnlyContract();
    let isAdmin = false;
    let isSuperAdmin = false;
    let isRegisteredUser = false;
    
    // If no account specified, get the current connected account
    if (!account) {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length === 0) {
        return { isAdmin, isSuperAdmin, isRegisteredUser };
      }
      account = accounts[0];
    }
    
    try {
      // Try V3 contract methods first
      // Check if super admin
      const superAdmin = await contract.superAdmin();
      isSuperAdmin = superAdmin.toLowerCase() === account.toLowerCase();
      
      // Check if admin
      isAdmin = await contract.isAdmin(account) || isSuperAdmin; // Super admin is also an admin
      
      // Check if registered user
      isRegisteredUser = await contract.isUserRegistered(account) || isAdmin || isSuperAdmin; // Admins and super admins are also registered users
    } catch (err) {
      // Fallback to older contract version
      try {
        // V1/V2 contracts where there's only one admin role
        const adminAddress = await contract.admin();
        isAdmin = adminAddress.toLowerCase() === account.toLowerCase();
        isSuperAdmin = isAdmin; // In old version, admin is also super admin
        isRegisteredUser = true; // All users are registered in old version
      } catch (oldContractErr) {
        console.error('Error checking roles with old contract:', oldContractErr);
      }
    }
    
    return { isAdmin, isSuperAdmin, isRegisteredUser };
  } catch (error) {
    console.error('Error checking user roles:', error);
    return { isAdmin: false, isSuperAdmin: false, isRegisteredUser: false };
  }
};

/**
 * Checks if the connected wallet is an admin
 * @returns {Promise<boolean>} Whether the connected wallet is an admin
 */
export const isAdmin = async () => {
  try {
    const { isAdmin } = await checkUserRoles();
    return isAdmin;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

/**
 * Checks if the connected wallet is the super admin
 * @returns {Promise<boolean>} Whether the connected wallet is the super admin
 */
export const isSuperAdmin = async () => {
  try {
    const { isSuperAdmin } = await checkUserRoles();
    return isSuperAdmin;
  } catch (error) {
    console.error('Error checking super admin status:', error);
    return false;
  }
};

/**
 * Checks if the connected wallet is a registered user
 * @returns {Promise<boolean>} Whether the connected wallet is a registered user
 */
export const isRegisteredUser = async () => {
  try {
    const { isRegisteredUser } = await checkUserRoles();
    return isRegisteredUser;
  } catch (error) {
    console.error('Error checking registered user status:', error);
    return false;
  }
};
