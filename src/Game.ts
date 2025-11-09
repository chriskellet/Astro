import * as THREE from 'three';
import { GameConfig, SkinDefinition } from './types';
import { Player } from './Player';
import { Level } from './Level';
import { Physics } from './Physics';
import { VirtualGamepad } from './VirtualGamepad';
import { ParticleSystem } from './ParticleSystem';
import { ScreenTransition } from './ScreenTransition';
import { CameraIntro } from './CameraIntro';
import { getCollectibleTypeForSkin } from './skins';
import { BackgroundTheme } from './BackgroundTheme';

export class Game {
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private player: Player;
  private level: Level;
  private physics: Physics;
  private gamepad: VirtualGamepad;
  private particles: ParticleSystem;
  private transition: ScreenTransition;
  private cameraIntro: CameraIntro;
  private backgroundTheme: BackgroundTheme;
  private controlCanvas: HTMLCanvasElement;
  private lastTime: number;
  private running: boolean;
  private scoreElement: HTMLElement | null;
  private levelElement: HTMLElement | null;
  private currentLevel: number;
  private maxLevels: number = 5;
  private damageCooldown: number = 0;
  private chickenBotCooldown: number = 0;
  private selectedSkin?: SkinDefinition;
  private ambientLight: THREE.AmbientLight;
  private directionalLight: THREE.DirectionalLight;
  private hemisphereLight: THREE.HemisphereLight;
  private levelStartTime: number;
  private enemiesKilled: number;
  private summaryShown: boolean;

