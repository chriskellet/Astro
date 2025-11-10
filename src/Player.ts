import * as THREE from 'three';
import { PlayerState, Controls, SkinDefinition, SurfaceType, CameraMode } from './types';
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
  private acceleration: number = 25; // Acceleration rate for smooth movement
  private baseFriction: number = 12; // Base deceleration when no input
  private minVelocityThreshold: number = 0.5; // Snap to zero below this velocity
  private currentSurfaceType: SurfaceType = 'default';
  private jumpForce: number = 12;
  private radius: number = 0.5;
  private height: number = 1.5;
  private camera: THREE.Camera;
  private cameraMode: CameraMode = 'traditional';
  private traditionalCameraOffset: THREE.Vector3;
  private overShoulderCameraOffset: THREE.Vector3;
  private currentPlatform: import('./types').Platform | null = null;
  private leftFootFlame!: THREE.Mesh;
  private rightFootFlame!: THREE.Mesh;
  private lastJumpState: boolean = false;
  private rocketJumpAvailable: boolean = true;
  private lastBoosterState: boolean = false;
  private rocketBoosterTime: number = 0;
  private rocketBoosterMaxTime: number = 3.0; // 3 seconds

  // Velocity-based thrust parameters
  private maxUpwardVelocity: number = 8; // Maximum upward speed (m/s)
  private fallRecoveryTime: number = 0.6; // Time to recover from fall to zero velocity (seconds)
  private riseTime: number = 0.3; // Time to accelerate to max velocity (seconds)

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
  private actualRotationSpeed: number = 0; // actual rotation speed applied (for debug)
  private lateralInputRatio: number = 1.0; // ratio of lateral to total input (for rotation scaling)

  // Idle animation system
  private idleTime: number = 0;
  private idleAnimationThreshold: number = 5; // seconds before starting idle animation
  private idleAnimationType: 'dance' | 'sit' | null = null;

  // Falling animation
  private fallingFastThreshold: number = -15; // velocity threshold for flailing animation

  constructor(physics: Physics, camera: THREE.Camera, particles: ParticleSystem, skin?: SkinDefinition) {
    this.physics = physics;
    this.camera = camera;
    this.particles = particles;
    this.skin = skin || getDefaultSkin();

    // Traditional camera: side view, elevated and pulled back
    this.traditionalCameraOffset = new THREE.Vector3(0, 8, 12);

    // Over-the-shoulder camera: directly behind and elevated
    // In player's local space: 0 right, 5 up, -7 back (negative Z to position behind player)
    this.overShoulderCameraOffset = new THREE.Vector3(0, 5, -7);

    this.state = {
      position: new THREE.Vector3(0, 7, 0),
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

  private getFrictionForSurface(surfaceType: SurfaceType): number {
    switch (surfaceType) {
      case 'ice':
        return 3; // Very slippy - slow deceleration
      case 'grass':
        return 18; // Good grip - fast deceleration
      case 'stone':
        return 15; // Good grip - moderate deceleration
      case 'default':
      default:
        return this.baseFriction; // Default friction
    }
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

    // Add Darth Vader helmet
    if (this.skin.id === 'vader') {
      // Helmet dome (glossy black)
      const helmetDomeGeometry = new THREE.SphereGeometry(0.32, 32, 32, 0, Math.PI * 2, 0, Math.PI / 1.8);
      const helmetMaterial = new THREE.MeshStandardMaterial({
        color: 0x0A0A0A,
        metalness: 0.9,
        roughness: 0.1,
      });
      const helmetDome = new THREE.Mesh(helmetDomeGeometry, helmetMaterial);
      helmetDome.position.set(0, 0.35, 0);
      helmetDome.castShadow = true;
      this.bodyParts.head.add(helmetDome);

      // Face mask (dark gray front plate)
      const faceMaskGeometry = new THREE.BoxGeometry(0.28, 0.32, 0.12);
      const faceMaskMaterial = new THREE.MeshStandardMaterial({
        color: 0x1C1C1C,
        metalness: 0.8,
        roughness: 0.3,
      });
      const faceMask = new THREE.Mesh(faceMaskGeometry, faceMaskMaterial);
      faceMask.position.set(0, 0.15, 0.3);
      faceMask.castShadow = true;
      this.bodyParts.head.add(faceMask);

      // Breathing apparatus (triangular nose piece)
      const breathingGeometry = new THREE.ConeGeometry(0.08, 0.15, 3);
      const breathingMaterial = new THREE.MeshStandardMaterial({
        color: 0x2C2C2C,
        metalness: 0.7,
        roughness: 0.4,
      });
      const breathing = new THREE.Mesh(breathingGeometry, breathingMaterial);
      breathing.position.set(0, 0.1, 0.36);
      breathing.rotation.x = Math.PI / 2;
      breathing.castShadow = true;
      this.bodyParts.head.add(breathing);

      // Red eyes (glowing)
      const eyeGeometry = new THREE.CircleGeometry(0.04, 12);
      const eyeMaterial = new THREE.MeshStandardMaterial({
        color: 0xFF0000,
        emissive: 0xFF0000,
        emissiveIntensity: 0.8,
      });
      const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      leftEye.position.set(-0.08, 0.2, 0.35);
      this.bodyParts.head.add(leftEye);
      const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      rightEye.position.set(0.08, 0.2, 0.35);
      this.bodyParts.head.add(rightEye);
    }

    // Add Stormtrooper helmet
    if (this.skin.id === 'stormtrooper') {
      // Helmet dome (white)
      const helmetDomeGeometry = new THREE.SphereGeometry(0.32, 32, 32, 0, Math.PI * 2, 0, Math.PI / 1.8);
      const helmetMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFFFFF,
        metalness: 0.3,
        roughness: 0.4,
      });
      const helmetDome = new THREE.Mesh(helmetDomeGeometry, helmetMaterial);
      helmetDome.position.set(0, 0.35, 0);
      helmetDome.castShadow = true;
      this.bodyParts.head.add(helmetDome);

      // Face plate (white)
      const facePlateGeometry = new THREE.BoxGeometry(0.28, 0.3, 0.1);
      const facePlate = new THREE.Mesh(facePlateGeometry, helmetMaterial);
      facePlate.position.set(0, 0.15, 0.3);
      facePlate.castShadow = true;
      this.bodyParts.head.add(facePlate);

      // Black visor (eyes area)
      const visorGeometry = new THREE.BoxGeometry(0.24, 0.08, 0.02);
      const visorMaterial = new THREE.MeshStandardMaterial({
        color: 0x000000,
        metalness: 0.8,
        roughness: 0.2,
      });
      const visor = new THREE.Mesh(visorGeometry, visorMaterial);
      visor.position.set(0, 0.2, 0.35);
      visor.castShadow = true;
      this.bodyParts.head.add(visor);

      // Breathing filters (small black boxes on sides)
      const filterGeometry = new THREE.BoxGeometry(0.06, 0.1, 0.08);
      const filterMaterial = new THREE.MeshStandardMaterial({
        color: 0x303030,
        metalness: 0.5,
        roughness: 0.6,
      });
      const leftFilter = new THREE.Mesh(filterGeometry, filterMaterial);
      leftFilter.position.set(-0.18, 0.1, 0.32);
      leftFilter.castShadow = true;
      this.bodyParts.head.add(leftFilter);
      const rightFilter = new THREE.Mesh(filterGeometry, filterMaterial);
      rightFilter.position.set(0.18, 0.1, 0.32);
      rightFilter.castShadow = true;
      this.bodyParts.head.add(rightFilter);
    }

    // Add Boba Fett helmet
    if (this.skin.id === 'bobafett') {
      // Helmet dome (green/tan)
      const helmetDomeGeometry = new THREE.SphereGeometry(0.32, 32, 32, 0, Math.PI * 2, 0, Math.PI / 1.8);
      const helmetMaterial = new THREE.MeshStandardMaterial({
        color: 0x4A7C59,
        metalness: 0.6,
        roughness: 0.4,
      });
      const helmetDome = new THREE.Mesh(helmetDomeGeometry, helmetMaterial);
      helmetDome.position.set(0, 0.35, 0);
      helmetDome.castShadow = true;
      this.bodyParts.head.add(helmetDome);

      // Face plate (tan/brown)
      const facePlateGeometry = new THREE.BoxGeometry(0.26, 0.28, 0.1);
      const facePlateMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B7355,
        metalness: 0.5,
        roughness: 0.5,
      });
      const facePlate = new THREE.Mesh(facePlateGeometry, facePlateMaterial);
      facePlate.position.set(0, 0.15, 0.3);
      facePlate.castShadow = true;
      this.bodyParts.head.add(facePlate);

      // T-shaped visor (black/red tint)
      const visorVerticalGeometry = new THREE.BoxGeometry(0.04, 0.18, 0.02);
      const visorMaterial = new THREE.MeshStandardMaterial({
        color: 0x2A0000,
        metalness: 0.9,
        roughness: 0.1,
        emissive: 0xFF4500,
        emissiveIntensity: 0.3,
      });
      const visorVertical = new THREE.Mesh(visorVerticalGeometry, visorMaterial);
      visorVertical.position.set(0, 0.18, 0.35);
      visorVertical.castShadow = true;
      this.bodyParts.head.add(visorVertical);

      const visorHorizontalGeometry = new THREE.BoxGeometry(0.18, 0.04, 0.02);
      const visorHorizontal = new THREE.Mesh(visorHorizontalGeometry, visorMaterial);
      visorHorizontal.position.set(0, 0.22, 0.35);
      visorHorizontal.castShadow = true;
      this.bodyParts.head.add(visorHorizontal);

      // Rangefinder antenna (small cylindrical antenna on side)
      const rangefinderGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.15, 8);
      const rangefinderMaterial = new THREE.MeshStandardMaterial({
        color: 0xD4AF37,
        metalness: 1.0,
        roughness: 0.2,
      });
      const rangefinder = new THREE.Mesh(rangefinderGeometry, rangefinderMaterial);
      rangefinder.position.set(0.25, 0.25, 0.1);
      rangefinder.rotation.z = Math.PI / 2;
      rangefinder.castShadow = true;
      this.bodyParts.head.add(rangefinder);
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
    // Check if any input is active (for idle animation tracking)
    const hasInput = controls.left || controls.right || controls.forward ||
                     controls.backward || controls.jump || controls.booster;

    // Apply movement with acceleration
    const moveVector = new THREE.Vector3();

    if (this.cameraMode === 'traditional') {
      // Traditional mode: world-space controls
      if (controls.left) moveVector.x -= 1;
      if (controls.right) moveVector.x += 1;
      if (controls.forward) moveVector.z -= 1;
      if (controls.backward) moveVector.z += 1;
    } else {
      // Over-the-shoulder mode: analog stick controls
      if (controls.analogMagnitude > 0) {
        // Get camera's forward direction (projected onto XZ plane)
        const cameraForward = new THREE.Vector3();
        this.camera.getWorldDirection(cameraForward);
        cameraForward.y = 0; // Project onto horizontal plane
        cameraForward.normalize();

        // Calculate camera's right direction
        const cameraRight = new THREE.Vector3();
        cameraRight.crossVectors(cameraForward, new THREE.Vector3(0, 1, 0));
        cameraRight.normalize();

        // Convert analog stick angle to camera-relative direction
        // Analog angle: 0 = right, π/2 = down, π = left, -π/2 = up
        // We need: up = forward, down = backward, right = right, left = left
        const stickX = Math.cos(controls.analogAngle);
        const stickY = Math.sin(controls.analogAngle);

        // Calculate lateral input ratio for rotation scaling
        // When pushing mostly forward/back (low stickX), rotation should be slower
        // When pushing left/right (high stickX), rotation should be faster
        this.lateralInputRatio = Math.abs(stickX);

        // Map stick Y (up/down) to camera forward/backward
        // Negative stickY (up on screen) = forward
        moveVector.x += -stickY * cameraForward.x;
        moveVector.z += -stickY * cameraForward.z;

        // Map stick X (left/right) to camera right/left
        moveVector.x += stickX * cameraRight.x;
        moveVector.z += stickX * cameraRight.z;
      } else {
        // No input - reset lateral ratio to 1.0 for normal rotation when stopped
        this.lateralInputRatio = 1.0;
      }
    }

    if (moveVector.length() > 0) {
      moveVector.normalize();

      // Always update target rotation based on stick direction
      this.targetRotationY = Math.atan2(moveVector.x, moveVector.z);

      // Only apply movement if magnitude is above threshold
      // This allows rotation without movement for fine adjustments
      const movementThreshold = this.cameraMode === 'over-shoulder' ? 0.15 : 0.0;

      if (controls.analogMagnitude > movementThreshold || this.cameraMode === 'traditional') {
        // Calculate target velocity
        // In over-the-shoulder mode, apply analog magnitude for variable speed
        const speedMultiplier = this.cameraMode === 'over-shoulder'
          ? controls.analogMagnitude
          : 1.0;
        const targetVelocityX = moveVector.x * this.moveSpeed * speedMultiplier;
        const targetVelocityZ = moveVector.z * this.moveSpeed * speedMultiplier;

        if (this.cameraMode === 'over-shoulder') {
          // Over-shoulder mode: Direct velocity response (analog stick already provides smoothing)
          // Use high lerp factor for immediate response
          this.state.velocity.x = THREE.MathUtils.lerp(this.state.velocity.x, targetVelocityX, 0.3);
          this.state.velocity.z = THREE.MathUtils.lerp(this.state.velocity.z, targetVelocityZ, 0.3);
        } else {
          // Traditional mode: Smoothly accelerate towards target velocity
          const accelerationStep = this.acceleration * deltaTime;
          this.state.velocity.x += Math.sign(targetVelocityX - this.state.velocity.x) *
            Math.min(Math.abs(targetVelocityX - this.state.velocity.x), accelerationStep);
          this.state.velocity.z += Math.sign(targetVelocityZ - this.state.velocity.z) *
            Math.min(Math.abs(targetVelocityZ - this.state.velocity.z), accelerationStep);
        }
      } else {
        // Below movement threshold - apply friction (allows rotation without movement)
        const friction = this.getFrictionForSurface(this.currentSurfaceType);
        const frictionStep = friction * deltaTime;

        if (Math.abs(this.state.velocity.x) < this.minVelocityThreshold) {
          this.state.velocity.x = 0;
        } else if (Math.abs(this.state.velocity.x) > frictionStep) {
          this.state.velocity.x -= Math.sign(this.state.velocity.x) * frictionStep;
        } else {
          this.state.velocity.x = 0;
        }

        if (Math.abs(this.state.velocity.z) < this.minVelocityThreshold) {
          this.state.velocity.z = 0;
        } else if (Math.abs(this.state.velocity.z) > frictionStep) {
          this.state.velocity.z -= Math.sign(this.state.velocity.z) * frictionStep;
        } else {
          this.state.velocity.z = 0;
        }
      }
    } else {
      // Apply non-linear friction to decelerate based on surface type
      const friction = this.getFrictionForSurface(this.currentSurfaceType);
      const frictionStep = friction * deltaTime;

      // X-axis friction with velocity threshold for snappy stopping
      if (Math.abs(this.state.velocity.x) < this.minVelocityThreshold) {
        // Below threshold - snap to zero for responsive stopping
        this.state.velocity.x = 0;
      } else if (Math.abs(this.state.velocity.x) > frictionStep) {
        this.state.velocity.x -= Math.sign(this.state.velocity.x) * frictionStep;
      } else {
        this.state.velocity.x = 0;
      }

      // Z-axis friction with velocity threshold for snappy stopping
      if (Math.abs(this.state.velocity.z) < this.minVelocityThreshold) {
        // Below threshold - snap to zero for responsive stopping
        this.state.velocity.z = 0;
      } else if (Math.abs(this.state.velocity.z) > frictionStep) {
        this.state.velocity.z -= Math.sign(this.state.velocity.z) * frictionStep;
      } else {
        this.state.velocity.z = 0;
      }
    }

    // Smoothly interpolate rotation towards target
    this.updateRotation(deltaTime, controls);

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
      platforms,
      this.currentPlatform
    );

    this.state.isJumping = !collision.grounded;

    // Update current platform and surface type
    this.currentPlatform = collision.platform;
    this.currentSurfaceType = collision.surfaceType || 'default';

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
    }

    // Continue applying thrust while booster button is held and rocket jump is active
    if (controls.booster && this.state.isBoosterActive) {
      // Update booster time
      this.rocketBoosterTime += deltaTime;

      // Calculate thrust multiplier based on time remaining
      let thrustMultiplier = 1.0;
      if (this.rocketBoosterTime >= this.rocketBoosterMaxTime) {
        // Booster time expired - create splutter effect
        this.state.isBoosterActive = false;
        thrustMultiplier = 0;
      } else if (this.rocketBoosterTime >= this.rocketBoosterMaxTime - 0.5) {
        // Last 0.5 seconds - splutter with random thrust
        thrustMultiplier = Math.random() * 0.3;
      }

      // PID-style velocity controller for smooth, controlled flight
      const gravity = 25; // Magnitude of gravity (matches Physics.ts)

      // Always target max upward velocity for consistent behavior
      const targetVelocity = this.maxUpwardVelocity;

      // Use different response times based on current state
      let timeToTarget;
      if (this.state.velocity.y < 0) {
        // Falling - use recovery time to get to target velocity
        timeToTarget = this.fallRecoveryTime;
      } else {
        // Rising - use rise time to reach/maintain target velocity
        timeToTarget = this.riseTime;
      }

      // Calculate acceleration needed to reach target velocity
      const velocityError = targetVelocity - this.state.velocity.y;
      const requiredAcceleration = velocityError / timeToTarget;

      // Total thrust = required acceleration + gravity compensation
      const thrust = requiredAcceleration + gravity;

      // Clamp thrust to reasonable bounds (prevent extreme values)
      const clampedThrust = Math.max(0, Math.min(100, thrust));

      // Apply upward thrust
      this.state.velocity.y += clampedThrust * deltaTime * thrustMultiplier;

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
        // Emit smoke with player velocity for trailing effect (reduced count)
        if (Math.random() > 0.3) { // Only emit 70% of the time to reduce density
          this.particles.emitSmoke(leftFootPos, 1, this.state.velocity);
        }
        if (Math.random() > 0.3) {
          this.particles.emitSmoke(rightFootPos, 1, this.state.velocity);
        }
      } else {
        // Spluttering - less smoke
        if (Math.random() > 0.5) { // Only emit 50% of the time when spluttering
          this.particles.emitSmoke(leftFootPos, 1, this.state.velocity);
          this.particles.emitSmoke(rightFootPos, 1, this.state.velocity);
        }
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
    this.physics.checkBoundary(this.state.position, 250);

    // Update mesh position with vertical offset so feet sit on ground
    this.mesh.position.copy(this.state.position);
    this.mesh.position.y += 0.75; // Offset to prevent feet sinking into ground

    // Track idle time for idle animations
    if (!hasInput && collision.grounded && !this.state.isJumping) {
      this.idleTime += deltaTime;

      // Start idle animation after threshold
      if (this.idleTime >= this.idleAnimationThreshold && this.idleAnimationType === null) {
        // Randomly choose between dance and sit
        this.idleAnimationType = Math.random() > 0.5 ? 'dance' : 'sit';
      }
    } else {
      // Reset idle animation when there's input or not grounded
      this.idleTime = 0;
      this.idleAnimationType = null;
    }

    // Professional animation system
    this.updateAnimations(deltaTime, moveVector);

    // Update camera
    this.updateCamera();
  }

  private updateAnimations(deltaTime: number, moveVector: THREE.Vector3): void {
    this.animationTime += deltaTime;
    this.isWalking = moveVector.length() > 0;

    // Check if falling fast for flailing animation
    const isFallingFast = this.state.velocity.y < this.fallingFastThreshold;

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

      if (this.idleAnimationType === 'dance') {
        // ===== DANCE ANIMATION =====
        const danceSpeed = this.animationTime * 4;
        const danceBeat = Math.sin(danceSpeed);
        const danceBeat2 = Math.sin(danceSpeed * 2);

        // Bouncing motion
        const bounce = Math.abs(Math.sin(danceSpeed * 2)) * 0.15;
        this.mesh.position.y += bounce;

        // Arms move up and down with rhythm
        this.bodyParts.leftUpperArm.rotation.z = -0.5 + danceBeat * 0.8;
        this.bodyParts.rightUpperArm.rotation.z = 0.5 - danceBeat * 0.8;
        this.bodyParts.leftUpperArm.rotation.x = -0.3 + Math.abs(danceBeat) * 0.5;
        this.bodyParts.rightUpperArm.rotation.x = -0.3 + Math.abs(danceBeat) * 0.5;

        // Lower arms bend with the beat
        this.bodyParts.leftLowerArm.rotation.x = Math.abs(danceBeat) * 0.8;
        this.bodyParts.rightLowerArm.rotation.x = Math.abs(danceBeat) * 0.8;

        // Legs alternate lifting slightly
        this.bodyParts.leftUpperLeg.rotation.x = danceBeat2 * 0.3;
        this.bodyParts.rightUpperLeg.rotation.x = -danceBeat2 * 0.3;
        this.bodyParts.leftLowerLeg.rotation.x = Math.max(0, danceBeat2 * 0.4);
        this.bodyParts.rightLowerLeg.rotation.x = Math.max(0, -danceBeat2 * 0.4);

        // Torso sways side to side
        this.bodyParts.torso.rotation.z = Math.sin(danceSpeed) * 0.15;
        this.bodyParts.torso.rotation.y = Math.cos(danceSpeed * 0.5) * 0.2;

        // Head bobs with the music
        this.bodyParts.head.rotation.y = Math.sin(danceSpeed * 1.5) * 0.2;
        this.bodyParts.head.position.y = 0.65 + bounce;

      } else if (this.idleAnimationType === 'sit') {
        // ===== SIT ANIMATION =====
        // Transition smoothly to sitting pose
        const sitTransition = Math.min(1, (this.idleTime - this.idleAnimationThreshold) * 2);

        // Lower body position (sitting down)
        const sitHeight = sitTransition * -0.5;
        this.mesh.position.y += sitHeight;

        // Legs bent in sitting position
        this.bodyParts.leftUpperLeg.rotation.x = THREE.MathUtils.lerp(0, 1.3, sitTransition);
        this.bodyParts.rightUpperLeg.rotation.x = THREE.MathUtils.lerp(0, 1.3, sitTransition);
        this.bodyParts.leftLowerLeg.rotation.x = THREE.MathUtils.lerp(0, 1.4, sitTransition);
        this.bodyParts.rightLowerLeg.rotation.x = THREE.MathUtils.lerp(0, 1.4, sitTransition);

        // Legs spread slightly
        this.bodyParts.leftUpperLeg.rotation.z = -0.2 * sitTransition;
        this.bodyParts.rightUpperLeg.rotation.z = 0.2 * sitTransition;

        // Feet flat on ground
        this.bodyParts.leftFoot.rotation.x = -0.3 * sitTransition;
        this.bodyParts.rightFoot.rotation.x = -0.3 * sitTransition;

        // Arms resting on legs or ground
        this.bodyParts.leftUpperArm.rotation.x = THREE.MathUtils.lerp(0, 0.8, sitTransition);
        this.bodyParts.rightUpperArm.rotation.x = THREE.MathUtils.lerp(0, 0.8, sitTransition);
        this.bodyParts.leftLowerArm.rotation.x = 0.5 * sitTransition;
        this.bodyParts.rightLowerArm.rotation.x = 0.5 * sitTransition;

        // Torso slightly forward
        this.bodyParts.torso.rotation.x = 0.2 * sitTransition;

        // Head looking around lazily when fully sitting
        if (sitTransition >= 0.9) {
          this.bodyParts.head.rotation.y = Math.sin(this.animationTime * 0.5) * 0.3;
          this.bodyParts.head.rotation.x = Math.sin(this.animationTime * 0.3) * 0.15;
        }

        // Gentle breathing
        const breathingCycle = Math.sin(this.animationTime * 1.5) * 0.02;
        this.bodyParts.torso.scale.y = 1 + breathingCycle;

      } else {
        // ===== DEFAULT IDLE (Standing) =====
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
    }

    // ===== JUMPING ANIMATION =====
    if (this.state.isJumping && !isFallingFast) {
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

    // ===== FALLING/FLAILING ANIMATION =====
    // When falling fast, character flails arms and legs wildly
    if (isFallingFast && !this.state.isBoosterActive) {
      // Fast chaotic arm windmilling
      const flailSpeed = this.animationTime * 15;
      const leftArmFlail = Math.sin(flailSpeed);
      const rightArmFlail = Math.sin(flailSpeed + Math.PI);

      // Arms windmill in opposite directions
      this.bodyParts.leftUpperArm.rotation.x = leftArmFlail * 1.8;
      this.bodyParts.rightUpperArm.rotation.x = rightArmFlail * 1.8;
      this.bodyParts.leftUpperArm.rotation.z = Math.cos(flailSpeed) * 0.8;
      this.bodyParts.rightUpperArm.rotation.z = -Math.cos(flailSpeed) * 0.8;

      // Lower arms also flail
      this.bodyParts.leftLowerArm.rotation.x = Math.abs(leftArmFlail) * 0.6;
      this.bodyParts.rightLowerArm.rotation.x = Math.abs(rightArmFlail) * 0.6;

      // Legs kick wildly
      const legFlailSpeed = this.animationTime * 12;
      this.bodyParts.leftUpperLeg.rotation.x = Math.sin(legFlailSpeed) * 1.2;
      this.bodyParts.rightUpperLeg.rotation.x = Math.sin(legFlailSpeed + Math.PI) * 1.2;
      this.bodyParts.leftLowerLeg.rotation.x = Math.max(0, Math.sin(legFlailSpeed)) * 1.5;
      this.bodyParts.rightLowerLeg.rotation.x = Math.max(0, Math.sin(legFlailSpeed + Math.PI)) * 1.5;

      // Slight leg spread
      this.bodyParts.leftUpperLeg.rotation.z = -0.3;
      this.bodyParts.rightUpperLeg.rotation.z = 0.3;

      // Torso tilts back and forth
      this.bodyParts.torso.rotation.x = Math.sin(flailSpeed * 0.8) * 0.3;
      this.bodyParts.torso.rotation.z = Math.cos(flailSpeed * 0.6) * 0.2;

      // Head looks around frantically
      this.bodyParts.head.rotation.x = Math.sin(flailSpeed * 1.2) * 0.3;
      this.bodyParts.head.rotation.y = Math.cos(flailSpeed * 0.9) * 0.4;
    }

    // ===== ROCKET BOOST ANIMATION (Iron Man Style) =====
    if (this.state.isBoosterActive) {
      // Arms back and slightly out during boost (Iron Man flying pose)
      this.bodyParts.leftUpperArm.rotation.z = 0.4;
      this.bodyParts.rightUpperArm.rotation.z = -0.4;
      this.bodyParts.leftUpperArm.rotation.x = 0.8; // Arms back
      this.bodyParts.rightUpperArm.rotation.x = 0.8;

      // Lower arms angled back
      this.bodyParts.leftLowerArm.rotation.x = -0.3;
      this.bodyParts.rightLowerArm.rotation.x = -0.3;

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

      // Forward lean (Iron Man style)
      this.bodyParts.torso.rotation.x = 0.3;

      // Head look forward/slightly up
      this.bodyParts.head.rotation.x = -0.1;
    } else if (!this.state.isJumping && !this.isWalking) {
      // Reset boost pose
      this.bodyParts.leftUpperLeg.rotation.z *= 0.95;
      this.bodyParts.rightUpperLeg.rotation.z *= 0.95;
      this.bodyParts.head.rotation.x *= 0.95;
    }
  }

  private updateRotation(deltaTime: number, controls: Controls): void {
    // In over-shoulder mode with mouse input, apply direct rotation from mouse
    if (this.cameraMode === 'over-shoulder' && controls.mouseRotationDelta !== 0) {
      // Apply mouse rotation directly for instant camera control
      this.mesh.rotation.y += controls.mouseRotationDelta;

      // Update target rotation to match current rotation
      this.targetRotationY = this.mesh.rotation.y;

      // Store rotation speed for debug display
      this.actualRotationSpeed = Math.abs(controls.mouseRotationDelta) / deltaTime;
    } else {
      // Standard rotation logic (keyboard/touch controls)
      // Calculate the shortest rotation difference
      let rotationDiff = this.targetRotationY - this.mesh.rotation.y;

      // Normalize the angle difference to [-π, π] to take the shortest path
      while (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
      while (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;

      // Smoothly interpolate rotation
      // Use slower rotation speed in over-the-shoulder mode to prevent dizziness
      let rotationSpeed = this.cameraMode === 'over-shoulder' ? 4 : this.rotationSpeed;

      // In over-the-shoulder mode, apply analog magnitude and lateral input scaling
      if (this.cameraMode === 'over-shoulder') {
        // Scale by magnitude (how far stick is pushed)
        rotationSpeed *= controls.analogMagnitude;

        // Scale by lateral input ratio (how much turning vs forward movement)
        // Straight forward = slow turn, diagonal = medium turn, pure lateral = fast turn
        rotationSpeed *= this.lateralInputRatio;
      }

      // Store actual rotation speed for debug display
      this.actualRotationSpeed = rotationSpeed;

      const maxRotationStep = rotationSpeed * deltaTime;

      if (Math.abs(rotationDiff) < maxRotationStep) {
        // Close enough, snap to target
        this.mesh.rotation.y = this.targetRotationY;
      } else {
        // Rotate towards target at constant speed
        this.mesh.rotation.y += Math.sign(rotationDiff) * maxRotationStep;
      }
    }

    // Normalize final rotation to [-π, π]
    while (this.mesh.rotation.y > Math.PI) this.mesh.rotation.y -= Math.PI * 2;
    while (this.mesh.rotation.y < -Math.PI) this.mesh.rotation.y += Math.PI * 2;
  }

  private updateCamera(): void {
    if (this.cameraMode === 'traditional') {
      // Traditional mode: fixed world-space offset, look at player
      const targetPosition = this.state.position.clone().add(this.traditionalCameraOffset);
      this.camera.position.lerp(targetPosition, 0.1);
      this.camera.lookAt(this.state.position);
    } else {
      // Over-the-shoulder mode: rotate offset with player to stay behind them
      // Rotate the camera offset based on player's current rotation
      const rotatedOffset = this.overShoulderCameraOffset.clone();
      rotatedOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.mesh.rotation.y);

      const targetPosition = this.state.position.clone().add(rotatedOffset);
      // Faster lerp to reduce jitter and lag (0.25 instead of 0.1)
      this.camera.position.lerp(targetPosition, 0.25);

      // Look at player's head/upper body
      const lookTarget = this.state.position.clone();
      lookTarget.y += 1.2; // Look at head level
      this.camera.lookAt(lookTarget);
    }
  }

  public toggleCameraMode(): void {
    this.cameraMode = this.cameraMode === 'traditional' ? 'over-shoulder' : 'traditional';
  }

  public getCameraMode(): CameraMode {
    return this.cameraMode;
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

  public getDebugInfo(): { rotationSpeed: number; forwardSpeed: number; lateralSpeed: number } {
    // Return the actual rotation speed that was applied in the last update
    return {
      rotationSpeed: this.actualRotationSpeed,
      forwardSpeed: this.state.velocity.z,
      lateralSpeed: this.state.velocity.x,
    };
  }
}
