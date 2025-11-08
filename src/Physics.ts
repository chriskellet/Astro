import * as THREE from 'three';
import { Platform } from './types';

export class Physics {
  private gravity: number = -25;
  private terminalVelocity: number = -30;

  public applyGravity(velocity: THREE.Vector3, deltaTime: number): void {
    velocity.y += this.gravity * deltaTime;
    velocity.y = Math.max(velocity.y, this.terminalVelocity);
  }

  public checkPlatformCollision(
    position: THREE.Vector3,
    velocity: THREE.Vector3,
    playerRadius: number,
    playerHeight: number,
    platforms: Platform[],
    previousPlatform: Platform | null = null
  ): { grounded: boolean; platform: Platform | null } {
    let grounded = false;
    let groundPlatform: Platform | null = null;

    for (const platform of platforms) {
      // Skip platforms that are falling and invisible
      if (platform.type === 'falling' && platform.isFalling && platform.mesh.visible === false) {
        continue;
      }

      const collision = this.checkBoxCollision(
        position,
        new THREE.Vector3(playerRadius * 2, playerHeight, playerRadius * 2),
        platform.position,
        platform.size
      );

      if (collision) {
        // Determine collision side
        const playerBottom = position.y - playerHeight / 2;
        const playerTop = position.y + playerHeight / 2;
        const platformTop = platform.position.y + platform.size.y / 2;
        const platformBottom = platform.position.y - platform.size.y / 2;

        // Vertical collision (landing on platform)
        if (velocity.y <= 0 && playerBottom <= platformTop && playerBottom >= platformTop - 0.5) {
          position.y = platformTop + playerHeight / 2;
          velocity.y = 0;
          grounded = true;
          groundPlatform = platform;

          // Handle special platform types
          this.handlePlatformSpecialBehavior(platform, velocity);
        }
        // Hit platform from below
        else if (velocity.y > 0 && playerTop >= platformBottom && playerTop <= platformBottom + 0.5) {
          position.y = platformBottom - playerHeight / 2;
          velocity.y = 0;
        }
        // Horizontal collision
        else {
          const dx = position.x - platform.position.x;
          const dz = position.z - platform.position.z;

          if (Math.abs(dx) > Math.abs(dz)) {
            // Collision on X axis
            if (dx > 0) {
              position.x = platform.position.x + platform.size.x / 2 + playerRadius;
            } else {
              position.x = platform.position.x - platform.size.x / 2 - playerRadius;
            }
            velocity.x = 0;
          } else {
            // Collision on Z axis
            if (dz > 0) {
              position.z = platform.position.z + platform.size.z / 2 + playerRadius;
            } else {
              position.z = platform.position.z - platform.size.z / 2 - playerRadius;
            }
            velocity.z = 0;
          }
        }
      }
    }

    // If player is on a moving/elevator platform, move with it
    if (grounded && groundPlatform && previousPlatform === groundPlatform) {
      if (groundPlatform.type === 'elevator' || groundPlatform.type === 'moving') {
        this.applyPlatformMovement(position, groundPlatform);
      }
    }

    return { grounded, platform: groundPlatform };
  }

  private applyPlatformMovement(position: THREE.Vector3, platform: Platform): void {
    if (!platform.moveDirection || !platform.moveSpeed || !platform.moveStartPos || platform.moveRange === undefined) {
      return;
    }

    // Calculate platform's current velocity based on sine wave motion
    const progress = platform.moveProgress || 0;
    const velocity = Math.cos(progress) * platform.moveSpeed * platform.moveRange;

    // Apply platform movement to player
    position.x += platform.moveDirection.x * velocity * 0.016; // Approximate deltaTime
    position.y += platform.moveDirection.y * velocity * 0.016;
    position.z += platform.moveDirection.z * velocity * 0.016;
  }

  private handlePlatformSpecialBehavior(platform: Platform, velocity: THREE.Vector3): void {
    switch (platform.type) {
      case 'spring':
        // Launch player upward
        if (!platform.compressed && platform.springForce) {
          velocity.y = platform.springForce;
          platform.compressed = true;
        }
        break;

      case 'falling':
        // Trigger falling after delay
        if (!platform.isFalling && platform.fallTimer !== undefined) {
          platform.fallTimer += 0.016; // Approximate deltaTime
          if (platform.fallTimer > (platform.fallDelay || 0.5)) {
            platform.isFalling = true;
          }
        }
        break;
    }
  }

  private checkBoxCollision(
    pos1: THREE.Vector3,
    size1: THREE.Vector3,
    pos2: THREE.Vector3,
    size2: THREE.Vector3
  ): boolean {
    return (
      Math.abs(pos1.x - pos2.x) < (size1.x + size2.x) / 2 &&
      Math.abs(pos1.y - pos2.y) < (size1.y + size2.y) / 2 &&
      Math.abs(pos1.z - pos2.z) < (size1.z + size2.z) / 2
    );
  }

  public checkSphereCollision(
    pos1: THREE.Vector3,
    radius1: number,
    pos2: THREE.Vector3,
    radius2: number
  ): boolean {
    const distance = pos1.distanceTo(pos2);
    return distance < radius1 + radius2;
  }

  public checkBoundary(position: THREE.Vector3, boundary: number): void {
    // Keep player within level boundaries
    if (position.x < -boundary) position.x = -boundary;
    if (position.x > boundary) position.x = boundary;
    if (position.z < -boundary) position.z = -boundary;
    if (position.z > boundary) position.z = boundary;

    // Death plane
    if (position.y < -50) {
      position.set(0, 10, 0);
    }
  }
}
