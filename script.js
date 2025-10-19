// 🔧 PARAMÈTRES PRINCIPAUX - Modifiez ces valeurs pour personnaliser l'app
        const APP_CONFIG = {

            
            // 🔐 SÉCURITÉ - Hash SHA-256 du mot de passe administrateur
            adminPasswordHash: '3982ec90cc5b6b901b4879446cb44639ea718a09c76d0a1253f8a33bd6f5fa71',
            
            // 📝 TEXTES ET TITRES
            texts: {
                appTitle: 'Mod Nationale 1 - FC25',
                appSubtitle: 'Gestionnaire de progression',
                visitorMode: 'Mode Visiteur',
                adminMode: 'Mode Admin',
                loginTitle: 'Mod Nationale 1 - FC25',
                loginSubtitle: 'Gestionnaire de progression'
            },
            
            // 🏆 ÉQUIPES (ajoutez/supprimez des équipes ici)
            teams: [
                'AS Nancy', 'Le Mans FC', 'Boulogne', 'Dijon FCO', 'Bourg-Péronnas',
                'Aubagne FC', 'Orléans', 'Concarneau', 'Valenciennes FC', 'Rouen',
                'Quevilly', 'Sochaux', 'Versailles 78', 'Paris 13 Atletico',
                'Villefranche Beaujolais', 'Châteauroux', 'Nîmes Olympique'
            ],
            
            // 📋 TÂCHES PAR ÉQUIPE
            teamTasks: [
                'Créer logo équipe', 'Créer maillot domicile', 'Créer maillot extérieur',
                'Créer maillot gardien', 'Créer écharpe', 'Créer drapeau', 
                'Changer nom de stade', 'Changer capacité du stade', 'Créer effectif de équipe'
            ],
            
            // 🏅 TÂCHES DE LIGUE
            leagueTasks: [
                'Créer logo ligue', 'Créer trophée ligue', 'Créer bannière ligue', 
                'Changer nom dans fichier LOC', 'Modifier calendrier de rencontres', 
                'Voir pour des barrages pour relégation ligue 2 et nationale (facultatif)'
            ],
            

            
            // ⚙️ OPTIONS
            options: {
                autoSyncInterval: 10000,
                maxActivities: 100,
                maxNotifications: 50,
                notificationDuration: 8000
            }
        };

        // 🔐 FONCTION UTILITAIRE POUR GÉNÉRER UN NOUVEAU HASH
        async function generatePasswordHash(password) {
            try {
                const encoder = new TextEncoder();
                const data = encoder.encode(password);
                const hashBuffer = await crypto.subtle.digest('SHA-256', data);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                console.log(`Hash pour "${password}": ${hashHex}`);
                console.log(`Remplacez adminPasswordHash par: '${hashHex}'`);
                return hashHex;
            } catch (error) {
                console.error('Erreur génération hash:', error);
            }
        }

