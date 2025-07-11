# Guide de Déploiement Netlify

## Configuration Netlify

Cette application est configurée pour être déployée sur Netlify avec les paramètres suivants :

### Paramètres de Build
- **Build Command**: `npm run build`
- **Publish Directory**: `dist/public`
- **Node Version**: 20

### Fichiers de Configuration

#### netlify.toml
- Configuration principale de Netlify
- Redirection SPA pour les routes React
- Headers de sécurité et performance
- Cache des assets statiques

#### _redirects
- Fichier de redirection pour les routes SPA
- Redirige toutes les routes vers `index.html`

### Variables d'Environnement Netlify

Pour que l'application fonctionne correctement, vous devez configurer les variables d'environnement suivantes dans Netlify :

#### Firebase Configuration
```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### Étapes de Déploiement

1. **Connecter le Repository**
   - Connectez votre repository GitHub à Netlify
   - Sélectionnez la branche main pour le déploiement

2. **Configurer les Variables d'Environnement**
   - Allez dans Site settings > Environment variables
   - Ajoutez toutes les variables Firebase listées ci-dessus

3. **Vérifier la Configuration**
   - Build command: `npm run build`
   - Publish directory: `dist/public`
   - Node version: 20

4. **Déployer**
   - Cliquez sur "Deploy site"
   - Netlify va automatiquement construire et déployer votre application

### Fonctionnalités Supportées

✅ **Frontend complet** - Interface React avec toutes les fonctionnalités
✅ **Routing SPA** - Navigation côté client avec wouter
✅ **Firebase Integration** - Authentification et base de données
✅ **Historical Stock Tracking** - Suivi historique des stocks
✅ **Import/Export Excel** - Fonctionnalités d'import/export
✅ **Responsive Design** - Interface adaptée mobile/desktop

### Limitations

⚠️ **Pas de Backend** - Cette configuration déploie uniquement le frontend
⚠️ **Pas d'API Routes** - Les routes API Express ne sont pas disponibles
⚠️ **Firebase Requis** - Toutes les données doivent être stockées dans Firebase

### Optimisations Incluses

- **Cache des Assets** - CSS, JS, images cachés pendant 1 an
- **Headers de Sécurité** - Protection XSS, CSRF, et autres
- **Compression** - Compression automatique des assets
- **PWA Ready** - Structure prête pour une Progressive Web App

## Résolution des Problèmes

### Build Échoue
- Vérifiez que toutes les dépendances sont installées
- Assurez-vous que les variables d'environnement sont correctement configurées
- Vérifiez les logs de build pour les erreurs spécifiques

### Application Ne Charge Pas
- Vérifiez la configuration Firebase
- Assurez-vous que les variables d'environnement sont correctement définies
- Vérifiez la console du navigateur pour les erreurs

### Routes Ne Fonctionnent Pas
- Assurez-vous que le fichier `_redirects` est présent
- Vérifiez la configuration des redirections dans `netlify.toml`

## Support

Pour plus d'aide, consultez :
- [Documentation Netlify](https://docs.netlify.com/)
- [Guide Firebase](https://firebase.google.com/docs)
- [Documentation Vite](https://vitejs.dev/guide/)