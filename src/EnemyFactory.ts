import * as THREE from 'three';
import { Enemy, EnemyType, ChickenBot } from './types';
import { ParticleSystem } from './ParticleSystem';

export class EnemyFactory {
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public createEnemy(
    type: EnemyType,
    x: number,
    y: number,
    z: number
  ): Enemy {
    const mesh = this.createEnemyMesh(type);
    mesh.position.set(x, y, z);
    this.scene.add(mesh);

    const enemy: Enemy = {
      mesh,
      position: new THREE.Vector3(x, y, z),
      velocity: new THREE.Vector3(0, 0, 0),
      type,
      isActive: true,
      health: 1,
    };

    // Type-specific initialization
    if (type === 'spiky') {
      enemy.spikesOut = false;
      enemy.spikeTimer = 0;
    } else if (type === 'firebreather') {
      enemy.fireTimer = 0;
    } else if (type === 'pusher') {
      enemy.patrolDirection = 1;
      enemy.velocity.x = 1;
    }

    return enemy;
  }

  private createEnemyMesh(type: EnemyType): THREE.Group {
    const group = new THREE.Group();

    switch (type) {
      case 'pusher':
        return this.createPusherMesh(group);
      case 'spiky':
        return this.createSpikyMesh(group);
      case 'firebreather':
        return this.createFireBreatherMesh(group);
    }
  }