  constructor(config: GameConfig, skin?: SkinDefinition) {
    this.canvas = config.canvas;
    this.lastTime = performance.now();
    this.running = false;
    this.currentLevel = 1;
    this.selectedSkin = skin;
    this.levelStartTime = 0;
    this.enemiesKilled = 0;
    this.summaryShown = false;

    // Get UI elements
    this.scoreElement = document.getElementById('score');
    this.levelElement = document.getElementById('level');

    // Initialize Three.js
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
    });
    this.renderer.setSize(config.width, config.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Scene
    this.scene = new THREE.Scene();
    // Background will be set by theme system
    this.scene.background = new THREE.Color(0x87ceeb);
    this.scene.fog = new THREE.Fog(0x87ceeb, 30, 100);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      60,
      config.width / config.height,
      0.1,
      1000
    );
    this.camera.position.set(0, 10, 15);

    // Physics
    this.physics = new Physics();

    // Particle System
    this.particles = new ParticleSystem(this.scene);

    // Screen Transition
    this.transition = new ScreenTransition();

    // Camera Intro
    this.cameraIntro = new CameraIntro(this.camera);

    // Initialize lights (will be configured by theme)
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(this.ambientLight);

    this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.camera.left = -50;
    this.directionalLight.shadow.camera.right = 50;
    this.directionalLight.shadow.camera.top = 50;
    this.directionalLight.shadow.camera.bottom = -50;
    this.directionalLight.shadow.camera.near = 0.1;
    this.directionalLight.shadow.camera.far = 100;
    this.directionalLight.shadow.mapSize.width = 2048;
    this.directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(this.directionalLight);

    this.hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x4a90e2, 0.4);
    this.scene.add(this.hemisphereLight);

    // Point lights for collectibles
    const pointLight1 = new THREE.PointLight(0xffdd00, 0.5, 10);
    pointLight1.position.set(15, 5, -8);
    this.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xffdd00, 0.5, 10);
    pointLight2.position.set(30, 7, 8);
    this.scene.add(pointLight2);

    // Background Theme System
    this.backgroundTheme = new BackgroundTheme(this.scene);
    this.backgroundTheme.setTheme(this.currentLevel);
    this.updateLightsFromTheme();

    // Level - pass collectible type based on skin
    const collectibleType = skin ? getCollectibleTypeForSkin(skin.id) : 'orb';
    this.level = new Level(this.scene, this.currentLevel, collectibleType);

    // Player - pass selected skin
    this.player = new Player(this.physics, this.camera, this.particles, skin);
    this.scene.add(this.player.mesh);

    // Start camera intro flyover
    this.startLevelIntro();

    // Create control canvas overlay
    this.controlCanvas = document.createElement('canvas');
    this.controlCanvas.width = config.width;
    this.controlCanvas.height = config.height;
    this.controlCanvas.style.position = 'fixed';
    this.controlCanvas.style.top = '0';
    this.controlCanvas.style.left = '0';
    this.controlCanvas.style.width = '100%';
    this.controlCanvas.style.height = '100%';
    this.controlCanvas.style.pointerEvents = 'auto';
    this.controlCanvas.style.zIndex = '10';
    document.body.appendChild(this.controlCanvas);

    // Virtual Gamepad
    this.gamepad = new VirtualGamepad(this.controlCanvas);

    // Set up camera toggle callback
    this.gamepad.setCameraToggleCallback(() => {
      this.player.toggleCameraMode();
    });

    // Add click handler to skip/speed up intro
    this.canvas.addEventListener('click', () => {
      if (this.cameraIntro.isActive()) {
        this.cameraIntro.speedUp();
      }
    });

    // Handle resize
    window.addEventListener('resize', this.handleResize.bind(this));

    // Hide loading screen
    setTimeout(() => {
      const loading = document.getElementById('loading');
      if (loading) {
        loading.classList.add('hidden');
      }
    }, 100);
  }

  private updateLightsFromTheme(): void {
    const theme = this.backgroundTheme.getCurrentTheme();
    const config = this.getThemeConfigForLights(theme);

    this.ambientLight.color.setHex(config.ambientLightColor);
    this.ambientLight.intensity = config.ambientLightIntensity;

    this.directionalLight.color.setHex(config.sunColor);
    this.directionalLight.intensity = config.sunIntensity;
    this.directionalLight.position.copy(config.sunPosition);

    this.hemisphereLight.color.setHex(config.hemisphereSkye);
    this.hemisphereLight.groundColor.setHex(config.hemisphereGround);
    this.hemisphereLight.intensity = config.hemisphereIntensity;
  }

  private getThemeConfigForLights(levelNumber: number): any {
    // This duplicates theme config from BackgroundTheme, but keeps lighting sync
    switch (levelNumber) {
      case 1:
        return {
          ambientLightColor: 0xffffff,
          ambientLightIntensity: 0.7,
          sunColor: 0xfffacd,
          sunIntensity: 1.0,
          sunPosition: new THREE.Vector3(30, 40, 20),
          hemisphereSkye: 0x87ceeb,
          hemisphereGround: 0x6aa84f,
          hemisphereIntensity: 0.5,
        };
      case 2:
        return {
          ambientLightColor: 0xffd4a3,
          ambientLightIntensity: 0.6,
          sunColor: 0xff6b35,
          sunIntensity: 0.9,
          sunPosition: new THREE.Vector3(40, 15, 25),
          hemisphereSkye: 0xff7f50,
          hemisphereGround: 0x8b4513,
          hemisphereIntensity: 0.4,
        };
      case 3:
        return {
          ambientLightColor: 0xe6f7ff,
          ambientLightIntensity: 0.8,
          sunColor: 0xffffff,
          sunIntensity: 1.1,
          sunPosition: new THREE.Vector3(35, 50, 15),
          hemisphereSkye: 0xd0f0ff,
          hemisphereGround: 0x9eb3bf,
          hemisphereIntensity: 0.6,
        };
      case 4:
        return {
          ambientLightColor: 0x8888ff,
          ambientLightIntensity: 0.4,
          sunColor: 0xaaaaff,
          sunIntensity: 0.5,
          sunPosition: new THREE.Vector3(25, 35, 30),
          hemisphereSkye: 0x2a2a5e,
          hemisphereGround: 0x0a0a1e,
          hemisphereIntensity: 0.3,
        };
      case 5:
        return {
          ambientLightColor: 0xccccff,
          ambientLightIntensity: 0.3,
          sunColor: 0xddddff,
          sunIntensity: 0.6,
          sunPosition: new THREE.Vector3(30, 30, 20),
          hemisphereSkye: 0x1a0033,
          hemisphereGround: 0x000011,
          hemisphereIntensity: 0.2,
        };
      default:
        return this.getThemeConfigForLights(1);
    }
  }

  private handleResize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.controlCanvas.width = width;
    this.controlCanvas.height = height;
    this.gamepad.resize(width, height);
  }

  public start(): void {
    this.running = true;
    this.lastTime = performance.now();
    this.levelStartTime = performance.now();
    this.enemiesKilled = 0;
    this.summaryShown = false;
    this.gameLoop();
  }

  public stop(): void {
    this.running = false;
  }

  private gameLoop(): void {
    if (!this.running) return;

    const currentTime = performance.now();
    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    this.update(deltaTime);
    this.render();

    requestAnimationFrame(() => this.gameLoop());
  }

  private update(deltaTime: number): void {
    // Update camera intro if active
    if (this.cameraIntro.isActive()) {
      this.cameraIntro.update(deltaTime);
      return; // Don't update gameplay while intro is playing
    }

    // Don't update if transition is active
    if (this.transition.isActive()) {
      return;
    }

    // Get controls from gamepad
    const controls = this.gamepad.getControls();

    // Update player
    this.player.update(controls, deltaTime, this.level.data.platforms);

    // Get player position (used throughout update)
    const playerPos = this.player.getPosition();

    // Update level (enemies need player position and particles)
    this.level.update(deltaTime, playerPos, this.particles);

    // Update particles
    this.particles.update(deltaTime);

    // Update background theme animations
    this.backgroundTheme.update(deltaTime);

    // Emit particles for collected items
    this.level.data.collectibles.forEach((collectible) => {
      if (!collectible.collected) {
        const distance = playerPos.distanceTo(collectible.position);
        if (distance < this.player.getRadius() + 0.4) {
          this.particles.emitCollectEffect(collectible.position, 15);
        }
      }
    });

    const scoreGained = this.level.checkCollectibles(
      playerPos,
      this.player.getRadius()
    );

    if (scoreGained > 0) {
      this.player.addScore(scoreGained);
      this.updateUI();
    }

    // Update cooldowns
    if (this.damageCooldown > 0) {
      this.damageCooldown -= deltaTime;
    }
    if (this.chickenBotCooldown > 0) {
      this.chickenBotCooldown -= deltaTime;
    }

    // Check enemy collisions
    this.checkEnemyCollisions();

    // Check for death (falling off)
    if (playerPos.y < -50) {
      this.handleDeath();
    }

    // Check if player reached end
    const distanceToEnd = playerPos.distanceTo(this.level.data.endPosition);
    if (distanceToEnd < 3) {
      this.levelComplete();
    }
  }

  private render(): void {
    this.renderer.render(this.scene, this.camera);
    this.gamepad.draw();
  }

  private updateUI(): void {
    if (this.scoreElement) {
      this.scoreElement.textContent = `Score: ${this.player.state.score}`;
    }
    if (this.levelElement) {
      this.levelElement.textContent = `Level ${this.currentLevel}`;
    }

    // Update health display if it exists
    const healthElement = document.getElementById('health');
    if (healthElement) {
      healthElement.textContent = `Health: ${Math.max(0, this.player.state.health)}`;
    }
  }

  private checkEnemyCollisions(): void {
    const playerPos = this.player.getPosition();
    const playerVel = this.player.state.velocity;
    const playerRadius = this.player.getRadius();

    this.level.data.enemies.forEach((enemy) => {
      if (!enemy.isActive) return;

      // Check if flame particles hit enemy
      const enemyRadius = 0.6;
      if (this.particles.checkFlameCollisions(enemy.position, enemyRadius)) {
        // Enemy hit by rocket flames - defeat it (even if spiky with spikes out!)
        enemy.isActive = false;
        enemy.health = 0;

        // Emit defeat particles with enemy color
        const enemyColor = this.getEnemyColor(enemy.type);
        this.particles.emitEnemyDefeatedEffect(enemy.position, enemyColor);

        // Award score
        this.player.addScore(50);
        this.updateUI();

        // Track enemy kill
        this.enemiesKilled++;

        // Hide enemy mesh
        enemy.mesh.visible = false;
        return; // Skip other collision checks for this enemy
      }

      const distance = playerPos.distanceTo(enemy.position);
      const collisionDistance = playerRadius + enemyRadius;

      if (distance < collisionDistance) {
        // Check if player is jumping on top of enemy
        const isAboveEnemy = playerPos.y > enemy.position.y + 0.3;
        const isFalling = playerVel.y < 0;

        if (isAboveEnemy && isFalling) {
          // Special case for spiky bot - can only jump on when spikes are in
          if (enemy.type === 'spiky' && enemy.spikesOut) {
            // Spikes are out - player takes damage
            this.handlePlayerDamage(enemy);
            return;
          }

          // Successfully jumped on enemy - defeat it
          enemy.isActive = false;
          enemy.health = 0;

          // Give player a bounce
          this.player.state.velocity.y = 8;

          // Emit defeat particles with enemy color
          const enemyColor = this.getEnemyColor(enemy.type);
          this.particles.emitEnemyDefeatedEffect(enemy.position, enemyColor);

          // Award score
          this.player.addScore(50);
          this.updateUI();

          // Track enemy kill
          this.enemiesKilled++;

          // Hide enemy mesh
          enemy.mesh.visible = false;
        } else {
          // Player touched enemy from side/below - take damage
          this.handlePlayerDamage(enemy);
        }
      }
    });

    // Chicken bot interaction - gives health/speed boost
    if (this.level.data.chickenBot && this.level.data.chickenBot.isActive) {
      const distance = playerPos.distanceTo(this.level.data.chickenBot.position);
      if (distance < playerRadius + 0.7 && this.chickenBotCooldown <= 0) {
        // Give player a small health boost and score
        this.player.state.health = Math.min(100, this.player.state.health + 10);
        this.player.addScore(20);
        this.updateUI();

        // Emit happy particles
        this.particles.emitCollectEffect(this.level.data.chickenBot.position, 10);

        // Set cooldown so chicken bot doesn't give continuous health
        this.chickenBotCooldown = 3; // 3 second cooldown
      }
    }
  }

  private getEnemyColor(type: string): THREE.Color {
    switch (type) {
      case 'pusher':
        return new THREE.Color(0xff4444);
      case 'spiky':
        return new THREE.Color(0x8844ff);
      case 'firebreather':
        return new THREE.Color(0xff8800);
      default:
        return new THREE.Color(0xffffff);
    }
  }

  private handlePlayerDamage(enemy: any): void {
    // Check damage cooldown to prevent rapid damage
    if (this.damageCooldown > 0) {
      return;
    }

    // Reduce player health
    this.player.state.health -= 20;
    this.updateUI();

    // Set damage cooldown (1 second invulnerability)
    this.damageCooldown = 1;

    // Knock player back
    const knockbackDirection = new THREE.Vector3()
      .subVectors(this.player.state.position, enemy.position)
      .normalize();
    knockbackDirection.y = 2; // Add upward knockback
    knockbackDirection.multiplyScalar(8);

    this.player.state.velocity.x = knockbackDirection.x;
    this.player.state.velocity.z = knockbackDirection.z;
    this.player.state.velocity.y = knockbackDirection.y;

    // Emit damage particles
    this.particles.emitDeathEffect(this.player.state.position);

    // Check if player died
    if (this.player.state.health <= 0) {
      this.handleDeath();
    }
  }

  private startLevelIntro(): void {
    this.cameraIntro.start(
      this.level.data.startPosition,
      this.level.data.endPosition,
      () => {
        // Intro complete - camera is now at player position
        // Player update will take over camera control
        // Reset level start time when intro completes
        this.levelStartTime = performance.now();
      }
    );
  }

  private showLevelSummary(callback: () => void): void {
    // Calculate stats
    const totalCoins = this.level.data.collectibles.length;
    const collectedCoins = this.level.data.collectibles.filter(c => c.collected).length;
    const coinPercentage = totalCoins > 0 ? Math.round((collectedCoins / totalCoins) * 100) : 0;
    const isPerfect = coinPercentage === 100;

    const levelTime = (performance.now() - this.levelStartTime) / 1000;
    const minutes = Math.floor(levelTime / 60);
    const seconds = Math.floor(levelTime % 60);
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    // Get UI elements
    const summaryOverlay = document.getElementById('level-summary');
    const coinsElement = document.getElementById('coins-stat');
    const enemiesElement = document.getElementById('enemies-stat');
    const timeElement = document.getElementById('time-stat');
    const bonusContainer = document.getElementById('bonus-container');

    if (!summaryOverlay || !coinsElement || !enemiesElement || !timeElement || !bonusContainer) {
      console.error('Summary UI elements not found');
      callback();
      return;
    }

    // Update stats
    coinsElement.textContent = `${collectedCoins} / ${totalCoins} (${coinPercentage}%)`;
    if (isPerfect) {
      coinsElement.classList.add('perfect');
    } else {
      coinsElement.classList.remove('perfect');
    }

    enemiesElement.textContent = `${this.enemiesKilled}`;
    timeElement.textContent = timeString;

    // Show bonus message if perfect
    if (isPerfect) {
      bonusContainer.innerHTML = '<div class="bonus-message">PERFECT! Bonus +500 points!</div>';
      this.player.addScore(500);
      this.updateUI();
    } else {
      bonusContainer.innerHTML = '';
    }

    // Show the overlay
    summaryOverlay.classList.add('visible');

    // Handle click/tap to continue
    const continueHandler = () => {
      summaryOverlay.classList.remove('visible');
      summaryOverlay.removeEventListener('click', continueHandler);
      callback();
    };

    summaryOverlay.addEventListener('click', continueHandler);
  }

  private levelComplete(): void {
    // Prevent showing summary multiple times
    if (this.summaryShown) return;
    this.summaryShown = true;

    // Show level summary screen
    this.showLevelSummary(() => {
      // After user clicks to continue, do the transition
      // Use star wipe transition - first wipe IN to black
      this.transition.start('starwipe', 'in', 1000, () => {
        // Advance to next level
        this.currentLevel++;

        // If we've completed all levels, loop back to level 1
        if (this.currentLevel > this.maxLevels) {
          this.currentLevel = 1;
        }

        // Clean up old level
        this.level.cleanup();

        // Create new level
        const collectibleType = this.selectedSkin ? getCollectibleTypeForSkin(this.selectedSkin.id) : 'orb';
        this.level = new Level(this.scene, this.currentLevel, collectibleType);

        // Update background theme for new level
        this.backgroundTheme.setTheme(this.currentLevel);
        this.updateLightsFromTheme();

        // Reset player position
        this.player.state.position.copy(this.level.data.startPosition);
        this.player.state.velocity.set(0, 0, 0);

        // Update UI
        this.updateUI();

        // Reset level stats
        this.enemiesKilled = 0;
        this.summaryShown = false;

        // Wipe OUT to reveal new level with camera intro
        setTimeout(() => {
          this.transition.start('starwipe', 'out', 1000, () => {
            this.startLevelIntro();
          });
        }, 100);
      });
    });
  }

  private handleDeath(): void {
    // Emit death particles
    this.particles.emitDeathEffect(this.player.state.position);

    // Use fade transition
    this.transition.start('fade', 'out', 800, () => {
      // Reset player to start of current level
      this.player.state.position.copy(this.level.data.startPosition);
      this.player.state.velocity.set(0, 0, 0);
      this.player.state.health = 100; // Reset health

      // Update UI to show reset health
      this.updateUI();

      // Fade back in with camera intro
      setTimeout(() => {
        this.transition.start('fade', 'in', 800, () => {
          this.startLevelIntro();
        });
      }, 200);
    });
  }

  public cleanup(): void {
    this.running = false;
    window.removeEventListener('resize', this.handleResize.bind(this));
    this.level.cleanup();
    this.particles.cleanup();
    this.transition.cleanup();
    this.renderer.dispose();
    if (this.controlCanvas.parentNode) {
      this.controlCanvas.parentNode.removeChild(this.controlCanvas);
    }
  }
}
