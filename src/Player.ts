import * as THREE from 'three';
import { PlayerState, Controls } from './types';
import { Physics } from './Physics';
import { ParticleSystem } from './ParticleSystem';

export class Player {
  public mesh: THREE.Group;
  public state: PlayerState;
  private physics: Physics;
  private particles: ParticleSystem;
  private moveSpeed: number = 8;
  private jumpForce: number = 12;
  private boosterThrust: number = 25;
  private radius: number = 0.5;
  private height: number = 1.5;
  private camera: THREE.Camera;
  private cameraOffset: THREE.Vector3;
  private leftFootFlame!: THREE.Mesh;
  private rightFootFlame!: THREE.Mesh;
  private lastJumpState: boolean = false;
  private rocketJumpAvailable: boolean = true;
  private lastBoosterState: boolean = false;
  private rocketBoosterTime: number = 0;
  private rocketBoosterMaxTime: number = 3.0; // 3 seconds
  private rocketStartHeight: number = 0;
  private maxRocketHeight: number = 10; // Height at which thrust reduces to hover

  constructor(physics: Physics, camera: THREE.Camera, particles: ParticleSystem) {
    this.physics = physics;
    this.camera = camera;
    this.particles = particles;
    this.cameraOffset = new THREE.Vector3(0, 8, 12);

    this.state = {
      position: new THREE.Vector3(0, 5, 0),
      velocity: new THREE.Vector3(0, 0, 0),
      isJumping: false,
      canDoubleJump: true,
      doubleJumpUsed: false,
      isBoosterActive: false,
      health: 100,
      score: 0,
    };

    this.mesh = this.createMesh();
    this.mesh.position.copy(this.state.position);
  }

