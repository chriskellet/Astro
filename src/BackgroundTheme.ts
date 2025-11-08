import * as THREE from 'three';

export interface ThemeConfig {
  backgroundColor: number;
  fogColor: number;
  fogNear: number;
  fogFar: number;
  ambientLightColor: number;
  ambientLightIntensity: number;
  sunColor: number;
  sunIntensity: number;
  sunPosition: THREE.Vector3;
  hemisphereSkye: number;
  hemisphereGround: number;
  hemisphereIntensity: number;
}

export interface BackgroundObject {
  mesh: THREE.Object3D;
  updateFunction?: (deltaTime: number) => void;
}

export class BackgroundTheme {
  private scene: THREE.Scene;
  private backgroundObjects: BackgroundObject[] = [];
  private currentTheme: number = 1;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public setTheme(levelNumber: number): void {
    this.currentTheme = levelNumber;
    this.clearBackgroundObjects();

    const config = this.getThemeConfig(levelNumber);
    this.applyThemeConfig(config);
    this.createBackgroundObjects(levelNumber);
  }

  private getThemeConfig(levelNumber: number): ThemeConfig {
    switch (levelNumber) {
      case 1: // Sunny Day
        return {
          backgroundColor: 0x87ceeb,
          fogColor: 0x87ceeb,
          fogNear: 40,
          fogFar: 120,
          ambientLightColor: 0xffffff,
          ambientLightIntensity: 0.7,
          sunColor: 0xfffacd,
          sunIntensity: 1.0,
          sunPosition: new THREE.Vector3(30, 40, 20),
          hemisphereSkye: 0x87ceeb,
          hemisphereGround: 0x6aa84f,
          hemisphereIntensity: 0.5,
        };

      case 2: // Sunset
        return {
          backgroundColor: 0xff9a56,
          fogColor: 0xffa07a,
          fogNear: 35,
          fogFar: 110,
          ambientLightColor: 0xffd4a3,
          ambientLightIntensity: 0.6,
          sunColor: 0xff6b35,
          sunIntensity: 0.9,
          sunPosition: new THREE.Vector3(40, 15, 25),
          hemisphereSkye: 0xff7f50,
          hemisphereGround: 0x8b4513,
          hemisphereIntensity: 0.4,
        };

      case 3: // Mountain Peaks
        return {
          backgroundColor: 0xb0e5ff,
          fogColor: 0xd0f0ff,
          fogNear: 30,
          fogFar: 140,
          ambientLightColor: 0xe6f7ff,
          ambientLightIntensity: 0.8,
          sunColor: 0xffffff,
          sunIntensity: 1.1,
          sunPosition: new THREE.Vector3(35, 50, 15),
          hemisphereSkye: 0xd0f0ff,
          hemisphereGround: 0x9eb3bf,
          hemisphereIntensity: 0.6,
        };

      case 4: // Twilight/Night
        return {
          backgroundColor: 0x1a1a3e,
          fogColor: 0x2a2a4e,
          fogNear: 25,
          fogFar: 100,
          ambientLightColor: 0x8888ff,
          ambientLightIntensity: 0.4,
          sunColor: 0xaaaaff,
          sunIntensity: 0.5,
          sunPosition: new THREE.Vector3(25, 35, 30),
          hemisphereSkye: 0x2a2a5e,
          hemisphereGround: 0x0a0a1e,
          hemisphereIntensity: 0.3,
        };

      case 5: // Deep Space
        return {
          backgroundColor: 0x000011,
          fogColor: 0x110022,
          fogNear: 30,
          fogFar: 130,
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
        return this.getThemeConfig(1);
    }
  }

  private applyThemeConfig(config: ThemeConfig): void {
    this.scene.background = new THREE.Color(config.backgroundColor);
    this.scene.fog = new THREE.Fog(config.fogColor, config.fogNear, config.fogFar);
  }

  private createBackgroundObjects(levelNumber: number): void {
    switch (levelNumber) {
      case 1:
        this.createSunnyDayBackground();
        break;
      case 2:
        this.createSunsetBackground();
        break;
      case 3:
        this.createMountainBackground();
        break;
      case 4:
        this.createTwilightBackground();
        break;
      case 5:
        this.createSpaceBackground();
        break;
    }
  }

  private createSunnyDayBackground(): void {
    // Sun
    const sunGeometry = new THREE.SphereGeometry(8, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.position.set(-80, 50, -100);
    this.addBackgroundObject(sun);

    // Fluffy clouds at various positions
    this.createCloud(new THREE.Vector3(-50, 35, -80), 1.2, 0xffffff);
    this.createCloud(new THREE.Vector3(60, 40, -90), 1.0, 0xf0f0f0);
    this.createCloud(new THREE.Vector3(-20, 30, -70), 0.8, 0xfafafa);
    this.createCloud(new THREE.Vector3(100, 38, -110), 1.5, 0xffffff);
    this.createCloud(new THREE.Vector3(-100, 42, -95), 1.1, 0xf5f5f5);

    // Distant birds (simple triangles)
    for (let i = 0; i < 5; i++) {
      const bird = this.createBird();
      const angle = (i / 5) * Math.PI * 2;
      bird.position.set(
        Math.cos(angle) * 60 + Math.random() * 20,
        35 + Math.random() * 15,
        -80 - Math.random() * 30
      );
      const speed = 0.5 + Math.random() * 0.5;
      this.addBackgroundObject(bird, (dt) => {
        bird.position.x += speed * dt * 5;
        if (bird.position.x > 120) bird.position.x = -120;
        bird.rotation.z = Math.sin(Date.now() * 0.003) * 0.2;
      });
    }
  }

  private createSunsetBackground(): void {
    // Setting sun (lower and orange)
    const sunGeometry = new THREE.SphereGeometry(10, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xff4500 });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.position.set(70, 20, -100);
    this.addBackgroundObject(sun);

    // Floating islands in the distance
    for (let i = 0; i < 4; i++) {
      const island = this.createFloatingIsland();
      island.position.set(
        -80 + i * 50,
        15 + Math.sin(i) * 10,
        -70 - i * 15
      );
      const bobSpeed = 0.5 + i * 0.2;
      const bobOffset = i * 2;
      this.addBackgroundObject(island, (dt) => {
        island.position.y = 15 + Math.sin(i) * 10 + Math.sin(Date.now() * 0.001 * bobSpeed + bobOffset) * 2;
        island.rotation.y += dt * 0.1;
      });
    }

    // Sunset clouds (orange-tinted)
    this.createCloud(new THREE.Vector3(-40, 25, -75), 1.3, 0xffb347);
    this.createCloud(new THREE.Vector3(50, 30, -85), 1.1, 0xff9a56);
    this.createCloud(new THREE.Vector3(0, 22, -95), 1.5, 0xffa07a);
  }

  private createMountainBackground(): void {
    // Distant mountain peaks
    for (let i = 0; i < 6; i++) {
      const mountain = this.createMountain();
      mountain.position.set(
        -100 + i * 40,
        -20,
        -80 - i * 10
      );
      mountain.scale.set(
        15 + Math.random() * 10,
        20 + Math.random() * 15,
        15 + Math.random() * 10
      );
      this.addBackgroundObject(mountain);
    }

    // Cloud layer (like we're above the clouds)
    for (let i = 0; i < 8; i++) {
      const cloud = new THREE.Mesh(
        new THREE.PlaneGeometry(30, 20),
        new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.6,
          side: THREE.DoubleSide,
        })
      );
      cloud.rotation.x = -Math.PI / 2;
      cloud.position.set(
        -120 + i * 35,
        -15,
        -60 - Math.random() * 40
      );
      const driftSpeed = 0.3 + Math.random() * 0.3;
      this.addBackgroundObject(cloud, (dt) => {
        cloud.position.x += driftSpeed * dt * 2;
        if (cloud.position.x > 150) cloud.position.x = -150;
      });
    }

