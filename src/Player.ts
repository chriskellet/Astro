import * as THREE from 'three';
import { PlayerState, Controls, SkinDefinition } from './types';
import { Physics } from './Physics';
import { ParticleSystem } from './ParticleSystem';
import { getDefaultSkin } from './skins';

export class Player {
  public mesh: THREE.Group;
  public state: PlayerState;
  private physics: Physics;
  private particles: ParticleSystem;
  private skin: SkinDefinition;
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

  // Animation components for professional character model
  private bodyParts: {
    head: THREE.Group;
    torso: THREE.Group;
    leftUpperArm: THREE.Group;
    leftLowerArm: THREE.Group;
    leftHand: THREE.Mesh;
    rightUpperArm: THREE.Group;
    rightLowerArm: THREE.Group;
    rightHand: THREE.Mesh;
    leftUpperLeg: THREE.Group;
    leftLowerLeg: THREE.Group;
    leftFoot: THREE.Mesh;
    rightUpperLeg: THREE.Group;
    rightLowerLeg: THREE.Group;
    rightFoot: THREE.Mesh;
  } = {} as any;

  private animationTime: number = 0;
  private walkCycle: number = 0;
  private isWalking: boolean = false;
  private targetRotationY: number = 0;
  private rotationSpeed: number = 8; // radians per second