  private createMesh(): THREE.Group {
    const group = new THREE.Group();

    // Body (sphere)
    const bodyGeometry = new THREE.SphereGeometry(this.radius, 32, 32);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.3,
      roughness: 0.4,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0;
    body.castShadow = true;
    group.add(body);

    // Head (smaller sphere on top)
    const headGeometry = new THREE.SphereGeometry(this.radius * 0.6, 32, 32);
    const headMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.2,
      roughness: 0.3,
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = this.radius * 1.2;
    head.castShadow = true;
    group.add(head);

    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const eyeMaterial = new THREE.MeshStandardMaterial({
      color: 0x000000,
      emissive: 0x00ffff,
      emissiveIntensity: 0.5,
    });

    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.15, this.radius * 1.3, this.radius * 0.5);
    group.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.15, this.radius * 1.3, this.radius * 0.5);
    group.add(rightEye);

    // Blue accent (PlayStation reference)
    const accentGeometry = new THREE.BoxGeometry(0.6, 0.15, 0.15);
    const accentMaterial = new THREE.MeshStandardMaterial({
      color: 0x0066ff,
      emissive: 0x0066ff,
      emissiveIntensity: 0.3,
    });
    const accent = new THREE.Mesh(accentGeometry, accentMaterial);
    accent.position.y = 0;
    group.add(accent);

    // Arms
    const armGeometry = new THREE.CapsuleGeometry(0.12, 0.5, 8, 16);
    const armMaterial = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      metalness: 0.4,
      roughness: 0.3,
    });

    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.5, 0, 0);
    leftArm.rotation.z = Math.PI / 6;
    leftArm.castShadow = true;
    group.add(leftArm);

    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.5, 0, 0);
    rightArm.rotation.z = -Math.PI / 6;
    rightArm.castShadow = true;
    group.add(rightArm);

    // Legs
    const legGeometry = new THREE.CapsuleGeometry(0.15, 0.6, 8, 16);
    const legMaterial = new THREE.MeshStandardMaterial({
      color: 0xaaaaaa,
      metalness: 0.5,
      roughness: 0.2,
    });

    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.25, -this.radius - 0.3, 0);
    leftLeg.castShadow = true;
    group.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.25, -this.radius - 0.3, 0);
    rightLeg.castShadow = true;
    group.add(rightLeg);

    // Rocket booster flames (hidden by default)
    const flameGeometry = new THREE.ConeGeometry(0.15, 0.5, 8);
    const flameMaterial = new THREE.MeshBasicMaterial({
      color: 0xff6600,
      transparent: true,
      opacity: 0,
    });

    this.leftFootFlame = new THREE.Mesh(flameGeometry, flameMaterial.clone());
    this.leftFootFlame.position.set(-0.25, -this.radius - 0.9, 0);
    this.leftFootFlame.rotation.x = Math.PI;
    group.add(this.leftFootFlame);

    this.rightFootFlame = new THREE.Mesh(flameGeometry, flameMaterial.clone());
    this.rightFootFlame.position.set(0.25, -this.radius - 0.9, 0);
    this.rightFootFlame.rotation.x = Math.PI;
    group.add(this.rightFootFlame);

    return group;
  }

  public update(controls: Controls, deltaTime: number, platforms: any[]): void {
    // Apply movement
    const moveVector = new THREE.Vector3();

    if (controls.left) moveVector.x -= 1;
    if (controls.right) moveVector.x += 1;
    if (controls.forward) moveVector.z -= 1;
    if (controls.backward) moveVector.z += 1;

    if (moveVector.length() > 0) {
      moveVector.normalize();
      this.state.velocity.x = moveVector.x * this.moveSpeed;
      this.state.velocity.z = moveVector.z * this.moveSpeed;

      // Rotate player to face movement direction
      const angle = Math.atan2(moveVector.x, moveVector.z);
      this.mesh.rotation.y = angle;
    } else {
      // Apply friction
      this.state.velocity.x *= 0.85;
      this.state.velocity.z *= 0.85;
    }

    // Apply gravity
    this.physics.applyGravity(this.state.velocity, deltaTime);

    // Update position
    this.state.position.x += this.state.velocity.x * deltaTime;
    this.state.position.y += this.state.velocity.y * deltaTime;
    this.state.position.z += this.state.velocity.z * deltaTime;

    // Check collisions
    const collision = this.physics.checkPlatformCollision(
      this.state.position,
      this.state.velocity,
      this.radius,
      this.height,
      platforms
    );

    this.state.isJumping = !collision.grounded;

    // Reset double jump and rocket jump when grounded
    if (collision.grounded) {
      this.state.doubleJumpUsed = false;
      this.rocketJumpAvailable = true;
      this.rocketBoosterTime = 0;
    }

    // Jump (only trigger on new press, not held)
    if (controls.jump && !this.lastJumpState && !this.state.isJumping) {
      if (collision.grounded) {
        // Normal jump
        this.state.velocity.y = this.jumpForce;
        this.state.isJumping = true;
      }
    }
    this.lastJumpState = controls.jump;

    // Rocket Booster (can only be activated once per jump)
    if (controls.booster && !this.lastBoosterState && this.rocketJumpAvailable) {
      // First press - activate rocket jump and make it unavailable until grounded
      this.rocketJumpAvailable = false;
      this.state.isBoosterActive = true;
      this.rocketBoosterTime = 0;
      this.rocketStartHeight = this.state.position.y; // Track starting height
    }

    // Continue applying thrust while booster button is held and rocket jump is active
    if (controls.booster && this.state.isBoosterActive) {
      // Update booster time
      this.rocketBoosterTime += deltaTime;

      // Calculate how high we've risen
      const heightGained = this.state.position.y - this.rocketStartHeight;

      // Calculate thrust multiplier based on time remaining AND height
      let thrustMultiplier = 1.0;
      if (this.rocketBoosterTime >= this.rocketBoosterMaxTime) {
        // Booster time expired - create splutter effect
        this.state.isBoosterActive = false;
        thrustMultiplier = 0;
      } else if (this.rocketBoosterTime >= this.rocketBoosterMaxTime - 0.5) {
        // Last 0.5 seconds - splutter with random thrust
        thrustMultiplier = Math.random() * 0.3;
      }

      // Calculate height-based thrust adjustment
      let heightBasedThrust = this.boosterThrust;

      if (heightGained < this.maxRocketHeight) {
        // Strong initial thrust when below max height
        // Increase base thrust for better initial response
        heightBasedThrust = 35; // Stronger than before (was 25)
      } else {
        // Reduce to hover thrust when at/above max height
        // Just enough to counteract gravity (15) plus a bit extra
        heightBasedThrust = 18; // Gentle hover
      }

      // Apply upward thrust to counteract gravity and move upwards
      this.state.velocity.y += heightBasedThrust * deltaTime * thrustMultiplier;

      // Emit flame and smoke particles from feet
      const leftFootPos = this.state.position.clone();
      leftFootPos.x -= 0.25;
      leftFootPos.y -= 0.4; // Position at feet (adjusted for visual offset)

      const rightFootPos = this.state.position.clone();
      rightFootPos.x += 0.25;
      rightFootPos.y -= 0.4; // Position at feet (adjusted for visual offset)

      if (thrustMultiplier > 0.1) {
        this.particles.emitFlame(leftFootPos, 2);
        this.particles.emitFlame(rightFootPos, 2);
        this.particles.emitSmoke(leftFootPos, 1);
        this.particles.emitSmoke(rightFootPos, 1);
      } else {
        // Spluttering - less particles
        this.particles.emitSmoke(leftFootPos, 1);
        this.particles.emitSmoke(rightFootPos, 1);
      }

      // Show flame visuals with opacity based on thrust
      const leftMat = this.leftFootFlame.material as THREE.MeshBasicMaterial;
      const rightMat = this.rightFootFlame.material as THREE.MeshBasicMaterial;
      const flameOpacity = (0.8 + Math.random() * 0.2) * thrustMultiplier;
      leftMat.opacity = flameOpacity;
      rightMat.opacity = flameOpacity;

      // Animate flame size
      const flameScale = (1 + Math.sin(Date.now() * 0.02) * 0.3) * thrustMultiplier;
      this.leftFootFlame.scale.set(1, flameScale, 1);
      this.rightFootFlame.scale.set(1, flameScale, 1);
    } else if (!controls.booster) {
      // Button released - deactivate booster
      this.state.isBoosterActive = false;
      // Hide flames
      (this.leftFootFlame.material as THREE.MeshBasicMaterial).opacity = 0;
      (this.rightFootFlame.material as THREE.MeshBasicMaterial).opacity = 0;
    }

    this.lastBoosterState = controls.booster;

    // Keep within boundaries
    this.physics.checkBoundary(this.state.position, 50);

    // Update mesh position with vertical offset so feet sit on ground
    this.mesh.position.copy(this.state.position);
    this.mesh.position.y += 0.35; // Offset to prevent feet sinking into ground

    // Simple animation - bob when moving
    if (moveVector.length() > 0) {
      const bobAmount = Math.sin(Date.now() * 0.01) * 0.1;
      this.mesh.position.y += bobAmount;
    }

    // Update camera
    this.updateCamera();
  }

  private updateCamera(): void {
    const targetPosition = this.state.position.clone().add(this.cameraOffset);
    this.camera.position.lerp(targetPosition, 0.1);
    this.camera.lookAt(this.state.position);
  }

  public addScore(points: number): void {
    this.state.score += points;
  }

  public getPosition(): THREE.Vector3 {
    return this.state.position.clone();
  }

  public getRadius(): number {
    return this.radius;
  }
}
