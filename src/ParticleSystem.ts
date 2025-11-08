import * as THREE from 'three';

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  lifetime: number;
  maxLifetime: number;
  size: number;
  color: THREE.Color;
}

export class ParticleSystem {
  private scene: THREE.Scene;
  private particles: Particle[] = [];
  private particleMeshes: THREE.Mesh[] = [];
  private maxParticles: number = 100;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public emitFlame(position: THREE.Vector3, directionOrCount?: THREE.Vector3 | number, count: number = 3): void {
    // Handle overloaded parameter
    let direction: THREE.Vector3 | undefined;
    let particleCount = count;

    if (typeof directionOrCount === 'number') {
      // Old signature: emitFlame(position, count)
      particleCount = directionOrCount;
      direction = undefined;
    } else if (directionOrCount instanceof THREE.Vector3) {
      // New signature: emitFlame(position, direction, count)
      direction = directionOrCount;
    }

    for (let i = 0; i < particleCount; i++) {
      let velocity: THREE.Vector3;

      if (direction) {
        // Fire breather - emit in direction
        const spread = 0.3;
        velocity = direction.clone().multiplyScalar(5 + Math.random() * 3);
        velocity.x += (Math.random() - 0.5) * spread;
        velocity.y += (Math.random() - 0.5) * spread;
        velocity.z += (Math.random() - 0.5) * spread;
      } else {
        // Rocket flames - emit downward
        velocity = new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          -8 + Math.random() * 2,
          (Math.random() - 0.5) * 2
        );
      }

      const particle: Particle = {
        position: position.clone(),
        velocity,
        lifetime: 0,
        maxLifetime: 0.3 + Math.random() * 0.2,
        size: 0.15 + Math.random() * 0.1,
        color: new THREE.Color().setHSL(0.05 + Math.random() * 0.1, 1, 0.5 + Math.random() * 0.3),
      };

      this.particles.push(particle);
      this.createParticleMesh(particle);
    }

    this.cleanupExcess();
  }

  public emitSmoke(position: THREE.Vector3, count: number = 2): void {
    for (let i = 0; i < count; i++) {
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 1,
        -3 + Math.random() * 1,
        (Math.random() - 0.5) * 1
      );

      const particle: Particle = {
        position: position.clone(),
        velocity,
        lifetime: 0,
        maxLifetime: 0.5 + Math.random() * 0.3,
        size: 0.2 + Math.random() * 0.15,
        color: new THREE.Color(0.7, 0.7, 0.7),
      };

      this.particles.push(particle);
      this.createParticleMesh(particle);
    }

    this.cleanupExcess();
  }

  public emitCollectEffect(position: THREE.Vector3, count: number = 10): void {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = 3 + Math.random() * 2;
      const velocity = new THREE.Vector3(
        Math.cos(angle) * speed,
        2 + Math.random() * 3,
        Math.sin(angle) * speed
      );

      const particle: Particle = {
        position: position.clone(),
        velocity,
        lifetime: 0,
        maxLifetime: 0.4 + Math.random() * 0.3,
        size: 0.1 + Math.random() * 0.05,
        color: new THREE.Color(1, 0.9, 0),
      };

      this.particles.push(particle);
      this.createParticleMesh(particle);
    }

    this.cleanupExcess();
  }

  public emitDeathEffect(position: THREE.Vector3): void {
    for (let i = 0; i < 30; i++) {
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        Math.random() * 8,
        (Math.random() - 0.5) * 8
      );

      const particle: Particle = {
        position: position.clone(),
        velocity,
        lifetime: 0,
        maxLifetime: 0.6 + Math.random() * 0.4,
        size: 0.15 + Math.random() * 0.1,
        color: new THREE.Color().setHSL(0.6, 0.8, 0.5),
      };

      this.particles.push(particle);
      this.createParticleMesh(particle);
    }
  }

  public emitEnemyDefeatedEffect(position: THREE.Vector3, color: THREE.Color): void {
    for (let i = 0; i < 20; i++) {
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 6,
        Math.random() * 6,
        (Math.random() - 0.5) * 6
      );

      const particle: Particle = {
        position: position.clone(),
        velocity,
        lifetime: 0,
        maxLifetime: 0.5 + Math.random() * 0.3,
        size: 0.12 + Math.random() * 0.08,
        color: color.clone(),
      };

      this.particles.push(particle);
      this.createParticleMesh(particle);
    }
  }

  private createParticleMesh(particle: Particle): void {
    const geometry = new THREE.SphereGeometry(particle.size, 8, 8);
    const material = new THREE.MeshBasicMaterial({
      color: particle.color,
      transparent: true,
      opacity: 1,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(particle.position);
    this.scene.add(mesh);
    this.particleMeshes.push(mesh);
  }

  private cleanupExcess(): void {
    while (this.particles.length > this.maxParticles) {
      const mesh = this.particleMeshes.shift();
      if (mesh) {
        this.scene.remove(mesh);
      }
      this.particles.shift();
    }
  }

  public update(deltaTime: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      const mesh = this.particleMeshes[i];

      if (!mesh) continue;

      particle.lifetime += deltaTime;

      if (particle.lifetime >= particle.maxLifetime) {
        this.scene.remove(mesh);
        this.particles.splice(i, 1);
        this.particleMeshes.splice(i, 1);
        continue;
      }

      // Update position
      particle.position.add(particle.velocity.clone().multiplyScalar(deltaTime));
      mesh.position.copy(particle.position);

      // Apply gravity to smoke and flames
      particle.velocity.y += -15 * deltaTime;

      // Fade out
      const progress = particle.lifetime / particle.maxLifetime;
      const material = mesh.material as THREE.MeshBasicMaterial;
      material.opacity = 1 - progress;

      // Scale up smoke
      if (particle.color.r === 0.7) {
        const scale = 1 + progress * 2;
        mesh.scale.setScalar(scale);
      }
    }
  }

  public cleanup(): void {
    this.particleMeshes.forEach(mesh => this.scene.remove(mesh));
    this.particles = [];
    this.particleMeshes = [];
  }
}