  private createPusherMesh(group: THREE.Group): THREE.Group {
    // Body - cube shape
    const bodyGeometry = new THREE.BoxGeometry(1, 1, 1);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xff4444,
      metalness: 0.4,
      roughness: 0.6,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const eyeMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xff0000,
      emissiveIntensity: 0.3,
    });
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.25, 0.2, 0.5);
    group.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.25, 0.2, 0.5);
    group.add(rightEye);

    // Pusher arms (larger)
    const armGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.8);
    const armMaterial = new THREE.MeshStandardMaterial({
      color: 0xcc3333,
      metalness: 0.5,
      roughness: 0.5,
    });
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.6, 0, 0.6);
    leftArm.castShadow = true;
    group.add(leftArm);

    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.6, 0, 0.6);
    rightArm.castShadow = true;
    group.add(rightArm);

    return group;
  }

  private createSpikyMesh(group: THREE.Group): THREE.Group {
    // Body - sphere
    const bodyGeometry = new THREE.SphereGeometry(0.6, 16, 16);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x8844ff,
      metalness: 0.3,
      roughness: 0.7,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const eyeMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xff00ff,
      emissiveIntensity: 0.3,
    });
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.2, 0.2, 0.5);
    group.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.2, 0.2, 0.5);
    group.add(rightEye);

    // Spikes (will be animated)
    const spikeGroup = new THREE.Group();
    spikeGroup.name = 'spikes';

    const spikeGeometry = new THREE.ConeGeometry(0.1, 0.5, 8);
    const spikeMaterial = new THREE.MeshStandardMaterial({
      color: 0xffff00,
      metalness: 0.8,
      roughness: 0.2,
    });

    // Create spikes around the sphere
    for (let i = 0; i < 12; i++) {
      const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
      const angle = (i / 12) * Math.PI * 2;
      const x = Math.cos(angle) * 0.6;
      const z = Math.sin(angle) * 0.6;
      spike.position.set(x, 0, z);
      spike.rotation.z = Math.PI / 2;
      spike.lookAt(x * 2, 0, z * 2);
      spike.castShadow = true;
      spikeGroup.add(spike);
    }

    // Start with spikes retracted
    spikeGroup.scale.set(0.1, 0.1, 0.1);
    group.add(spikeGroup);

    return group;
  }

  private createFireBreatherMesh(group: THREE.Group): THREE.Group {
    // Body - cylinder (dragon-like)
    const bodyGeometry = new THREE.CylinderGeometry(0.4, 0.5, 1, 16);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xff8800,
      metalness: 0.4,
      roughness: 0.6,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Head (forward-facing)
    const headGeometry = new THREE.BoxGeometry(0.6, 0.5, 0.8);
    const headMaterial = new THREE.MeshStandardMaterial({
      color: 0xff6600,
      metalness: 0.4,
      roughness: 0.6,
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0, 0.4, 0.6);
    head.castShadow = true;
    group.add(head);

    // Eyes (glowing)
    const eyeGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const eyeMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xff4400,
      emissiveIntensity: 0.8,
    });
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.2, 0.5, 0.9);
    group.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.2, 0.5, 0.9);
    group.add(rightEye);

    // Mouth/snout
    const snoutGeometry = new THREE.ConeGeometry(0.2, 0.4, 8);
    const snoutMaterial = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      metalness: 0.3,
      roughness: 0.7,
    });
    const snout = new THREE.Mesh(snoutGeometry, snoutMaterial);
    snout.position.set(0, 0.3, 1.1);
    snout.rotation.x = Math.PI / 2;
    group.add(snout);

    return group;
  }

  public createChickenBot(x: number, y: number, z: number): ChickenBot {
    const mesh = this.createChickenMesh();
    mesh.position.set(x, y, z);
    this.scene.add(mesh);

    return {
      mesh,
      position: new THREE.Vector3(x, y, z),
      isActive: true,
      followPlayer: true,
    };
  }

  private createChickenMesh(): THREE.Group {
    const group = new THREE.Group();

    // Body - egg shape
    const bodyGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    bodyGeometry.scale(1, 1.2, 0.8);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.2,
      roughness: 0.8,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Head - smaller sphere
    const headGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.2,
      roughness: 0.8,
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0, 0.7, 0);
    head.castShadow = true;
    group.add(head);

    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(0.08, 8, 8);
    const eyeMaterial = new THREE.MeshStandardMaterial({
      color: 0x000000,
    });
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.12, 0.75, 0.25);
    group.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.12, 0.75, 0.25);
    group.add(rightEye);

    // Beak
    const beakGeometry = new THREE.ConeGeometry(0.1, 0.2, 8);
    const beakMaterial = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      metalness: 0.3,
      roughness: 0.7,
    });
    const beak = new THREE.Mesh(beakGeometry, beakMaterial);
    beak.position.set(0, 0.65, 0.35);
    beak.rotation.x = Math.PI / 2;
    group.add(beak);

    // Comb (red thing on top)
    const combGeometry = new THREE.SphereGeometry(0.15, 8, 8);
    combGeometry.scale(0.5, 1, 0.5);
    const combMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      metalness: 0.2,
      roughness: 0.8,
    });
    const comb = new THREE.Mesh(combGeometry, combMaterial);
    comb.position.set(0, 0.95, 0);
    group.add(comb);

    // Wings
    const wingGeometry = new THREE.SphereGeometry(0.25, 8, 8);
    wingGeometry.scale(0.5, 0.8, 1.2);
    const wingMaterial = new THREE.MeshStandardMaterial({
      color: 0xeeeeee,
      metalness: 0.2,
      roughness: 0.8,
    });
    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.position.set(-0.45, 0.2, 0);
    leftWing.rotation.z = 0.3;
    group.add(leftWing);

    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    rightWing.position.set(0.45, 0.2, 0);
    rightWing.rotation.z = -0.3;
    group.add(rightWing);

    // Add a friendly glow
    const glowGeometry = new THREE.SphereGeometry(0.7, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.1,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    group.add(glow);

    return group;
  }

  public updateEnemy(
    enemy: Enemy,
    deltaTime: number,
    playerPosition: THREE.Vector3,
    particles: ParticleSystem
  ): void {
    if (!enemy.isActive) return;

    switch (enemy.type) {
      case 'pusher':
        this.updatePusher(enemy, deltaTime, playerPosition);
        break;
      case 'spiky':
        this.updateSpiky(enemy, deltaTime);
        break;
      case 'firebreather':
        this.updateFireBreather(enemy, deltaTime, playerPosition, particles);
        break;
    }

    // Update mesh position
    enemy.mesh.position.copy(enemy.position);
  }

  private updatePusher(
    enemy: Enemy,
    deltaTime: number,
    _playerPosition: THREE.Vector3
  ): void {
    // Patrol back and forth
    const patrolSpeed = 2;
    const patrolRange = 3;

    // Move in patrol direction
    enemy.velocity.x = (enemy.patrolDirection || 1) * patrolSpeed;
    enemy.position.x += enemy.velocity.x * deltaTime;

    // Check if we've gone too far from start position
    const distFromStart = Math.abs(enemy.position.x - enemy.mesh.position.x);
    if (distFromStart > patrolRange) {
      enemy.patrolDirection = -(enemy.patrolDirection || 1);
    }

    // Face the direction we're moving
    if (enemy.velocity.x > 0) {
      enemy.mesh.rotation.y = -Math.PI / 2;
    } else {
      enemy.mesh.rotation.y = Math.PI / 2;
    }

    // Animate arms (push motion)
    const armOffset = Math.sin(Date.now() * 0.005) * 0.2;
    const arms = enemy.mesh.children.filter((child: THREE.Object3D) => child instanceof THREE.Mesh);
    if (arms.length > 2) {
      const leftArm = arms[2] as THREE.Mesh;
      const rightArm = arms[3] as THREE.Mesh;
      if (leftArm) leftArm.position.z = 0.6 + armOffset;
      if (rightArm) rightArm.position.z = 0.6 + armOffset;
    }
  }

  private updateSpiky(enemy: Enemy, deltaTime: number): void {
    // Timer for spike animation (3 seconds cycle: 1.5s out, 1.5s in)
    enemy.spikeTimer = (enemy.spikeTimer || 0) + deltaTime;
    const cycleTime = 3;

    if (enemy.spikeTimer > cycleTime) {
      enemy.spikeTimer = 0;
      enemy.spikesOut = !enemy.spikesOut;
    }

    // Animate spikes
    const spikeGroup = enemy.mesh.children.find((child: THREE.Object3D) => child.name === 'spikes');
    if (spikeGroup) {
      const targetScale = enemy.spikesOut ? 1 : 0.1;
      const currentScale = spikeGroup.scale.x;
      const newScale = THREE.MathUtils.lerp(currentScale, targetScale, deltaTime * 3);
      spikeGroup.scale.set(newScale, newScale, newScale);
    }

    // Rotate slowly
    enemy.mesh.rotation.y += deltaTime * 0.5;
  }

  private updateFireBreather(
    enemy: Enemy,
    deltaTime: number,
    playerPosition: THREE.Vector3,
    particles: ParticleSystem
  ): void {
    // Face the player
    const directionToPlayer = new THREE.Vector3()
      .subVectors(playerPosition, enemy.position)
      .normalize();
    const angle = Math.atan2(directionToPlayer.x, directionToPlayer.z);
    enemy.mesh.rotation.y = angle;

    // Breathe fire every 2 seconds
    enemy.fireTimer = (enemy.fireTimer || 0) + deltaTime;
    if (enemy.fireTimer > 2) {
      enemy.fireTimer = 0;

      // Emit fire particles in direction of player
      const fireStartPos = enemy.position.clone();
      fireStartPos.y += 0.4; // From head height
      fireStartPos.add(directionToPlayer.clone().multiplyScalar(0.8));

      particles.emitFlame(fireStartPos, directionToPlayer);
    }

    // Bob slightly
    const bobAmount = Math.sin(Date.now() * 0.002) * 0.1;
    enemy.mesh.position.y = enemy.position.y + bobAmount;
  }

  public updateChickenBot(
    chickenBot: ChickenBot,
    deltaTime: number,
    playerPosition: THREE.Vector3
  ): void {
    if (!chickenBot.isActive || !chickenBot.followPlayer) return;

    // Follow player at a distance
    const directionToPlayer = new THREE.Vector3()
      .subVectors(playerPosition, chickenBot.position)
      .normalize();

    const distanceToPlayer = chickenBot.position.distanceTo(playerPosition);
    const followDistance = 3; // Stay 3 units behind player

    if (distanceToPlayer > followDistance) {
      const speed = 2;
      chickenBot.position.x += directionToPlayer.x * speed * deltaTime;
      chickenBot.position.z += directionToPlayer.z * speed * deltaTime;
    }

    // Face the player
    const angle = Math.atan2(directionToPlayer.x, directionToPlayer.z);
    chickenBot.mesh.rotation.y = angle;

    // Bob animation
    const bobAmount = Math.sin(Date.now() * 0.004) * 0.15;
    chickenBot.mesh.position.copy(chickenBot.position);
    chickenBot.mesh.position.y += bobAmount;

    // Flap wings
    const flapAmount = Math.sin(Date.now() * 0.008) * 0.2;
    const wings = chickenBot.mesh.children.filter((_child: THREE.Object3D, index: number) => index >= 8 && index <= 9);
    if (wings.length >= 2) {
      const leftWing = wings[0] as THREE.Mesh;
      const rightWing = wings[1] as THREE.Mesh;
      if (leftWing) leftWing.rotation.z = 0.3 + flapAmount;
      if (rightWing) rightWing.rotation.z = -0.3 - flapAmount;
    }
  }
}