  constructor(physics: Physics, camera: THREE.Camera, particles: ParticleSystem, skin?: SkinDefinition) {
    this.physics = physics;
    this.camera = camera;
    this.particles = particles;
    this.skin = skin || getDefaultSkin();
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

    // ===== MATERIALS SETUP =====
    // Create professional PBR materials with varied metalness and roughness
    // Now using skin color configuration
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: this.skin.colors.base,
      metalness: this.skin.properties?.metalness ?? 0.1,
      roughness: this.skin.properties?.roughness ?? 0.3,
      envMapIntensity: 1.0,
    });

    const accentMaterial = new THREE.MeshStandardMaterial({
      color: this.skin.colors.accent,
      metalness: 0.8,
      roughness: 0.2,
      emissive: this.skin.colors.accent,
      emissiveIntensity: this.skin.properties?.emissiveIntensity ?? 0.2,
      envMapIntensity: 1.5,
    });

    const secondaryMaterial = new THREE.MeshStandardMaterial({
      color: this.skin.colors.secondary,
      metalness: 0.9,
      roughness: 0.15,
      envMapIntensity: 1.2,
    });

    const tertiaryMaterial = new THREE.MeshStandardMaterial({
      color: this.skin.colors.tertiary,
      metalness: 0.7,
      roughness: 0.25,
      envMapIntensity: 1.0,
    });

    const glowingEyeMaterial = new THREE.MeshStandardMaterial({
      color: this.skin.colors.eye,
      emissive: this.skin.colors.eyeEmissive,
      emissiveIntensity: 1.0,
      metalness: 0.0,
      roughness: 0.1,
    });

    // ===== TORSO =====
    this.bodyParts.torso = new THREE.Group();

    // Main chest piece - rounded box for modern look
    const chestGeometry = new THREE.BoxGeometry(0.6, 0.7, 0.5, 8, 8, 8);
    // Add rounded edges by modifying vertices
    const chestPositions = chestGeometry.attributes.position;
    for (let i = 0; i < chestPositions.count; i++) {
      const x = chestPositions.getX(i);
      const y = chestPositions.getY(i);
      const z = chestPositions.getZ(i);
      const factor = 0.15;
      chestPositions.setXYZ(
        i,
        x * (1 - factor * Math.abs(y / 0.35) * Math.abs(z / 0.25)),
        y,
        z * (1 - factor * Math.abs(y / 0.35) * Math.abs(x / 0.3))
      );
    }
    chestGeometry.computeVertexNormals();

    const chest = new THREE.Mesh(chestGeometry, baseMaterial);
    chest.castShadow = true;
    chest.receiveShadow = true;
    this.bodyParts.torso.add(chest);

    // Accent stripes
    const accentGeometry1 = new THREE.BoxGeometry(0.65, 0.08, 0.52);
    const accent1 = new THREE.Mesh(accentGeometry1, accentMaterial);
    accent1.position.y = 0.15;
    accent1.castShadow = true;
    this.bodyParts.torso.add(accent1);

    const accent2 = new THREE.Mesh(accentGeometry1.clone(), accentMaterial);
    accent2.position.y = -0.15;
    accent2.castShadow = true;
    this.bodyParts.torso.add(accent2);

    // Chest panel detail
    const panelGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.52);
    const panel = new THREE.Mesh(panelGeometry, secondaryMaterial);
    panel.position.set(0, 0, 0.01);
    panel.castShadow = true;
    this.bodyParts.torso.add(panel);

    // Small circular core detail
    const coreGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.05, 16);
    const core = new THREE.Mesh(coreGeometry, accentMaterial);
    core.rotation.x = Math.PI / 2;
    core.position.set(0, 0, 0.28);
    core.castShadow = true;
    this.bodyParts.torso.add(core);

    this.bodyParts.torso.position.y = 0;
    group.add(this.bodyParts.torso);

    // ===== HEAD =====
    this.bodyParts.head = new THREE.Group();

    // Main head - slightly elongated sphere
    const headGeometry = new THREE.SphereGeometry(0.28, 32, 32);
    headGeometry.scale(1, 1.1, 1);
    const head = new THREE.Mesh(headGeometry, baseMaterial);
    head.castShadow = true;
    head.receiveShadow = true;
    this.bodyParts.head.add(head);

    // Visor/face plate
    const visorGeometry = new THREE.SphereGeometry(0.29, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const visor = new THREE.Mesh(visorGeometry, secondaryMaterial);
    visor.position.z = 0.05;
    visor.castShadow = true;
    this.bodyParts.head.add(visor);

    // Eyes with professional glow
    const eyeGeometry = new THREE.SphereGeometry(0.08, 16, 16);
    const leftEye = new THREE.Mesh(eyeGeometry, glowingEyeMaterial);
    leftEye.position.set(-0.12, 0.05, 0.22);
    this.bodyParts.head.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeometry, glowingEyeMaterial);
    rightEye.position.set(0.12, 0.05, 0.22);
    this.bodyParts.head.add(rightEye);

    // Eye glow effect
    const eyeGlowGeometry = new THREE.SphereGeometry(0.12, 16, 16);
    const eyeGlowMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.3,
    });
    const leftGlow = new THREE.Mesh(eyeGlowGeometry, eyeGlowMaterial);
    leftGlow.position.copy(leftEye.position);
    this.bodyParts.head.add(leftGlow);

    const rightGlow = new THREE.Mesh(eyeGlowGeometry, eyeGlowMaterial.clone());
    rightGlow.position.copy(rightEye.position);
    this.bodyParts.head.add(rightGlow);

    // Antenna details
    const antennaGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.15, 8);
    const antenna = new THREE.Mesh(antennaGeometry, secondaryMaterial);
    antenna.position.set(0, 0.35, 0);
    antenna.castShadow = true;
    this.bodyParts.head.add(antenna);

    const antennaTipGeometry = new THREE.SphereGeometry(0.04, 16, 16);
    const antennaTip = new THREE.Mesh(antennaTipGeometry, accentMaterial);
    antennaTip.position.set(0, 0.42, 0);
    antennaTip.castShadow = true;
    this.bodyParts.head.add(antennaTip);

    // Add hat for Mario and Luigi
    if (this.skin.id === 'mario' || this.skin.id === 'luigi') {
      // Hat brim
      const hatBrimGeometry = new THREE.CylinderGeometry(0.35, 0.38, 0.05, 32);
      const hatColor = this.skin.id === 'mario' ? 0xFF0000 : 0x00AA00;
      const hatMaterial = new THREE.MeshStandardMaterial({
        color: hatColor,
        metalness: 0.2,
        roughness: 0.6,
      });
      const hatBrim = new THREE.Mesh(hatBrimGeometry, hatMaterial);
      hatBrim.position.set(0, 0.3, 0);
      hatBrim.castShadow = true;
      this.bodyParts.head.add(hatBrim);

      // Hat top (dome)
      const hatTopGeometry = new THREE.SphereGeometry(0.28, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
      const hatTop = new THREE.Mesh(hatTopGeometry, hatMaterial);
      hatTop.position.set(0, 0.35, 0);
      hatTop.castShadow = true;
      this.bodyParts.head.add(hatTop);

      // Hat logo/badge (M or L)
      const badgeGeometry = new THREE.CircleGeometry(0.08, 16);
      const badgeMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFFFFF,
        metalness: 0.1,
        roughness: 0.3,
      });
      const badge = new THREE.Mesh(badgeGeometry, badgeMaterial);
      badge.position.set(0, 0.3, 0.35);
      badge.castShadow = true;
      this.bodyParts.head.add(badge);
    }

    this.bodyParts.head.position.y = 0.65;
    this.bodyParts.torso.add(this.bodyParts.head);

    // ===== ARMS (Hierarchical structure for animation) =====
    // Left Arm
    this.bodyParts.leftUpperArm = new THREE.Group();
    const leftShoulderGeometry = new THREE.SphereGeometry(0.12, 16, 16);
    const leftShoulder = new THREE.Mesh(leftShoulderGeometry, secondaryMaterial);
    leftShoulder.castShadow = true;
    this.bodyParts.leftUpperArm.add(leftShoulder);

    const upperArmGeometry = new THREE.CapsuleGeometry(0.08, 0.35, 8, 16);
    const leftUpperArmMesh = new THREE.Mesh(upperArmGeometry, tertiaryMaterial);
    leftUpperArmMesh.position.y = -0.2;
    leftUpperArmMesh.castShadow = true;
    this.bodyParts.leftUpperArm.add(leftUpperArmMesh);

    this.bodyParts.leftUpperArm.position.set(-0.38, 0.25, 0);
    this.bodyParts.torso.add(this.bodyParts.leftUpperArm);

    this.bodyParts.leftLowerArm = new THREE.Group();
    const leftElbowGeometry = new THREE.SphereGeometry(0.09, 16, 16);
    const leftElbow = new THREE.Mesh(leftElbowGeometry, secondaryMaterial);
    leftElbow.castShadow = true;
    this.bodyParts.leftLowerArm.add(leftElbow);

    const lowerArmGeometry = new THREE.CapsuleGeometry(0.07, 0.3, 8, 16);
    const leftLowerArmMesh = new THREE.Mesh(lowerArmGeometry, baseMaterial);
    leftLowerArmMesh.position.y = -0.18;
    leftLowerArmMesh.castShadow = true;
    this.bodyParts.leftLowerArm.add(leftLowerArmMesh);

    this.bodyParts.leftLowerArm.position.y = -0.4;
    this.bodyParts.leftUpperArm.add(this.bodyParts.leftLowerArm);

    const handGeometry = new THREE.SphereGeometry(0.09, 16, 16);
    handGeometry.scale(1, 1.2, 0.8);
    this.bodyParts.leftHand = new THREE.Mesh(handGeometry, accentMaterial);
    this.bodyParts.leftHand.position.y = -0.36;
    this.bodyParts.leftHand.castShadow = true;
    this.bodyParts.leftLowerArm.add(this.bodyParts.leftHand);

    // Right Arm (mirror of left)
    this.bodyParts.rightUpperArm = new THREE.Group();
    const rightShoulder = new THREE.Mesh(leftShoulderGeometry, secondaryMaterial);
    rightShoulder.castShadow = true;
    this.bodyParts.rightUpperArm.add(rightShoulder);

    const rightUpperArmMesh = new THREE.Mesh(upperArmGeometry, tertiaryMaterial);
    rightUpperArmMesh.position.y = -0.2;
    rightUpperArmMesh.castShadow = true;
    this.bodyParts.rightUpperArm.add(rightUpperArmMesh);

    this.bodyParts.rightUpperArm.position.set(0.38, 0.25, 0);
    this.bodyParts.torso.add(this.bodyParts.rightUpperArm);

    this.bodyParts.rightLowerArm = new THREE.Group();
    const rightElbow = new THREE.Mesh(leftElbowGeometry, secondaryMaterial);
    rightElbow.castShadow = true;
    this.bodyParts.rightLowerArm.add(rightElbow);

    const rightLowerArmMesh = new THREE.Mesh(lowerArmGeometry, baseMaterial);
    rightLowerArmMesh.position.y = -0.18;
    rightLowerArmMesh.castShadow = true;
    this.bodyParts.rightLowerArm.add(rightLowerArmMesh);

    this.bodyParts.rightLowerArm.position.y = -0.4;
    this.bodyParts.rightUpperArm.add(this.bodyParts.rightLowerArm);

    this.bodyParts.rightHand = new THREE.Mesh(handGeometry.clone(), accentMaterial);
    this.bodyParts.rightHand.position.y = -0.36;
    this.bodyParts.rightHand.castShadow = true;
    this.bodyParts.rightLowerArm.add(this.bodyParts.rightHand);

    // ===== LEGS (Hierarchical structure for walking animation) =====
    // Left Leg
    this.bodyParts.leftUpperLeg = new THREE.Group();
    const leftHipGeometry = new THREE.SphereGeometry(0.13, 16, 16);
    const leftHip = new THREE.Mesh(leftHipGeometry, secondaryMaterial);
    leftHip.castShadow = true;
    this.bodyParts.leftUpperLeg.add(leftHip);

    const upperLegGeometry = new THREE.CapsuleGeometry(0.1, 0.4, 8, 16);
    const leftUpperLegMesh = new THREE.Mesh(upperLegGeometry, tertiaryMaterial);
    leftUpperLegMesh.position.y = -0.25;
    leftUpperLegMesh.castShadow = true;
    this.bodyParts.leftUpperLeg.add(leftUpperLegMesh);

    this.bodyParts.leftUpperLeg.position.set(-0.18, -0.4, 0);
    this.bodyParts.torso.add(this.bodyParts.leftUpperLeg);

    this.bodyParts.leftLowerLeg = new THREE.Group();
    const leftKneeGeometry = new THREE.SphereGeometry(0.11, 16, 16);
    const leftKnee = new THREE.Mesh(leftKneeGeometry, secondaryMaterial);
    leftKnee.castShadow = true;
    this.bodyParts.leftLowerLeg.add(leftKnee);

    const lowerLegGeometry = new THREE.CapsuleGeometry(0.09, 0.35, 8, 16);
    const leftLowerLegMesh = new THREE.Mesh(lowerLegGeometry, baseMaterial);
    leftLowerLegMesh.position.y = -0.22;
    leftLowerLegMesh.castShadow = true;
    this.bodyParts.leftLowerLeg.add(leftLowerLegMesh);

    this.bodyParts.leftLowerLeg.position.y = -0.5;
    this.bodyParts.leftUpperLeg.add(this.bodyParts.leftLowerLeg);

    const footGeometry = new THREE.BoxGeometry(0.15, 0.1, 0.25, 4, 4, 4);
    this.bodyParts.leftFoot = new THREE.Mesh(footGeometry, accentMaterial);
    this.bodyParts.leftFoot.position.set(0, -0.47, 0.05);
    this.bodyParts.leftFoot.castShadow = true;
    this.bodyParts.leftLowerLeg.add(this.bodyParts.leftFoot);

    // Right Leg (mirror of left)
    this.bodyParts.rightUpperLeg = new THREE.Group();
    const rightHip = new THREE.Mesh(leftHipGeometry, secondaryMaterial);
    rightHip.castShadow = true;
    this.bodyParts.rightUpperLeg.add(rightHip);

    const rightUpperLegMesh = new THREE.Mesh(upperLegGeometry, tertiaryMaterial);
    rightUpperLegMesh.position.y = -0.25;
    rightUpperLegMesh.castShadow = true;
    this.bodyParts.rightUpperLeg.add(rightUpperLegMesh);

    this.bodyParts.rightUpperLeg.position.set(0.18, -0.4, 0);
    this.bodyParts.torso.add(this.bodyParts.rightUpperLeg);

    this.bodyParts.rightLowerLeg = new THREE.Group();
    const rightKnee = new THREE.Mesh(leftKneeGeometry, secondaryMaterial);
    rightKnee.castShadow = true;
    this.bodyParts.rightLowerLeg.add(rightKnee);

    const rightLowerLegMesh = new THREE.Mesh(lowerLegGeometry, baseMaterial);
    rightLowerLegMesh.position.y = -0.22;
    rightLowerLegMesh.castShadow = true;
    this.bodyParts.rightLowerLeg.add(rightLowerLegMesh);

    this.bodyParts.rightLowerLeg.position.y = -0.5;
    this.bodyParts.rightUpperLeg.add(this.bodyParts.rightLowerLeg);

    this.bodyParts.rightFoot = new THREE.Mesh(footGeometry.clone(), accentMaterial);
    this.bodyParts.rightFoot.position.set(0, -0.47, 0.05);
    this.bodyParts.rightFoot.castShadow = true;
    this.bodyParts.rightLowerLeg.add(this.bodyParts.rightFoot);

    // ===== ROCKET FLAMES =====
    const flameGeometry = new THREE.ConeGeometry(0.12, 0.4, 8);
    const flameMaterial = new THREE.MeshBasicMaterial({
      color: 0xff6600,
      transparent: true,
      opacity: 0,
    });

    this.leftFootFlame = new THREE.Mesh(flameGeometry, flameMaterial.clone());
    this.leftFootFlame.position.set(0, -0.55, 0.05);
    this.leftFootFlame.rotation.x = Math.PI;
    this.bodyParts.leftFoot.add(this.leftFootFlame);

    this.rightFootFlame = new THREE.Mesh(flameGeometry, flameMaterial.clone());
    this.rightFootFlame.position.set(0, -0.55, 0.05);
    this.rightFootFlame.rotation.x = Math.PI;
    this.bodyParts.rightFoot.add(this.rightFootFlame);

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

      // Set target rotation to face movement direction
      this.targetRotationY = Math.atan2(moveVector.x, moveVector.z);
    } else {
      // Apply friction
      this.state.velocity.x *= 0.85;
      this.state.velocity.z *= 0.85;
    }

    // Smoothly interpolate rotation towards target
    this.updateRotation(deltaTime);

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

    // Professional animation system
    this.updateAnimations(deltaTime, moveVector);

    // Update camera
    this.updateCamera();
  }

  private updateAnimations(deltaTime: number, moveVector: THREE.Vector3): void {
    this.animationTime += deltaTime;
    this.isWalking = moveVector.length() > 0;

    // ===== WALKING ANIMATION =====
    if (this.isWalking) {
      // Increase walk cycle speed based on movement
      this.walkCycle += deltaTime * 8;

      // Leg swing animation with proper gait
      const leftLegSwing = Math.sin(this.walkCycle);
      const rightLegSwing = Math.sin(this.walkCycle + Math.PI);

      // Upper leg rotation (hip swing)
      this.bodyParts.leftUpperLeg.rotation.x = leftLegSwing * 0.6;
      this.bodyParts.rightUpperLeg.rotation.x = rightLegSwing * 0.6;

      // Lower leg rotation (knee bend) - only bend when leg is back
      const leftKneeBend = Math.max(0, -leftLegSwing) * 0.8;
      const rightKneeBend = Math.max(0, -rightLegSwing) * 0.8;
      this.bodyParts.leftLowerLeg.rotation.x = leftKneeBend;
      this.bodyParts.rightLowerLeg.rotation.x = rightKneeBend;

      // Foot angle adjustment for natural stride
      this.bodyParts.leftFoot.rotation.x = -leftLegSwing * 0.3;
      this.bodyParts.rightFoot.rotation.x = -rightLegSwing * 0.3;

      // Arm swing (opposite to legs for natural gait)
      const leftArmSwing = Math.sin(this.walkCycle + Math.PI);
      const rightArmSwing = Math.sin(this.walkCycle);

      this.bodyParts.leftUpperArm.rotation.x = leftArmSwing * 0.5;
      this.bodyParts.rightUpperArm.rotation.x = rightArmSwing * 0.5;

      // Lower arm swing for added realism
      this.bodyParts.leftLowerArm.rotation.x = Math.max(0, leftArmSwing) * 0.4;
      this.bodyParts.rightLowerArm.rotation.x = Math.max(0, rightArmSwing) * 0.4;

      // Torso rotation (subtle twist following movement)
      this.bodyParts.torso.rotation.y = Math.sin(this.walkCycle) * 0.08;
      this.bodyParts.torso.rotation.z = Math.sin(this.walkCycle) * 0.05;

      // Head bob (vertical movement)
      const verticalBob = Math.abs(Math.sin(this.walkCycle * 2)) * 0.08;
      this.bodyParts.head.position.y = 0.65 + verticalBob;

      // Head counter-rotation to keep it stable
      this.bodyParts.head.rotation.y = -Math.sin(this.walkCycle) * 0.06;

      // Torso vertical bob
      this.mesh.position.y += verticalBob;
    } else {
      // ===== IDLE ANIMATION =====
      // Smoothly return to idle pose
      const idleSpeed = deltaTime * 5;

      // Reset leg rotations smoothly
      this.bodyParts.leftUpperLeg.rotation.x *= (1 - idleSpeed);
      this.bodyParts.rightUpperLeg.rotation.x *= (1 - idleSpeed);
      this.bodyParts.leftLowerLeg.rotation.x *= (1 - idleSpeed);
      this.bodyParts.rightLowerLeg.rotation.x *= (1 - idleSpeed);
      this.bodyParts.leftFoot.rotation.x *= (1 - idleSpeed);
      this.bodyParts.rightFoot.rotation.x *= (1 - idleSpeed);

      // Gentle arm sway when idle
      const idleSway = Math.sin(this.animationTime * 1.5) * 0.1;
      this.bodyParts.leftUpperArm.rotation.x = idleSway;
      this.bodyParts.rightUpperArm.rotation.x = -idleSway;
      this.bodyParts.leftLowerArm.rotation.x = 0;
      this.bodyParts.rightLowerArm.rotation.x = 0;

      // Reset torso rotation
      this.bodyParts.torso.rotation.y *= (1 - idleSpeed);
      this.bodyParts.torso.rotation.z *= (1 - idleSpeed);

      // Gentle breathing animation
      const breathingCycle = Math.sin(this.animationTime * 2) * 0.02;
      this.bodyParts.torso.scale.y = 1 + breathingCycle;
      this.bodyParts.head.position.y = 0.65 + breathingCycle * 0.5;

      // Subtle head rotation (looking around)
      this.bodyParts.head.rotation.y = Math.sin(this.animationTime * 0.8) * 0.15;
    }

    // ===== JUMPING ANIMATION =====
    if (this.state.isJumping) {
      // Arms up during jump
      const jumpArmPose = Math.min(1, Math.abs(this.state.velocity.y) * 0.1);
      this.bodyParts.leftUpperArm.rotation.z = jumpArmPose * 0.5;
      this.bodyParts.rightUpperArm.rotation.z = -jumpArmPose * 0.5;
      this.bodyParts.leftUpperArm.rotation.x = -jumpArmPose * 1.2;
      this.bodyParts.rightUpperArm.rotation.x = -jumpArmPose * 1.2;

      // Legs tucked when going up, extended when falling
      if (this.state.velocity.y > 0) {
        // Going up - tuck legs
        this.bodyParts.leftUpperLeg.rotation.x = -0.8;
        this.bodyParts.rightUpperLeg.rotation.x = -0.8;
        this.bodyParts.leftLowerLeg.rotation.x = 1.2;
        this.bodyParts.rightLowerLeg.rotation.x = 1.2;
      } else {
        // Falling - extend legs to prepare for landing
        this.bodyParts.leftUpperLeg.rotation.x = 0.3;
        this.bodyParts.rightUpperLeg.rotation.x = 0.3;
        this.bodyParts.leftLowerLeg.rotation.x = 0;
        this.bodyParts.rightLowerLeg.rotation.x = 0;
      }

      // Torso lean forward slightly
      this.bodyParts.torso.rotation.x = 0.1;
    } else if (!this.isWalking) {
      // Reset jump pose when landed and not walking
      this.bodyParts.leftUpperArm.rotation.z *= 0.9;
      this.bodyParts.rightUpperArm.rotation.z *= 0.9;
      this.bodyParts.torso.rotation.x *= 0.9;
    }

    // ===== ROCKET BOOST ANIMATION =====
    if (this.state.isBoosterActive) {
      // Spread arms out during boost
      this.bodyParts.leftUpperArm.rotation.z = 1.2;
      this.bodyParts.rightUpperArm.rotation.z = -1.2;
      this.bodyParts.leftUpperArm.rotation.x = -0.3;
      this.bodyParts.rightUpperArm.rotation.x = -0.3;

      // Legs extended down with slight spread
      this.bodyParts.leftUpperLeg.rotation.x = -0.2;
      this.bodyParts.rightUpperLeg.rotation.x = -0.2;
      this.bodyParts.leftUpperLeg.rotation.z = -0.2;
      this.bodyParts.rightUpperLeg.rotation.z = 0.2;
      this.bodyParts.leftLowerLeg.rotation.x = 0;
      this.bodyParts.rightLowerLeg.rotation.x = 0;

      // Feet angled down
      this.bodyParts.leftFoot.rotation.x = 0.3;
      this.bodyParts.rightFoot.rotation.x = 0.3;

      // Slight backward lean
      this.bodyParts.torso.rotation.x = -0.15;

      // Head look up
      this.bodyParts.head.rotation.x = -0.2;
    } else if (!this.state.isJumping && !this.isWalking) {
      // Reset boost pose
      this.bodyParts.leftUpperLeg.rotation.z *= 0.95;
      this.bodyParts.rightUpperLeg.rotation.z *= 0.95;
      this.bodyParts.head.rotation.x *= 0.95;
    }
  }

  private updateRotation(deltaTime: number): void {
    // Calculate the shortest rotation difference
    let rotationDiff = this.targetRotationY - this.mesh.rotation.y;

    // Normalize the angle difference to [-π, π] to take the shortest path
    while (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
    while (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;

    // Smoothly interpolate rotation
    const maxRotationStep = this.rotationSpeed * deltaTime;

    if (Math.abs(rotationDiff) < maxRotationStep) {
      // Close enough, snap to target
      this.mesh.rotation.y = this.targetRotationY;
    } else {
      // Rotate towards target at constant speed
      this.mesh.rotation.y += Math.sign(rotationDiff) * maxRotationStep;
    }

    // Normalize final rotation to [-π, π]
    while (this.mesh.rotation.y > Math.PI) this.mesh.rotation.y -= Math.PI * 2;
    while (this.mesh.rotation.y < -Math.PI) this.mesh.rotation.y += Math.PI * 2;
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
