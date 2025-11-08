import * as THREE from 'three';
import { GameConfig } from './types';
import { Player } from './Player';
import { Level } from './Level';
import { Physics } from './Physics';
import { VirtualGamepad } from './VirtualGamepad';
import { ParticleSystem } from './ParticleSystem';
import { ScreenTransition } from './ScreenTransition';

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
  private controlCanvas: HTMLCanvasElement;
  private lastTime: number;
  private running: boolean;
  private scoreElement: HTMLElement | null;
  private levelElement: HTMLElement | null;
  private currentLevel: number;
  private maxLevels: number = 3;

  constructor(config: GameConfig) {
    this.canvas = config.canvas;
    this.lastTime = performance.now();
    this.running = false;
    this.currentLevel = 1;

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

    // Lighting
    this.setupLighting();

    // Level
    this.level = new Level(this.scene, this.currentLevel);

    // Player
    this.player = new Player(this.physics, this.camera, this.particles);
    this.scene.add(this.player.mesh);

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

  private setupLighting(): void {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    // Directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(20, 30, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 100;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);

    // Hemisphere light for better ambient
    const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x4a90e2, 0.4);
    this.scene.add(hemisphereLight);

    // Point lights for collectibles
    const pointLight1 = new THREE.PointLight(0xffdd00, 0.5, 10);
    pointLight1.position.set(15, 5, -8);
    this.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xffdd00, 0.5, 10);
    pointLight2.position.set(30, 7, 8);
    this.scene.add(pointLight2);
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
    // Don't update if transition is active
    if (this.transition.isActive()) {
      return;
    }

    // Get controls from gamepad
    const controls = this.gamepad.getControls();

    // Update player
    this.player.update(controls, deltaTime, this.level.data.platforms);

    // Update level
    this.level.update(deltaTime);

    // Update particles
    this.particles.update(deltaTime);

    // Check collectibles
    const playerPos = this.player.getPosition();

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
  }

  private levelComplete(): void {
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
      this.level = new Level(this.scene, this.currentLevel);

      // Reset player position
      this.player.state.position.copy(this.level.data.startPosition);
      this.player.state.velocity.set(0, 0, 0);

      // Update UI
      this.updateUI();

      // Wipe OUT to reveal new level
      setTimeout(() => {
        this.transition.start('starwipe', 'out', 1000);
      }, 100);
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

      // Fade back in
      setTimeout(() => {
        this.transition.start('fade', 'in', 800);
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