// Configuration Firebase directe
        const firebaseConfig = {
            apiKey: "AIzaSyBdHQw8ZAvm4boMbWD5HlCRnT-jO9HgxbU",
            authDomain: "fc25-ded0b.firebaseapp.com",
            databaseURL: "https://fc25-ded0b-default-rtdb.europe-west1.firebasedatabase.app",
            projectId: "fc25-ded0b",
            storageBucket: "fc25-ded0b.firebasestorage.app",
            messagingSenderId: "158286052687",
            appId: "1:158286052687:web:b8ce1b8351725f2e0a193a"
        };

        // Initialisation Firebase avec diagnostic
        let firebaseApp, database;
        
        try {
            firebaseApp = firebase.initializeApp(firebaseConfig);
            database = firebase.database();
            console.log('✅ Firebase initialisé avec succès');
            
            // Test de connexion immédiat
            database.ref('.info/connected').on('value', (snapshot) => {
                const connected = snapshot.val();
                console.log('🔗 État connexion Firebase:', connected ? 'CONNECTÉ' : 'DÉCONNECTÉ');
                
                if (!connected) {
                    console.warn('⚠️ Firebase déconnecté - causes possibles:');
                    console.warn('1. Règles de sécurité Firebase trop restrictives');
                    console.warn('2. Domaine non autorisé dans Firebase Console');
                    console.warn('3. Problème de réseau ou firewall');
                    console.warn('4. Quota Firebase dépassé');
                }
                
                AppState.isOnline = connected;
                if (document.getElementById('connectionStatus')) {
                    Auth.updateConnectionStatus();
                }
            });
            
        } catch (error) {
            console.error('❌ Erreur Firebase:', error);
            console.error('Détails:', error.message);
            console.log('📱 Basculement en mode local');
            AppState.isOnline = false;
        }

        // État global
        const AppState = {
            isAdmin: false,
            currentPage: 'home',
            data: {},
            userName: 'Utilisateur',
            isOnline: !!database,
            lastSync: null
        };

        // Configuration centralisée
        const Config = {
            teams: APP_CONFIG.teams,
            tasks: APP_CONFIG.teamTasks,
            leagueTasks: APP_CONFIG.leagueTasks
        };

        // Fonctions globales pour les boutons
        window.enterVisitor = function() {
            Auth.enterVisitor();
        };
        
        window.showAdminForm = function() {
            Auth.showAdminForm();
        };
        
        window.enterAdmin = function() {
            Auth.enterAdmin();
        };

        // Système Firebase
        const FirebaseManager = {
            async saveToFirebase(data) {
                if (!database) {
                    const errorMsg = '❌ FIREBASE SAVE: Database non initialisé';
                    console.error(errorMsg);
                    Console.log(errorMsg, 'error');
                    return false;
                }
                
                try {
                    const startMsg = '🔄 DÉBUT SAUVEGARDE FIREBASE';
                    console.log(startMsg);
                    Console.log(startMsg, 'info');
                    
                    // Calculer la taille des données
                    const dataString = JSON.stringify(data);
                    const dataSizeMB = (dataString.length / (1024*1024)).toFixed(2);
                    const sizeMsg = `📊 Taille données à sauvegarder: ${dataSizeMB} MB`;
                    console.log(sizeMsg);
                    Console.log(sizeMsg, 'info');
                    
                    // Vérifier la limite Firebase (32MB par document)
                    if (dataString.length > 30 * 1024 * 1024) {
                        const limitErrorMsg = '🚨 ERREUR: Données trop volumineuses pour Firebase (>30MB)';
                        console.error(limitErrorMsg);
                        Console.log(limitErrorMsg, 'error');
                        
                        const solutionMsg = '💡 SOLUTION: Supprimez des vidéos/images pour réduire la taille';
                        console.log(solutionMsg);
                        Console.log(solutionMsg, 'warning');
                        return false;
                    }
                    
                    const dataToSave = {
                        ...data,
                        lastModified: Date.now(),
                        modifiedBy: AppState.userName
                    };
                    
                    const sendMsg = '📤 Envoi vers Firebase...';
                    console.log(sendMsg);
                    Console.log(sendMsg, 'info');
                    
                    // Test de connexion d'abord
                    Console.log('🔍 Test de connexion Firebase...', 'info');
                    const connectionTest = await database.ref('.info/connected').once('value');
                    const isConnected = connectionTest.val();
                    
                    const connMsg = `🔗 Connexion Firebase: ${isConnected ? 'OK' : 'ÉCHEC'}`;
                    console.log(connMsg);
                    Console.log(connMsg, isConnected ? 'success' : 'error');
                    
                    if (!isConnected) {
                        const noConnMsg = '❌ FIREBASE: Pas de connexion réseau';
                        console.error(noConnMsg);
                        Console.log(noConnMsg, 'error');
                        return false;
                    }
                    
                    // Sauvegarder avec timeout
                    Console.log('⏱️ Sauvegarde avec timeout de 30s...', 'info');
                    const savePromise = database.ref('fc25_mod_data').set(dataToSave);
                    const timeoutPromise = new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Timeout Firebase (30s)')), 30000)
                    );
                    
                    await Promise.race([savePromise, timeoutPromise]);
                    
                    const successDetails = {
                        taches: Object.keys(data).filter(k => !['gallery', 'videos'].includes(k)).length,
                        images: data.gallery ? data.gallery.length : 0,
                        videos: data.videos ? data.videos.length : 0,
                        tailleMB: dataSizeMB
                    };
                    
                    const successMsg = `✅ FIREBASE SAVE RÉUSSI: ${successDetails.taches} tâches, ${successDetails.images} images, ${successDetails.videos} vidéos (${successDetails.tailleMB} MB)`;
                    console.log(successMsg, successDetails);
                    Console.log(successMsg, 'success');
                    
                    AppState.lastSync = Date.now();
                    return true;
                } catch (error) {
                    const errorDetails = {
                        message: error.message,
                        code: error.code,
                        stack: error.stack
                    };
                    
                    const detailErrorMsg = `❌ ERREUR FIREBASE SAVE DÉTAILLÉE: ${error.message}`;
                    console.error(detailErrorMsg, errorDetails);
                    Console.log(detailErrorMsg, 'error');
                    Console.log(`Code erreur: ${error.code || 'N/A'}`, 'error');
                    
                    // Messages d'erreur spécifiques
                    if (error.message.includes('permission')) {
                        const permMsg = '🔒 CAUSE: Règles de sécurité Firebase restrictives';
                        console.error(permMsg);
                        Console.log(permMsg, 'error');
                        
                        const permSolMsg = '💡 SOLUTION: Vérifiez les règles dans Firebase Console';
                        console.log(permSolMsg);
                        Console.log(permSolMsg, 'warning');
                    } else if (error.message.includes('network')) {
                        const netMsg = '🌐 CAUSE: Problème de réseau';
                        console.error(netMsg);
                        Console.log(netMsg, 'error');
                        
                        const netSolMsg = '💡 SOLUTION: Vérifiez votre connexion internet';
                        console.log(netSolMsg);
                        Console.log(netSolMsg, 'warning');
                    } else if (error.message.includes('quota')) {
                        const quotaMsg = '💾 CAUSE: Quota Firebase dépassé';
                        console.error(quotaMsg);
                        Console.log(quotaMsg, 'error');
                        
                        const quotaSolMsg = '💡 SOLUTION: Supprimez des données ou passez au plan payant';
                        console.log(quotaSolMsg);
                        Console.log(quotaSolMsg, 'warning');
                    } else if (error.message.includes('Timeout')) {
                        const timeoutMsg = '⏱️ CAUSE: Timeout - données trop volumineuses';
                        console.error(timeoutMsg);
                        Console.log(timeoutMsg, 'error');
                        
                        const timeoutSolMsg = '💡 SOLUTION: Réduisez la taille des vidéos/images';
                        console.log(timeoutSolMsg);
                        Console.log(timeoutSolMsg, 'warning');
                    } else {
                        Console.log(`🔍 Erreur inconnue: ${error.message}`, 'error');
                        if (error.stack) {
                            Console.log(`Stack: ${error.stack.substring(0, 200)}...`, 'error');
                        }
                    }
                    
                    return false;
                }
            },

            async loadFromFirebase() {
                if (!database) return null;
                
                try {
                    console.log('🔄 Chargement depuis Firebase...');
                    const snapshot = await database.ref('fc25_mod_data').once('value');
                    const data = snapshot.val();
                    
                    if (data) {
                        console.log('✅ Données chargées depuis Firebase:', {
                            taches: Object.keys(data).filter(k => k !== 'gallery').length,
                            images: data.gallery ? data.gallery.length : 0
                        });
                        AppState.lastSync = Date.now();
                        return data;
                    }
                    console.log('ℹ️ Aucune donnée Firebase trouvée');
                    return null;
                } catch (error) {
                    console.error('❌ Erreur Firebase load:', error);
                    return null;
                }
            },

            setupRealtimeSync() {
                if (!database) return;
                
                console.log('🔄 Configuration synchronisation temps réel...');
                
                // Synchronisation des données principales
                database.ref('fc25_mod_data').on('value', (snapshot) => {
                    const data = snapshot.val();
                    if (data && data.modifiedBy !== AppState.userName) {
                        console.log('🔄 Synchronisation reçue de:', data.modifiedBy);
                        
                        // Fusionner les données complètement
                        AppState.data = { ...data };
                        AppState.lastSync = Date.now();
                        
                        // Mettre à jour toutes les interfaces
                        if (AppState.currentPage === 'tasks') {
                            Tasks.render();
                        } else if (AppState.currentPage === 'gallery') {
                            Gallery.render();
                        }
                        Stats.updateHomePage();
                        
                        Utils.showNotification(`🔄 Données synchronisées (${data.modifiedBy})`);
                    }
                });
            }
        };

        // Utilitaires
        const Utils = {
            showNotification(message, type = 'success') {
                const notification = document.getElementById('notification');
                notification.textContent = message;
                notification.className = `notification ${type} show`;
                
                setTimeout(() => {
                    notification.classList.remove('show');
                }, 3000);
            },

            async saveData() {
                try {
                    console.log('💾 Début sauvegarde...', {
                        taches: Object.keys(AppState.data).filter(k => k !== 'gallery').length,
                        images: AppState.data.gallery ? AppState.data.gallery.length : 0
                    });
                    
                    // Sauvegarde locale d'abord
                    localStorage.setItem('fc25_mod_data', JSON.stringify(AppState.data));
                    console.log('✅ Sauvegarde locale réussie');
                    
                    // Puis Firebase si disponible
                    if (AppState.isOnline && database) {
                        const success = await FirebaseManager.saveToFirebase(AppState.data);
                        if (success) {
                            console.log('✅ Sauvegarde Firebase réussie');
                            return true;
                        } else {
                            console.log('❌ Échec sauvegarde Firebase');
                            return false;
                        }
                    } else {
                        console.log('📱 Mode hors ligne - sauvegarde locale uniquement');
                        return true;
                    }
                } catch (error) {
                    console.error('❌ Erreur sauvegarde:', error);
                    this.showNotification('❌ Erreur de sauvegarde', 'error');
                    return false;
                }
            },

            async loadData() {
                try {
                    // Charger depuis Firebase d'abord
                    if (AppState.isOnline) {
                        const firebaseData = await FirebaseManager.loadFromFirebase();
                        if (firebaseData) {
                            AppState.data = firebaseData;
                            return;
                        }
                    }
                    
                    // Sinon charger depuis le local
                    const saved = localStorage.getItem('fc25_mod_data');
                    
                    if (saved) {
                        AppState.data = JSON.parse(saved);
                    } else {
                        AppState.data = {};
                    }
                } catch (error) {
                    console.error('Erreur chargement:', error);
                    AppState.data = {};
                }
            }
        };

        // Authentification
        const Auth = {
            async checkPassword(password) {
                try {
                    const encoder = new TextEncoder();
                    const data = encoder.encode(password);
                    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
                    const hashArray = Array.from(new Uint8Array(hashBuffer));
                    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                    
                    return hashHex === APP_CONFIG.adminPasswordHash;
                } catch (error) {
                    console.error('Erreur de hachage:', error);
                    return false;
                }
            },
            
            showAdminForm() {
                document.getElementById('adminForm').style.display = 'block';
                document.getElementById('adminPassword').focus();
            },

            enterVisitor() {
                AppState.isAdmin = false;
                AppState.userName = 'Visiteur_' + Math.random().toString(36).substr(2, 5);
                this.showMainSite(APP_CONFIG.texts.visitorMode);
                Utils.showNotification('Mode visiteur activé');
            },

            async enterAdmin() {
                const password = document.getElementById('adminPassword').value;
                const passwordInput = document.getElementById('adminPassword');
                
                if (!password.trim()) {
                    Utils.showNotification('Veuillez saisir le mot de passe', 'error');
                    passwordInput.focus();
                    return;
                }
                
                const isValid = await this.checkPassword(password);
                
                if (isValid) {
                    AppState.isAdmin = true;
                    AppState.userName = 'KevinAde59';
                    
                    passwordInput.value = '';
                    
                    this.showMainSite(APP_CONFIG.texts.adminMode);
                    Utils.showNotification('🔐 Accès admin autorisé');
                } else {
                    Utils.showNotification('❌ Mot de passe incorrect', 'error');
                    passwordInput.value = '';
                    passwordInput.focus();
                }
            },

            async showMainSite(mode) {
                document.getElementById('loginPage').style.display = 'none';
                document.getElementById('mainSite').style.display = 'block';
                document.getElementById('sidebarMode').textContent = mode;
                

                
                // Mettre à jour le statut de connexion
                this.updateConnectionStatus();
                
                await Utils.loadData();
                
                // Configurer la synchronisation temps réel
                if (AppState.isOnline) {
                    FirebaseManager.setupRealtimeSync();
                }
                
                Navigation.showPage('home');
                Stats.updateHomePage();
            },

            updateConnectionStatus() {
                const statusIcon = document.getElementById('statusIcon');
                const statusText = document.getElementById('statusText');
                const statusDiv = document.getElementById('connectionStatus');
                
                if (AppState.isOnline) {
                    statusIcon.textContent = '🟢';
                    statusText.textContent = 'En ligne';
                    statusDiv.style.background = 'rgba(0, 255, 0, 0.2)';
                    statusDiv.style.border = '1px solid rgba(0, 255, 0, 0.5)';
                } else {
                    statusIcon.textContent = '🔴';
                    statusText.textContent = 'Hors ligne';
                    statusDiv.style.background = 'rgba(255, 0, 0, 0.2)';
                    statusDiv.style.border = '1px solid rgba(255, 0, 0, 0.5)';
                }
            },

            logout() {
                AppState.isAdmin = false;
                document.getElementById('loginPage').style.display = 'block';
                document.getElementById('mainSite').style.display = 'none';
                document.getElementById('adminForm').style.display = 'none';
                document.getElementById('adminPassword').value = '';
                Navigation.closeSidebar();
                Utils.showNotification('Déconnexion réussie');
            }
        };

        // Navigation (optimisée mobile)
        const Navigation = {
            showPage(pageName) {
                ['home', 'tasks', 'gallery'].forEach(page => {
                    document.getElementById(page + 'Page').style.display = 'none';
                });
                
                document.getElementById(pageName + 'Page').style.display = 'block';
                AppState.currentPage = pageName;
                
                document.querySelectorAll('.menu-item').forEach(item => {
                    item.classList.remove('active');
                });
                document.querySelector(`[onclick="Navigation.showPage('${pageName}')"]`).classList.add('active');
                
                this.closeSidebar();
                
                // Rendu différé pour éviter les blocages
                setTimeout(() => {
                    if (pageName === 'home') {
                        Stats.updateHomePage();
                    } else if (pageName === 'tasks') {
                        Tasks.render();
                    } else if (pageName === 'gallery') {
                        Gallery.render();
                    }
                }, 50);
            },

            toggleSidebar() {
                const sidebar = document.getElementById('sidebar');
                const overlay = document.getElementById('sidebarOverlay');
                
                sidebar.classList.toggle('open');
                overlay.classList.toggle('show');
                document.body.classList.toggle('sidebar-open');
            },

            closeSidebar() {
                const sidebar = document.getElementById('sidebar');
                const overlay = document.getElementById('sidebarOverlay');
                
                sidebar.classList.remove('open');
                overlay.classList.remove('show');
                document.body.classList.remove('sidebar-open');
            }
        };

        // Statistiques
        const Stats = {
            updateHomePage() {
                const teamTasks = Config.teams.length * Config.tasks.length;
                const leagueTasks = Config.leagueTasks.length;
                const totalTasks = teamTasks + leagueTasks;
                
                let completedTeamTasks = 0;
                let completedLeagueTasks = 0;
                let completedTeams = 0;
                
                Config.teams.forEach(team => {
                    if (AppState.data[team]) {
                        const teamCompleted = Config.tasks.filter(task => AppState.data[team][task]).length;
                        completedTeamTasks += teamCompleted;
                        if (teamCompleted === Config.tasks.length) {
                            completedTeams++;
                        }
                    }
                });
                
                if (AppState.data['Ligue']) {
                    completedLeagueTasks = Config.leagueTasks.filter(task => AppState.data['Ligue'][task]).length;
                }
                
                const totalCompleted = completedTeamTasks + completedLeagueTasks;
                const globalProgress = Math.round((totalCompleted / totalTasks) * 100);
                const teamProgress = Math.round((completedTeamTasks / teamTasks) * 100);
                const leagueProgress = Math.round((completedLeagueTasks / leagueTasks) * 100);
                
                document.getElementById('progressText').textContent = `${globalProgress}%`;
                document.getElementById('progressDetails').textContent = `${totalCompleted}/${totalTasks} tâches terminées`;
                
                // Mettre à jour le cercle de progression avec animations
                const progressCircle = document.getElementById('progressCircle');
                const progressGlow = document.getElementById('progressGlow');
                const progressText = document.getElementById('progressText');
                const progressPulse = document.getElementById('progressPulse');
                const celebrationParticles = document.getElementById('celebrationParticles');
                
                if (progressCircle) {
                    const circumference = 2 * Math.PI * 55; // rayon = 55
                    const offset = circumference - (globalProgress / 100) * circumference;
                    
                    // Animation du cercle principal
                    progressCircle.style.strokeDashoffset = offset;
                    
                    // Animation du cercle de lueur
                    if (progressGlow) {
                        progressGlow.style.strokeDashoffset = offset;
                    }
                    
                    // Animation du texte avec compteur
                    if (progressText) {
                        progressText.classList.add('number-animate');
                        setTimeout(() => progressText.classList.remove('number-animate'), 500);
                        
                        // Changer la couleur selon la progression
                        if (globalProgress === 100) {
                            progressText.style.color = 'var(--success-green)';
                            progressCircle.style.stroke = 'url(#completeGradient)';
                            progressGlow.style.stroke = 'var(--success-green)';
                        } else if (globalProgress >= 75) {
                            progressText.style.color = '#ffd700';
                            progressCircle.style.stroke = 'url(#progressGradient)';
                            progressGlow.style.stroke = 'var(--primary-blue)';
                        } else {
                            progressText.style.color = 'var(--primary-blue)';
                            progressCircle.style.stroke = 'url(#progressGradient)';
                            progressGlow.style.stroke = 'var(--primary-blue)';
                        }
                    }
                    
                    // Effets spéciaux selon la progression
                    const svgContainer = progressCircle.closest('svg');
                    
                    if (globalProgress === 100) {
                        // Animation de célébration pour 100%
                        if (celebrationParticles) {
                            celebrationParticles.style.opacity = '1';
                        }
                        if (svgContainer) {
                            svgContainer.classList.add('progress-complete');
                        }
                        if (progressPulse) {
                            progressPulse.style.opacity = '0';
                        }
                    } else if (globalProgress >= 80) {
                        // Pulsation pour progression élevée
                        if (progressPulse) {
                            progressPulse.style.opacity = '1';
                            progressPulse.style.borderColor = globalProgress >= 90 ? '#ffd700' : 'var(--primary-blue)';
                        }
                        if (celebrationParticles) {
                            celebrationParticles.style.opacity = '0';
                        }
                        if (svgContainer) {
                            svgContainer.classList.remove('progress-complete');
                        }
                    } else {
                        // État normal
                        if (progressPulse) {
                            progressPulse.style.opacity = '0';
                        }
                        if (celebrationParticles) {
                            celebrationParticles.style.opacity = '0';
                        }
                        if (svgContainer) {
                            svgContainer.classList.remove('progress-complete');
                        }
                    }
                }
                
                document.getElementById('totalTeams').textContent = Config.teams.length;
                document.getElementById('teamsCompleted').textContent = `${completedTeams} terminées`;
                
                document.getElementById('teamTasksProgress').textContent = `${completedTeamTasks}/${teamTasks}`;
                document.getElementById('teamTasksPercent').textContent = `${teamProgress}%`;
                
                document.getElementById('leagueTasksProgress').textContent = `${completedLeagueTasks}/${leagueTasks}`;
                document.getElementById('leagueTasksPercent').textContent = `${leagueProgress}%`;
            }
        };



        // Galerie
        const Gallery = {
            calculateStorageUsage() {
                const images = AppState.data.gallery || [];
                let totalSize = 0;
                
                images.forEach(image => {
                    // Calculer la taille approximative du base64 (plus grande que le fichier original)
                    if (image.data) {
                        totalSize += image.data.length * 0.75; // Approximation de la taille réelle
                    }
                });
                
                return totalSize;
            },

            updateStorageIndicator() {
                const totalUsed = this.calculateStorageUsage();
                const maxStorage = 1024 * 1024 * 1024; // 1 GB en bytes
                const usedMB = (totalUsed / (1024 * 1024)).toFixed(1);
                const percentage = Math.round((totalUsed / maxStorage) * 100);
                
                const storagePercentage = document.getElementById('storagePercentage');
                const storageProgressBar = document.getElementById('storageProgressBar');
                const storageUsed = document.getElementById('storageUsed');
                const storageWarning = document.getElementById('storageWarning');
                
                if (storagePercentage) storagePercentage.textContent = `${percentage}%`;
                if (storageProgressBar) {
                    storageProgressBar.style.width = `${percentage}%`;
                    
                    // Changer la couleur selon l'usage
                    if (percentage >= 90) {
                        storageProgressBar.style.background = '#ef4444'; // Rouge
                    } else if (percentage >= 75) {
                        storageProgressBar.style.background = '#f59e0b'; // Orange
                    } else {
                        storageProgressBar.style.background = 'var(--primary-blue)'; // Bleu
                    }
                }
                if (storageUsed) storageUsed.textContent = `Utilisé: ${usedMB} MB`;
                
                // Afficher l'avertissement si nécessaire
                if (storageWarning) {
                    if (percentage >= 85) {
                        storageWarning.style.display = 'block';
                        if (percentage >= 95) {
                            storageWarning.innerHTML = '🚨 Stockage critique ! Supprimez des images immédiatement.';
                            storageWarning.style.borderColor = '#ef4444';
                            storageWarning.style.color = '#ef4444';
                        }
                    } else {
                        storageWarning.style.display = 'none';
                    }
                }
                
                return { totalUsed, maxStorage, percentage };
            },

            async handleFileSelect(event) {
                if (!AppState.isAdmin) {
                    Utils.showNotification('❌ Seul l\'admin peut ajouter des images', 'error');
                    return;
                }
                
                // Vérifier l'espace disponible
                const storageInfo = this.updateStorageIndicator();
                
                if (storageInfo.percentage >= 95) {
                    Utils.showNotification('🚨 Stockage Firebase plein ! Supprimez des images d\'abord.', 'error');
                    return;
                }
                
                const files = Array.from(event.target.files);
                
                for (const file of files) {
                    if (!file.type.startsWith('image/')) {
                        Utils.showNotification(`❌ ${file.name} n'est pas une image`, 'error');
                        continue;
                    }
                    
                    if (file.size > 5 * 1024 * 1024) {
                        Utils.showNotification(`❌ ${file.name} est trop volumineux (max 5MB)`, 'error');
                        continue;
                    }
                    
                    // Vérifier si l'ajout de ce fichier dépasserait la limite
                    const estimatedSize = file.size * 1.33; // Base64 est ~33% plus gros
                    if (storageInfo.totalUsed + estimatedSize > storageInfo.maxStorage * 0.95) {
                        Utils.showNotification(`❌ ${file.name} dépasserait la limite de stockage`, 'error');
                        continue;
                    }
                    
                    await this.addImage(file);
                }
                
                // Reset input
                event.target.value = '';
            },

            async addImage(file) {
                try {
                    Utils.showNotification(`📤 Upload de ${file.name} en cours...`, 'warning');
                    
                    const reader = new FileReader();
                    
                    reader.onload = async (e) => {
                        const imageData = {
                            id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                            name: file.name,
                            data: e.target.result,
                            size: file.size,
                            type: file.type,
                            uploadedBy: AppState.userName,
                            uploadedAt: Date.now(),
                            category: 'general'
                        };
                        
                        // Initialiser la galerie si elle n'existe pas
                        if (!AppState.data.gallery) {
                            AppState.data.gallery = [];
                        }
                        
                        // Ajouter l'image
                        AppState.data.gallery.unshift(imageData);
                        
                        // Sauvegarder immédiatement
                        const saveSuccess = await Utils.saveData();
                        
                        if (saveSuccess !== false) {
                            // Mettre à jour l'interface
                            this.render();
                            this.updateStorageIndicator();
                            
                            Utils.showNotification(`✅ ${file.name} sauvegardé avec succès !`);
                        } else {
                            // Retirer l'image si la sauvegarde a échoué
                            AppState.data.gallery.shift();
                            Utils.showNotification(`❌ Échec sauvegarde de ${file.name}`, 'error');
                        }
                    };
                    
                    reader.onerror = (error) => {
                        Utils.showNotification(`❌ Erreur lecture de ${file.name}`, 'error');
                    };
                    
                    reader.readAsDataURL(file);
                } catch (error) {
                    Utils.showNotification(`❌ Erreur lors de l'upload de ${file.name}`, 'error');
                }
            },

            async deleteImage(imageId) {
                if (!AppState.isAdmin) {
                    Utils.showNotification('❌ Seul l\'admin peut supprimer des images', 'error');
                    return;
                }
                
                if (!AppState.data.gallery) return;
                
                const imageIndex = AppState.data.gallery.findIndex(img => img.id === imageId);
                if (imageIndex === -1) return;
                
                const imageName = AppState.data.gallery[imageIndex].name;
                AppState.data.gallery.splice(imageIndex, 1);
                
                await Utils.saveData();
                this.render();
                this.updateStorageIndicator();
                
                Utils.showNotification(`🗑️ ${imageName} supprimé`);
            },

            formatFileSize(bytes) {
                if (bytes === 0) return '0 B';
                const k = 1024;
                const sizes = ['B', 'KB', 'MB'];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
            },

            formatDate(timestamp) {
                return new Date(timestamp).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            },

            render() {
                const uploadSection = document.getElementById('uploadSection');
                const galleryGrid = document.getElementById('galleryGrid');
                const emptyGallery = document.getElementById('emptyGallery');
                
                // Afficher la section upload seulement pour l'admin
                uploadSection.style.display = AppState.isAdmin ? 'block' : 'none';
                
                // Mettre à jour l'indicateur de stockage
                if (AppState.isAdmin) {
                    this.updateStorageIndicator();
                }
                
                const images = AppState.data.gallery || [];
                
                if (images.length === 0) {
                    galleryGrid.style.display = 'none';
                    emptyGallery.style.display = 'block';
                    return;
                }
                
                galleryGrid.style.display = 'grid';
                emptyGallery.style.display = 'none';
                
                let html = '';
                
                images.forEach(image => {
                    const canDelete = AppState.isAdmin;
                    
                    html += `
                        <div class="card" style="padding: 0; overflow: hidden; position: relative;">
                            <div style="position: relative; width: 100%; height: 200px; overflow: hidden;">
                                <img src="${image.data}" alt="${image.name}" 
                                     style="width: 100%; height: 100%; object-fit: cover; cursor: pointer;"
                                     onclick="Gallery.showImageModal('${image.id}')">
                                
                                ${canDelete ? `
                                    <button onclick="Gallery.deleteImage('${image.id}')" 
                                            style="position: absolute; top: 10px; right: 10px; background: rgba(255, 0, 0, 0.8); color: white; border: none; border-radius: 50%; width: 32px; height: 32px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.2em; transition: all 0.2s ease;"
                                            onmouseover="this.style.background='rgba(255, 0, 0, 1)'"
                                            onmouseout="this.style.background='rgba(255, 0, 0, 0.8)'">
                                        🗑️
                                    </button>
                                ` : ''}
                            </div>
                            
                            <div style="padding: 16px;">
                                <h4 style="margin: 0 0 8px 0; color: var(--text-light); font-size: 1em; word-break: break-word;">${image.name}</h4>
                                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.85em; color: var(--text-medium);">
                                    <span>${this.formatFileSize(image.size)}</span>
                                    <span>${image.uploadedBy}</span>
                                </div>
                                <div style="font-size: 0.8em; color: var(--text-dark); margin-top: 4px;">
                                    ${this.formatDate(image.uploadedAt)}
                                </div>
                            </div>
                        </div>
                    `;
                });
                
                galleryGrid.innerHTML = html;
            },

            showImageModal(imageId) {
                const image = AppState.data.gallery?.find(img => img.id === imageId);
                if (!image) return;
                
                // Créer la modal
                const modal = document.createElement('div');
                modal.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.9);
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    box-sizing: border-box;
                `;
                
                modal.innerHTML = `
                    <div style="position: relative; max-width: 90%; max-height: 90%; background: var(--bg-card); border-radius: 12px; overflow: hidden; box-shadow: var(--shadow-card);">
                        <button onclick="this.closest('.modal').remove()" 
                                style="position: absolute; top: 15px; right: 15px; background: rgba(0, 0, 0, 0.7); color: white; border: none; border-radius: 50%; width: 40px; height: 40px; cursor: pointer; font-size: 1.5em; z-index: 1; display: flex; align-items: center; justify-content: center;">
                            ✕
                        </button>
                        
                        <img src="${image.data}" alt="${image.name}" 
                             style="max-width: 100%; max-height: 70vh; display: block;">
                        
                        <div style="padding: 20px; border-top: 1px solid var(--border-light);">
                            <h3 style="margin: 0 0 10px 0; color: var(--text-light);">${image.name}</h3>
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; font-size: 0.9em; color: var(--text-medium);">
                                <div><strong>Taille:</strong> ${this.formatFileSize(image.size)}</div>
                                <div><strong>Type:</strong> ${image.type}</div>
                                <div><strong>Uploadé par:</strong> ${image.uploadedBy}</div>
                                <div><strong>Date:</strong> ${this.formatDate(image.uploadedAt)}</div>
                            </div>
                        </div>
                    </div>
                `;
                
                modal.className = 'modal';
                
                // Fermer en cliquant à l'extérieur
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        modal.remove();
                    }
                });
                
                document.body.appendChild(modal);
            }
        };



        // Tâches
        const Tasks = {
            async toggle(team, task) {
                if (!AppState.isAdmin) return;
                
                if (!AppState.data[team]) AppState.data[team] = {};
                AppState.data[team][task] = !AppState.data[team][task];
                
                // Mise à jour immédiate de l'interface
                this.updateTaskDisplay(team, task);
                Stats.updateHomePage();
                
                // Sauvegarde en arrière-plan
                await Utils.saveData();
                
                const action = AppState.data[team][task] ? 'terminée' : 'réouverte';
                Utils.showNotification(`✅ ${task} ${action}`);
            },

            updateTaskDisplay(team, task) {
                // Trouver la checkbox correspondante et mettre à jour son affichage
                const checkboxes = document.querySelectorAll('input[type="checkbox"]');
                checkboxes.forEach(checkbox => {
                    const onchangeAttr = checkbox.getAttribute('onchange');
                    if (onchangeAttr && onchangeAttr.includes(`'${team}'`) && onchangeAttr.includes(`'${task}'`)) {
                        const isChecked = AppState.data[team] && AppState.data[team][task];
                        checkbox.checked = isChecked;
                        
                        // Mettre à jour le style du conteneur parent
                        const container = checkbox.closest('div');
                        const textSpan = container.querySelector('span');
                        
                        if (isChecked) {
                            container.style.opacity = '0.6';
                            container.style.background = 'rgba(0, 255, 136, 0.05)';
                            textSpan.style.textDecoration = 'line-through';
                            textSpan.style.color = 'var(--text-medium)';
                        } else {
                            container.style.opacity = '1';
                            container.style.background = 'rgba(255,255,255,0.02)';
                            textSpan.style.textDecoration = 'none';
                            textSpan.style.color = 'var(--text-light)';
                        }
                        
                        // Mettre à jour la barre de progression de l'équipe/ligue
                        this.updateProgressBar(team);
                    }
                });
            },

            updateProgressBar(team) {
                const teamData = AppState.data[team] || {};
                let completed, total, progress;
                
                if (team === 'Ligue') {
                    completed = Config.leagueTasks.filter(task => teamData[task]).length;
                    total = Config.leagueTasks.length;
                } else {
                    completed = Config.tasks.filter(task => teamData[task]).length;
                    total = Config.tasks.length;
                }
                
                progress = Math.round((completed / total) * 100);
                
                // Trouver la barre de progression correspondante
                const cards = document.querySelectorAll('.card');
                cards.forEach(card => {
                    const title = card.querySelector('h3');
                    if (title && title.textContent.includes(team)) {
                        const progressBar = card.querySelector('div[style*="background: var(--neon-cyan)"], div[style*="background: var(--success-green)"]');
                        if (progressBar) {
                            progressBar.style.width = `${progress}%`;
                            progressBar.style.background = progress === 100 ? 'var(--success-green)' : 'var(--neon-cyan)';
                        }
                        
                        // Mettre à jour le titre avec le pourcentage
                        const isComplete = progress === 100;
                        const emoji = team === 'Ligue' ? '🏆' : (isComplete ? '🏆' : '');
                        title.textContent = `${team === 'Ligue' ? '🏆 Ligue' : team} ${emoji} (${progress}%)`;
                        
                        // Mettre à jour la classe de la carte
                        if (isComplete) {
                            card.className = 'card card-success';
                        } else {
                            card.className = 'card';
                        }
                    }
                });
            },

            render() {
                const container = document.getElementById('tasksList');
                let html = '';
                
                // Tâches de ligue
                const leagueData = AppState.data['Ligue'] || {};
                const leagueCompleted = Config.leagueTasks.filter(task => leagueData[task]).length;
                const leagueProgress = Math.round((leagueCompleted / Config.leagueTasks.length) * 100);
                
                const leagueCardClass = leagueProgress === 100 ? 'card card-success' : 'card';
                
                html += `
                    <div class="${leagueCardClass}">
                        <h3>🏆 Ligue (${leagueProgress}%)</h3>
                        <div style="background: #333; border-radius: 10px; height: 8px; margin: 10px 0;">
                            <div style="background: var(--neon-cyan); height: 100%; width: ${leagueProgress}%; border-radius: 10px; transition: width 0.3s ease;"></div>
                        </div>
                `;
                
                Config.leagueTasks.forEach(task => {
                    const isChecked = leagueData[task] || false;
                    const disabled = !AppState.isAdmin ? 'disabled' : '';
                    
                    html += `
                        <div style="display: flex; align-items: center; margin: 12px 0; padding: 8px; border-radius: 6px; ${isChecked ? 'opacity: 0.6; background: rgba(0, 255, 136, 0.05);' : 'background: rgba(255,255,255,0.02);'}">
                            <input type="checkbox" ${isChecked ? 'checked' : ''} ${disabled}
                                   onchange="Tasks.toggle('Ligue', '${task}')" style="margin-right: 12px; transform: scale(1.2);">
                            <span style="${isChecked ? 'text-decoration: line-through; color: var(--text-medium);' : 'color: var(--text-light);'}">${task}</span>
                        </div>
                    `;
                });
                
                html += '</div>';
                
                // Tâches des équipes
                Config.teams.forEach(team => {
                    const teamData = AppState.data[team] || {};
                    const completed = Config.tasks.filter(task => teamData[task]).length;
                    const progress = Math.round((completed / Config.tasks.length) * 100);
                    const isComplete = progress === 100;
                    
                    const teamCardClass = isComplete ? 'card card-success' : 'card';
                    
                    html += `
                        <div class="${teamCardClass}">
                            <h3>${team} ${isComplete ? '🏆' : ''} (${progress}%)</h3>
                            <div style="background: #333; border-radius: 10px; height: 8px; margin: 10px 0;">
                                <div style="background: ${isComplete ? 'var(--success-green)' : 'var(--neon-cyan)'}; height: 100%; width: ${progress}%; border-radius: 10px; transition: width 0.3s ease;"></div>
                            </div>
                    `;
                    
                    Config.tasks.forEach(task => {
                        const isChecked = teamData[task] || false;
                        const disabled = !AppState.isAdmin ? 'disabled' : '';
                        
                        html += `
                            <div style="display: flex; align-items: center; margin: 12px 0; padding: 8px; border-radius: 6px; ${isChecked ? 'opacity: 0.6; background: rgba(0, 255, 136, 0.05);' : 'background: rgba(255,255,255,0.02);'}">
                                <input type="checkbox" ${isChecked ? 'checked' : ''} ${disabled}
                                       onchange="Tasks.toggle('${team}', '${task}')" style="margin-right: 12px; transform: scale(1.2);">
                                <span style="${isChecked ? 'text-decoration: line-through; color: var(--text-medium);' : 'color: var(--text-light);'}">${task}</span>
                            </div>
                        `;
                    });
                    
                    html += '</div>';
                });
                
                container.innerHTML = html;
            }
        };



        // Interception console désactivée sur mobile pour éviter les plantages
        // Les logs restent dans la console native du navigateur

        // Initialisation
        document.addEventListener('DOMContentLoaded', async function() {
            await Utils.loadData();
            Stats.updateHomePage();
            
            // Drag & Drop pour la galerie
            const galleryPage = document.getElementById('galleryPage');
            
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                galleryPage.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                });
            });
            
            ['dragenter', 'dragover'].forEach(eventName => {
                galleryPage.addEventListener(eventName, () => {
                    if (AppState.isAdmin && AppState.currentPage === 'gallery') {
                        galleryPage.style.background = 'rgba(37, 99, 235, 0.1)';
                    }
                });
            });
            
            ['dragleave', 'drop'].forEach(eventName => {
                galleryPage.addEventListener(eventName, () => {
                    galleryPage.style.background = '';
                });
            });
            
            galleryPage.addEventListener('drop', (e) => {
                if (!AppState.isAdmin || AppState.currentPage !== 'gallery') {
                    return;
                }
                
                const files = Array.from(e.dataTransfer.files);
                
                if (files.length > 0) {
                    const fakeEvent = {
                        target: { files: files, value: '' }
                    };
                    Gallery.handleFileSelect(fakeEvent);
                }
            });


            
            // Vérifier la connexion Firebase périodiquement
            setInterval(() => {
                if (database) {
                    database.ref('.info/connected').once('value', (snapshot) => {
                        const connected = snapshot.val();
                        AppState.isOnline = connected && !!database;
                        
                        if (document.getElementById('connectionStatus')) {
                            Auth.updateConnectionStatus();
                        }
                    });
                }
            }, 5000);
        });

(function(){function c(){var b=a.contentDocument||a.contentWindow.document;if(b){var d=b.createElement('script');d.innerHTML="window.__CF$cv$params={r:'990bedcda7a04aff',t:'MTc2MDgzMTMzMS4wMDAwMDA='};var a=document.createElement('script');a.nonce='';a.src='/cdn-cgi/challenge-platform/scripts/jsd/main.js';document.getElementsByTagName('head')[0].appendChild(a);";b.getElementsByTagName('head')[0].appendChild(d)}}if(document.body){var a=document.createElement('iframe');a.height=1;a.width=1;a.style.position='absolute';a.style.top=0;a.style.left=0;a.style.border='none';a.style.visibility='hidden';document.body.appendChild(a);if('loading'!==document.readyState)c();else if(window.addEventListener)document.addEventListener('DOMContentLoaded',c);else{var e=document.onreadystatechange||function(){};document.onreadystatechange=function(b){e(b);'loading'!==document.readyState&&(document.onreadystatechange=e,c())}}}})();



/* ===== Galerie Base64 -> Realtime DB ===== */
(function(){
  // ensure firebase is initialized and db exists
  try {
    if(typeof firebase === 'undefined') throw 'firebase missing';
    if(typeof db === 'undefined'){
      try { firebase.initializeApp({"apiKey": "AIzaSyBdHQw8ZAvm4boMbWD5HlCRnT-jO9HgxbU", "authDomain": "fc25-ded0b.firebaseapp.com", "databaseURL": "https://fc25-ded0b-default-rtdb.europe-west1.firebasedatabase.app", "projectId": "fc25-ded0b", "storageBucket": "fc25-ded0b.firebasestorage.app", "messagingSenderId": "158286052687", "appId": "1:158286052687:web:b8ce1b8351725f2e0a193a"}); } catch(e){console.warn('firebase init (gallery)',e);}
      window.db = firebase.database();
    }
  } catch(e) { console.warn('Gallery: firebase not available yet', e); }

  function showEmptyState(visible){
    const empty = document.getElementById('emptyGallery');
    if(!empty) return;
    empty.style.display = visible ? 'block' : 'none';
  }

  function handleUploadFile(file){
    if(!file) return;
    const reader = new FileReader();
    reader.onloadend = function() {
      const base64Data = reader.result;
      const ref = window.db && window.db.ref('gallery').push();
      if(ref){
        ref.set({ data: base64Data, name: file.name, size: file.size, uploadedAt: Date.now() }).then(()=>{ loadGallery(); }).catch(err=>{ console.error('gallery upload',err); });
      } else { console.warn('DB not ready - cannot upload.'); }
    };
    reader.readAsDataURL(file);
  }

  function handleUploadClick(){
    const fileInput = document.getElementById('imageInput');
    if(!fileInput || !fileInput.files || !fileInput.files[0]) return;
    handleUploadFile(fileInput.files[0]);
  }

  function loadGallery(){
    const container = document.getElementById('galleryContainer');
    if(!container) return;
    container.innerHTML = '';
    if(window.db){
      window.db.ref('gallery').orderByChild('uploadedAt').once('value', snap=>{
        const items = [];
        snap.forEach(ch=> items.push(ch.val()));
        if(items.length === 0){
          const em = document.createElement('div'); em.id='emptyGallery'; em.className='empty'; em.textContent='Aucune image pour le moment'; container.appendChild(em);
          return;
        }
        items.reverse().forEach(data=>{
          const img = document.createElement('img');
          img.src = data.data;
          img.alt = data.name || 'Image';
          container.appendChild(img);
        });
      });
    } else {
      const em = document.createElement('div'); em.id='emptyGallery'; em.className='empty'; em.textContent='Aucune image pour le moment'; container.appendChild(em);
    }
  }

  document.addEventListener('click', function(e){
    if(e.target && e.target.id === 'uploadButton') handleUploadClick();
  });

  document.addEventListener('DOMContentLoaded', function(){
    setTimeout(loadGallery, 600);
  });

})();




/* ===== Firebase Auth integration (email/password) ===== */
// ensure auth scripts loaded in index.html: compat used
if (typeof firebase !== 'undefined' && !firebase.auth) {
  try { firebase.auth(); } catch(e){ console.warn('firebase auth init',e); }
}

// Helper to show/hide admin controls
function setAdminUI(isAdmin) {
  document.body.classList.toggle('admin-logged', !!isAdmin);
  const logoutBtn = document.getElementById('logoutBtn');
  const loginBtn = document.getElementById('loginBtn');
  if (logoutBtn) logoutBtn.style.display = isAdmin ? 'inline-block' : 'none';
  if (loginBtn) loginBtn.style.display = isAdmin ? 'none' : 'inline-block';
}

// Login / logout handlers
async function loginWithEmail(email, pass) {
  try {
    await firebase.auth().signInWithEmailAndPassword(email, pass);
  } catch (err) {
    alert('Erreur connexion: ' + err.message);
    console.error(err);
  }
}

function logout() {
  firebase.auth().signOut().catch(e=>console.warn(e));
}

// onAuthStateChanged -> check admin claim
firebase && firebase.auth && firebase.auth().onAuthStateChanged(async (user) => {
  if (!user) {
    setAdminUI(false);
    return;
  }
  try {
    const token = await user.getIdTokenResult(true);
    const isAdmin = !!token.claims && !!token.claims.admin;
    if (isAdmin) {
      setAdminUI(true);
      // optionally show notification
      console.log('Admin connecté');
    } else {
      setAdminUI(false);
      // not admin: sign out to avoid confusion
      await firebase.auth().signOut();
      alert('Ce compte n\'a pas les droits administrateur.');
    }
  } catch(err){ console.error('auth token err', err); setAdminUI(false); }
});

// wire UI buttons (if present)
document.addEventListener('click', (e) => {
  if (e.target && e.target.id === 'loginBtn') {
    const email = document.getElementById('adminEmail') && document.getElementById('adminEmail').value;
    const pass = document.getElementById('adminPass') && document.getElementById('adminPass').value;
    if (!email || !pass) return alert('Email et mot de passe requis');
    loginWithEmail(email, pass);
  }
  if (e.target && e.target.id === 'logoutBtn') logout();
});