    // High altitude clouds (small puffs)
    this.createCloud(new THREE.Vector3(-60, 45, -90), 0.8, 0xffffff);
    this.createCloud(new THREE.Vector3(70, 50, -100), 0.9, 0xf8f8f8);
    this.createCloud(new THREE.Vector3(0, 48, -85), 0.7, 0xfafafa);
  }

  private createTwilightBackground(): void {
    // Moon
    const moonGeometry = new THREE.SphereGeometry(6, 32, 32);
    const moonMaterial = new THREE.MeshBasicMaterial({ color: 0xe0e0e0 });
    const moon = new THREE.Mesh(moonGeometry, moonMaterial);
    moon.position.set(60, 45, -100);
    this.addBackgroundObject(moon);

    // Stars (lots of them)
    const starGeometry = new THREE.SphereGeometry(0.3, 8, 8);
    const starMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

    for (let i = 0; i < 100; i++) {
      const star = new THREE.Mesh(starGeometry, starMaterial);
      star.position.set(
        (Math.random() - 0.5) * 200,
        Math.random() * 60 + 20,
        -60 - Math.random() * 80
      );
      const twinkleSpeed = 1 + Math.random() * 2;
      const twinkleOffset = Math.random() * Math.PI * 2;
      this.addBackgroundObject(star, (_dt) => {
        const scale = 0.8 + Math.sin(Date.now() * 0.001 * twinkleSpeed + twinkleOffset) * 0.2;
        star.scale.set(scale, scale, scale);
      });
    }

    // Dark clouds
    this.createCloud(new THREE.Vector3(-50, 25, -70), 1.2, 0x2a2a4e);
    this.createCloud(new THREE.Vector3(40, 30, -80), 1.4, 0x3a3a5e);
    this.createCloud(new THREE.Vector3(-10, 28, -75), 1.0, 0x2a2a4e);
  }

  private createSpaceBackground(): void {
    // Distant planets
    const planets = [
      { color: 0xff6b4a, size: 12, position: new THREE.Vector3(-70, 30, -120) },
      { color: 0x4a9eff, size: 8, position: new THREE.Vector3(80, 50, -130) },
      { color: 0xffcc66, size: 6, position: new THREE.Vector3(40, 40, -110) },
    ];

    planets.forEach((planetData) => {
      const planetGeometry = new THREE.SphereGeometry(planetData.size, 32, 32);
      const planetMaterial = new THREE.MeshBasicMaterial({ color: planetData.color });
      const planet = new THREE.Mesh(planetGeometry, planetMaterial);
      planet.position.copy(planetData.position);
      this.addBackgroundObject(planet, (dt) => {
        planet.rotation.y += dt * 0.2;
      });
    });

    // Nebula effect (colored semi-transparent planes)
    const nebulae = [
      { color: 0x8844ff, position: new THREE.Vector3(-50, 35, -90), size: [40, 30] },
      { color: 0xff44aa, position: new THREE.Vector3(60, 40, -100), size: [35, 25] },
      { color: 0x44aaff, position: new THREE.Vector3(0, 30, -85), size: [45, 35] },
    ];

    nebulae.forEach((nebula) => {
      const nebulaGeometry = new THREE.PlaneGeometry(nebula.size[0], nebula.size[1]);
      const nebulaMaterial = new THREE.MeshBasicMaterial({
        color: nebula.color,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide,
      });
      const nebulaMesh = new THREE.Mesh(nebulaGeometry, nebulaMaterial);
      nebulaMesh.position.copy(nebula.position);
      this.addBackgroundObject(nebulaMesh, (dt) => {
        nebulaMesh.rotation.z += dt * 0.1;
      });
    });

    // Stars (even more than twilight)
    const starGeometry = new THREE.SphereGeometry(0.4, 8, 8);
    const starColors = [0xffffff, 0xaaccff, 0xffccaa, 0xccffff];

    for (let i = 0; i < 150; i++) {
      const starMaterial = new THREE.MeshBasicMaterial({
        color: starColors[Math.floor(Math.random() * starColors.length)],
      });
      const star = new THREE.Mesh(starGeometry, starMaterial);
      star.position.set(
        (Math.random() - 0.5) * 250,
        Math.random() * 80 + 10,
        -70 - Math.random() * 100
      );
      const twinkleSpeed = 0.8 + Math.random() * 1.5;
      const twinkleOffset = Math.random() * Math.PI * 2;
      this.addBackgroundObject(star, (_dt) => {
        const scale = 0.7 + Math.sin(Date.now() * 0.001 * twinkleSpeed + twinkleOffset) * 0.3;
        star.scale.set(scale, scale, scale);
      });
    }

    // Asteroids floating by
    for (let i = 0; i < 3; i++) {
      const asteroid = this.createAsteroid();
      asteroid.position.set(
        -100 + i * 80,
        20 + Math.random() * 30,
        -70 - Math.random() * 30
      );
      const rotSpeed = 0.5 + Math.random();
      this.addBackgroundObject(asteroid, (dt) => {
        asteroid.rotation.x += dt * rotSpeed;
        asteroid.rotation.y += dt * rotSpeed * 0.7;
        asteroid.position.x += dt * 5;
        if (asteroid.position.x > 150) {
          asteroid.position.x = -150;
        }
      });
    }
  }

  // Helper methods to create various objects
  private createCloud(position: THREE.Vector3, scale: number, color: number): void {
    const cloudGroup = new THREE.Group();

    // Cloud made of spheres
    const sphereGeometry = new THREE.SphereGeometry(1, 16, 16);
    const cloudMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.8,
    });

    const positions = [
      [0, 0, 0, 3],
      [2, 0.5, 0, 2.5],
      [-2, 0.5, 0, 2.5],
      [1, 1, 0, 2],
      [-1, 1, 0, 2],
    ];

    positions.forEach(([x, y, z, s]) => {
      const sphere = new THREE.Mesh(sphereGeometry, cloudMaterial);
      sphere.position.set(x, y, z);
      sphere.scale.setScalar(s * scale);
      cloudGroup.add(sphere);
    });

    cloudGroup.position.copy(position);

    const driftSpeed = 0.2 + Math.random() * 0.3;
    this.addBackgroundObject(cloudGroup, (dt) => {
      cloudGroup.position.x += driftSpeed * dt * 2;
      if (cloudGroup.position.x > 150) {
        cloudGroup.position.x = -150;
      }
    });
  }

  private createBird(): THREE.Mesh {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(-0.5, 0.3);
    shape.lineTo(0, 0.1);
    shape.lineTo(0.5, 0.3);
    shape.lineTo(0, 0);

    const geometry = new THREE.ShapeGeometry(shape);
    const material = new THREE.MeshBasicMaterial({ color: 0x333333, side: THREE.DoubleSide });
    return new THREE.Mesh(geometry, material);
  }

  private createFloatingIsland(): THREE.Group {
    const island = new THREE.Group();

    // Base (inverted cone)
    const baseGeometry = new THREE.ConeGeometry(3, 4, 8);
    const baseMaterial = new THREE.MeshBasicMaterial({ color: 0x8b7355 });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.rotation.z = Math.PI;
    base.position.y = -2;
    island.add(base);

    // Top (flattened sphere)
    const topGeometry = new THREE.SphereGeometry(3, 16, 16);
    const topMaterial = new THREE.MeshBasicMaterial({ color: 0x6aa84f });
    const top = new THREE.Mesh(topGeometry, topMaterial);
    top.scale.set(1, 0.4, 1);
    island.add(top);

    return island;
  }

  private createMountain(): THREE.Mesh {
    const geometry = new THREE.ConeGeometry(1, 2, 4);
    const material = new THREE.MeshBasicMaterial({ color: 0x8899aa });
    const mountain = new THREE.Mesh(geometry, material);

    // Add snow cap
    const snowGeometry = new THREE.ConeGeometry(0.5, 0.6, 4);
    const snowMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const snow = new THREE.Mesh(snowGeometry, snowMaterial);
    snow.position.y = 0.7;
    mountain.add(snow);

    return mountain;
  }

  private createAsteroid(): THREE.Mesh {
    const geometry = new THREE.DodecahedronGeometry(2, 0);
    const material = new THREE.MeshBasicMaterial({ color: 0x666666 });
    const asteroid = new THREE.Mesh(geometry, material);

    // Make it irregular
    const vertices = geometry.attributes.position;
    for (let i = 0; i < vertices.count; i++) {
      const v = new THREE.Vector3(
        vertices.getX(i),
        vertices.getY(i),
        vertices.getZ(i)
      );
      v.multiplyScalar(0.8 + Math.random() * 0.4);
      vertices.setXYZ(i, v.x, v.y, v.z);
    }
    geometry.computeVertexNormals();

    return asteroid;
  }

  private addBackgroundObject(
    object: THREE.Object3D,
    updateFunction?: (deltaTime: number) => void
  ): void {
    this.scene.add(object);
    this.backgroundObjects.push({ mesh: object, updateFunction });
  }

  private clearBackgroundObjects(): void {
    this.backgroundObjects.forEach((obj) => {
      this.scene.remove(obj.mesh);
      if (obj.mesh instanceof THREE.Mesh) {
        obj.mesh.geometry.dispose();
        if (obj.mesh.material instanceof THREE.Material) {
          obj.mesh.material.dispose();
        }
      }
    });
    this.backgroundObjects = [];
  }

  public update(deltaTime: number): void {
    this.backgroundObjects.forEach((obj) => {
      if (obj.updateFunction) {
        obj.updateFunction(deltaTime);
      }
    });
  }

  public getCurrentTheme(): number {
    return this.currentTheme;
  }
}
