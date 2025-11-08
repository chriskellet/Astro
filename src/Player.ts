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

    // ===== MATERIALS SETUP =====
    // Create professional PBR materials with varied metalness and roughness
    const whitePlasticMaterial = new THREE.MeshStandardMaterial({
      color: 0xf8f8f8,
      metalness: 0.1,
      roughness: 0.3,
      envMapIntensity: 1.0,
    });

    const blueMetalMaterial = new THREE.MeshStandardMaterial({
      color: 0x0066ff,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0x003388,
      emissiveIntensity: 0.2,
      envMapIntensity: 1.5,
    });

    const darkMetalMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.9,
      roughness: 0.15,
      envMapIntensity: 1.2,
    });

    const lightMetalMaterial = new THREE.MeshStandardMaterial({
      color: 0xdddddd,
      metalness: 0.7,
      roughness: 0.25,
      envMapIntensity: 1.0,
    });

    const glowingEyeMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
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

    const chest = new THREE.Mesh(chestGeometry, whitePlasticMaterial);
    chest.castShadow = true;
    chest.receiveShadow = true;
    this.bodyParts.torso.add(chest);

    // Blue accent stripes
    const accentGeometry1 = new THREE.BoxGeometry(0.65, 0.08, 0.52);
    const accent1 = new THREE.Mesh(accentGeometry1, blueMetalMaterial);
    accent1.position.y = 0.15;
    accent1.castShadow = true;
    this.bodyParts.torso.add(accent1);

    const accent2 = new THREE.Mesh(accentGeometry1.clone(), blueMetalMaterial);
    accent2.position.y = -0.15;
    accent2.castShadow = true;
    this.bodyParts.torso.add(accent2);

    // Chest panel detail
    const panelGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.52);
    const panel = new THREE.Mesh(panelGeometry, darkMetalMaterial);
    panel.position.set(0, 0, 0.01);
    panel.castShadow = true;
    this.bodyParts.torso.add(panel);

    // Small circular core detail
    const coreGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.05, 16);
    const core = new THREE.Mesh(coreGeometry, blueMetalMaterial);
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
    const head = new THREE.Mesh(headGeometry, whitePlasticMaterial);
    head.castShadow = true;
    head.receiveShadow = true;
    this.bodyParts.head.add(head);

    // Visor/face plate
    const visorGeometry = new THREE.SphereGeometry(0.29, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const visor = new THREE.Mesh(visorGeometry, darkMetalMaterial);
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
    const antenna = new THREE.Mesh(antennaGeometry, darkMetalMaterial);
    antenna.position.set(0, 0.35, 0);
    antenna.castShadow = true;
    this.bodyParts.head.add(antenna);

    const antennaTipGeometry = new THREE.SphereGeometry(0.04, 16, 16);
    const antennaTip = new THREE.Mesh(antennaTipGeometry, blueMetalMaterial);
    antennaTip.position.set(0, 0.42, 0);
    antennaTip.castShadow = true;
    this.bodyParts.head.add(antennaTip);

    this.bodyParts.head.position.y = 0.65;
    this.bodyParts.torso.add(this.bodyParts.head);

    // ===== ARMS (Hierarchical structure for animation) =====
    // Left Arm
    this.bodyParts.leftUpperArm = new THREE.Group();
    const leftShoulderGeometry = new THREE.SphereGeometry(0.12, 16, 16);
    const leftShoulder = new THREE.Mesh(leftShoulderGeometry, darkMetalMaterial);
    leftShoulder.castShadow = true;
    this.bodyParts.leftUpperArm.add(leftShoulder);

    const upperArmGeometry = new THREE.CapsuleGeometry(0.08, 0.35, 8, 16);
    const leftUpperArmMesh = new THREE.Mesh(upperArmGeometry, lightMetalMaterial);
    leftUpperArmMesh.position.y = -0.2;
    leftUpperArmMesh.castShadow = true;
    this.bodyParts.leftUpperArm.add(leftUpperArmMesh);

    this.bodyParts.leftUpperArm.position.set(-0.38, 0.25, 0);
    this.bodyParts.torso.add(this.bodyParts.leftUpperArm);

    this.bodyParts.leftLowerArm = new THREE.Group();
    const leftElbowGeometry = new THREE.SphereGeometry(0.09, 16, 16);
    const leftElbow = new THREE.Mesh(leftElbowGeometry, darkMetalMaterial);
    leftElbow.castShadow = true;
    this.bodyParts.leftLowerArm.add(leftElbow);

    const lowerArmGeometry = new THREE.CapsuleGeometry(0.07, 0.3, 8, 16);
    const leftLowerArmMesh = new THREE.Mesh(lowerArmGeometry, whitePlasticMaterial);
    leftLowerArmMesh.position.y = -0.18;
    leftLowerArmMesh.castShadow = true;
    this.bodyParts.leftLowerArm.add(leftLowerArmMesh);

    this.bodyParts.leftLowerArm.position.y = -0.4;
    this.bodyParts.leftUpperArm.add(this.bodyParts.leftLowerArm);

    const handGeometry = new THREE.SphereGeometry(0.09, 16, 16);
    handGeometry.scale(1, 1.2, 0.8);
    this.bodyParts.leftHand = new THREE.Mesh(handGeometry, blueMetalMaterial);
    this.bodyParts.leftHand.position.y = -0.36;
    this.bodyParts.leftHand.castShadow = true;
    this.bodyParts.leftLowerArm.add(this.bodyParts.leftHand);

    // Right Arm (mirror of left)
    this.bodyParts.rightUpperArm = new THREE.Group();
    const rightShoulder = new THREE.Mesh(leftShoulderGeometry, darkMetalMaterial);
    rightShoulder.castShadow = true;
    this.bodyParts.rightUpperArm.add(rightShoulder);

    const rightUpperArmMesh = new THREE.Mesh(upperArmGeometry, lightMetalMaterial);
    rightUpperArmMesh.position.y = -0.2;
    rightUpperArmMesh.castShadow = true;
    this.bodyParts.rightUpperArm.add(rightUpperArmMesh);

    this.bodyParts.rightUpperArm.position.set(0.38, 0.25, 0);
    this.bodyParts.torso.add(this.bodyParts.rightUpperArm);

    this.bodyParts.rightLowerArm = new THREE.Group();
    const rightElbow = new THREE.Mesh(leftElbowGeometry, darkMetalMaterial);
    rightElbow.castShadow = true;
    this.bodyParts.rightLowerArm.add(rightElbow);

    const rightLowerArmMesh = new THREE.Mesh(lowerArmGeometry, whitePlasticMaterial);
    rightLowerArmMesh.position.y = -0.18;
    rightLowerArmMesh.castShadow = true;
    this.bodyParts.rightLowerArm.add(rightLowerArmMesh);

    this.bodyParts.rightLowerArm.position.y = -0.4;
    this.bodyParts.rightUpperArm.add(this.bodyParts.rightLowerArm);

    this.bodyParts.rightHand = new THREE.Mesh(handGeometry.clone(), blueMetalMaterial);
    this.bodyParts.rightHand.position.y = -0.36;
    this.bodyParts.rightHand.castShadow = true;
    this.bodyParts.rightLowerArm.add(this.bodyParts.rightHand);

    // ===== LEGS (Hierarchical structure for walking animation) =====
    // Left Leg
    this.bodyParts.leftUpperLeg = new THREE.Group();
    const leftHipGeometry = new THREE.SphereGeometry(0.13, 16, 16);
    const leftHip = new THREE.Mesh(leftHipGeometry, darkMetalMaterial);
    leftHip.castShadow = true;
    this.bodyParts.leftUpperLeg.add(leftHip);

    const upperLegGeometry = new THREE.CapsuleGeometry(0.1, 0.4, 8, 16);
    const leftUpperLegMesh = new THREE.Mesh(upperLegGeometry, lightMetalMaterial);
    leftUpperLegMesh.position.y = -0.25;
    leftUpperLegMesh.castShadow = true;
    this.bodyParts.leftUpperLeg.add(leftUpperLegMesh);

    this.bodyParts.leftUpperLeg.position.set(-0.18, -0.4, 0);
    this.bodyParts.torso.add(this.bodyParts.leftUpperLeg);

    this.bodyParts.leftLowerLeg = new THREE.Group();
    const leftKneeGeometry = new THREE.SphereGeometry(0.11, 16, 16);
    const leftKnee = new THREE.Mesh(leftKneeGeometry, darkMetalMaterial);
    leftKnee.castShadow = true;
    this.bodyParts.leftLowerLeg.add(leftKnee);

    const lowerLegGeometry = new THREE.CapsuleGeometry(0.09, 0.35, 8, 16);
    const leftLowerLegMesh = new THREE.Mesh(lowerLegGeometry, whitePlasticMaterial);
    leftLowerLegMesh.position.y = -0.22;
    leftLowerLegMesh.castShadow = true;
    this.bodyParts.leftLowerLeg.add(leftLowerLegMesh);

    this.bodyParts.leftLowerLeg.position.y = -0.5;
    this.bodyParts.leftUpperLeg.add(this.bodyParts.leftLowerLeg);

    const footGeometry = new THREE.BoxGeometry(0.15, 0.1, 0.25, 4, 4, 4);
    this.bodyParts.leftFoot = new THREE.Mesh(footGeometry, blueMetalMaterial);
    this.bodyParts.leftFoot.position.set(0, -0.47, 0.05);
    this.bodyParts.leftFoot.castShadow = true;
    this.bodyParts.leftLowerLeg.add(this.bodyParts.leftFoot);

    // Right Leg (mirror of left)
    this.bodyParts.rightUpperLeg = new THREE.Group();
    const rightHip = new THREE.Mesh(leftHipGeometry, darkMetalMaterial);
    rightHip.castShadow = true;
    this.bodyParts.rightUpperLeg.add(rightHip);

    const rightUpperLegMesh = new THREE.Mesh(upperLegGeometry, lightMetalMaterial);
    rightUpperLegMesh.position.y = -0.25;
    rightUpperLegMesh.castShadow = true;
    this.bodyParts.rightUpperLeg.add(rightUpperLegMesh);

    this.bodyParts.rightUpperLeg.position.set(0.18, -0.4, 0);
    this.bodyParts.torso.add(this.bodyParts.rightUpperLeg);

    this.bodyParts.rightLowerLeg = new THREE.Group();
    const rightKnee = new THREE.Mesh(leftKneeGeometry, darkMetalMaterial);
    rightKnee.castShadow = true;
    this.bodyParts.rightLowerLeg.add(rightKnee);

    const rightLowerLegMesh = new THREE.Mesh(lowerLegGeometry, whitePlasticMaterial);
    rightLowerLegMesh.position.y = -0.22;
    rightLowerLegMesh.castShadow = true;
    this.bodyParts.rightLowerLeg.add(rightLowerLegMesh);

    this.bodyParts.rightLowerLeg.position.y = -0.5;
    this.bodyParts.rightUpperLeg.add(this.bodyParts.rightLowerLeg);

    this.bodyParts.rightFoot = new THREE.Mesh(footGeometry.clone(), blueMetalMaterial);
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
