# Application Décentralisée de Registre Immobilier (Property Registry dApp)

Cette application décentralisée (dApp) permet la gestion d'un registre immobilier sur la blockchain Ethereum. Elle utilise un contrat intelligent pour enregistrer, approuver et vendre des propriétés, avec un système de rôles et de commissions.

## Fonctionnalités

### Rôles Utilisateurs
- **Super Admin**: Peut ajouter des administrateurs et enregistrer des utilisateurs
- **Admin**: Peut approuver/rejeter des propriétés et retirer ses commissions
- **Utilisateur Enregistré**: Peut enregistrer et acheter des propriétés

### Fonctionnalités Principales
- Enregistrement de propriétés avec titre, description, emplacement et prix
- Système d'approbation des propriétés par les administrateurs
- Achat de propriétés avec commission de 10% pour l'administrateur
- Gestion des gains des administrateurs
- Interface adaptative selon le rôle de l'utilisateur

## Technologies Utilisées

- **Contrat Intelligent**: Solidity (via Truffle)
- **Frontend**: React.js avec Vite
- **Intégration Blockchain**: Ethers.js
- **Connexion Portefeuille**: MetaMask
- **Développement Local**: Ganache

## Structure du Projet

```
/property-registry-dApp
├── contracts/
│   └── PropertyRegistryV3.sol   # Version actuelle du contrat
├── migrations/
│   └── 3_deploy_v3.js           # Script de déploiement V3
├── frontend/
│   ├── public/                  # Ressources statiques
│   ├── src/
│   │   ├── components/          # Composants React
│   │   ├── utils/               # Fonctions utilitaires
│   │   ├── contracts/           # ABIs des contrats
│   │   ├── App.jsx              # Composant principal de l'application
│   │   ├── App.css              # Styles de l'application
│   │   ├── main.jsx             # Point d'entrée
│   │   └── index.css            # Styles globaux
│   ├── package.json             # Dépendances frontend
│   └── vite.config.js           # Configuration Vite
└── truffle-config.js            # Configuration Truffle
```

## Démarrage

### Prérequis

- Node.js et npm
- Ganache - blockchain Ethereum locale
- Extension navigateur MetaMask
- Truffle CLI

### Instructions d'Installation

1. **Démarrer Ganache**
   ```bash
   # Démarrer l'interface Ganache ou via CLI
   ganache-cli
   ```

2. **Déployer les Contrats Intelligents**
   truffle compile
    truffle migrate --network development
    truffle migrate --reset

3. **Mettre à jour l'Adresse du Contrat**
   - Après le déploiement, copiez l'adresse du contrat depuis la sortie de Truffle
   - Mettez à jour l'adresse du contrat dans `frontend/src/utils/constants.js`

5. **Installer les Dépendances Frontend**
   cd frontend
   npm install

6. **Démarrer l'Application Frontend**
   npm run dev

7. **Configurer MetaMask**
   - Connectez MetaMask à Ganache (généralement http://localhost:7545)
   - Importez un compte depuis Ganache en utilisant la clé privée

## Fonctions du Contrat Intelligent

### Fonctions Utilisateur
- `registerProperty`: Enregistrer une nouvelle propriété
- `buyProperty`: Acheter une propriété
- `getUserProperties`: Obtenir les propriétés d'un utilisateur

### Fonctions Admin
- `approveProperty`: Approuver une propriété
- `rejectProperty`: Rejeter une propriété
- `withdrawAdminBalance`: Retirer les commissions accumulées

### Fonctions Super Admin
- `addAdmin`: Ajouter un nouvel administrateur
- `removeAdmin`: Supprimer un administrateur
- `registerUser`: Enregistrer un nouvel utilisateur

### Fonctions de Consultation
- `getPropertyDetails`: Obtenir les détails d'une propriété
- `getAllProperties`: Obtenir les IDs de toutes les propriétés
- `getAdminBalance`: Consulter le solde d'un administrateur

## Fonctionnalités Frontend

- **Interface adaptée aux rôles**: Vues différentes pour Super Admin, Admin et Utilisateur
- **Enregistrement de propriétés**: Formulaire pour soumettre de nouvelles propriétés
- **Marché immobilier**: Parcourir et acheter des propriétés approuvées
- **Mes Propriétés**: Voir les propriétés possédées et leur statut
- **Panneau d'administration**: Approuver ou rejeter les propriétés en attente
- **Panneau Super Admin**: Gérer les administrateurs et les utilisateurs
- **Gestion des commissions**: Consulter et retirer les commissions accumulées

## Tests

Pour exécuter les tests du contrat intelligent :
```bash
npx truffle test
```

## Utilisation de l'Application

### En tant que Super Admin
- Le compte qui déploie le contrat devient automatiquement le Super Admin
- Utilisez l'interface Super Admin pour ajouter des administrateurs et enregistrer des utilisateurs

### En tant qu'Admin
- Approuvez ou rejetez les propriétés en attente
- Retirez vos commissions accumulées (10% des ventes)

### En tant qu'Utilisateur
- Enregistrez de nouvelles propriétés (nécessite une approbation)
- Achetez des propriétés approuvées
- Consultez vos propriétés dans la section "Mes Propriétés"

## Déploiement sur Testnet

Pour déployer sur des testnets Ethereum comme Sepolia ou Goerli, mettez à jour le fichier `truffle-config.js` avec les paramètres de réseau appropriés et utilisez la commande suivante :

```bash
npx truffle migrate --network sepolia
```

## Dépannage

- Si vous rencontrez des problèmes de connexion avec MetaMask, assurez-vous que vous êtes sur le bon réseau (Ganache)
- Si les transactions échouent, vérifiez que vous avez suffisamment d'ETH dans votre portefeuille
- Pour réinitialiser l'application, redéployez les contrats et effacez le stockage local du navigateur

## Licence

Ce projet est sous licence MIT.
