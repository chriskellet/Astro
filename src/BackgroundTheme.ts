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
          fogNear: 100,
          fogFar: 800,
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
    // Define field colors for use throughout the background
    const fieldColors = [
      new THREE.Color(0x8bc34a), // Light green
      new THREE.Color(0x7cb342), // Medium green
      new THREE.Color(0x689f38), // Dark green
      new THREE.Color(0xaed581), // Bright green
      new THREE.Color(0x9ccc65), // Yellow-green
      new THREE.Color(0xcddc39), // Lime
    ];

    try {
      // Large ground plane extending to horizon
      // Position it centered under the level, extending forward and back
      // Width (X) = 1200, Depth (Z when rotated) = 1200 for good coverage
      const groundGeometry = new THREE.PlaneGeometry(1200, 1200, 80, 80);
      const groundMaterial = new THREE.MeshBasicMaterial({
        vertexColors: true,
      });
      const ground = new THREE.Mesh(groundGeometry, groundMaterial);
      ground.rotation.x = -Math.PI / 2;
      ground.position.set(0, -60, 0); // Center it at Z:0 instead of -100

      // Add procedural color variation to create field patterns
      const colors: number[] = [];
      const color = new THREE.Color();

      const positionAttribute = groundGeometry.attributes.position;
      const gridSize = 20; // Size of each "field"

      for (let i = 0; i < positionAttribute.count; i++) {
        const x = positionAttribute.getX(i);
        const z = positionAttribute.getZ(i);

        // Determine which field this vertex belongs to
        const fieldX = Math.floor(x / gridSize);
        const fieldZ = Math.floor(z / gridSize);
        const fieldIndex = Math.abs((fieldX * 7 + fieldZ * 11)) % fieldColors.length;

        // Add some variation within the field
        const variation = 0.9 + Math.random() * 0.2;
        color.copy(fieldColors[fieldIndex]).multiplyScalar(variation);

        colors.push(color.r, color.g, color.b);

        // Add subtle height variation for terrain
        const height = (Math.sin(x * 0.02) + Math.cos(z * 0.02)) * 1.5 + Math.random() * 0.5;
        positionAttribute.setY(i, height);
      }

      positionAttribute.needsUpdate = true;
      groundGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      groundGeometry.computeVertexNormals();
      this.addBackgroundObject(ground);
    } catch (error) {
      console.error('Error creating sunny day ground:', error);
    }

    // Add some larger distinct field patches for variety
    for (let i = 0; i < 30; i++) {
      const fieldSize = 30 + Math.random() * 50;
      const fieldGeometry = new THREE.PlaneGeometry(fieldSize, fieldSize, 4, 4);
      const fieldColor = fieldColors[Math.floor(Math.random() * fieldColors.length)];
      const fieldMaterial = new THREE.MeshBasicMaterial({
        color: fieldColor,
        transparent: true,
        opacity: 0.6,
      });
      const field = new THREE.Mesh(fieldGeometry, fieldMaterial);
      field.rotation.x = -Math.PI / 2;
      field.position.set(
        (Math.random() - 0.5) * 900,
        -59,
        (Math.random() - 0.5) * 700  // Spread across the entire Z range
      );

      // Slight rotation for variety
      field.rotation.z = Math.random() * Math.PI * 2;

      this.addBackgroundObject(field);
    }

    // Distant mountain ranges on the horizon
    for (let i = 0; i < 15; i++) {
      const mountain = this.createMountain();
      mountain.position.set(
        -250 + i * 40,
        -50,
        -300 - Math.random() * 100
      );
      mountain.scale.set(
        30 + Math.random() * 25,
        35 + Math.random() * 30,
        30 + Math.random() * 25
      );
      // Lighter color for distant mountains (atmospheric perspective)
      const mountainMesh = mountain.children[0] as THREE.Mesh;
      const mountainMaterial = mountainMesh.material as THREE.MeshBasicMaterial;
      mountainMaterial.color.setHex(0xaabbcc);
      this.addBackgroundObject(mountain);
    }

    // Small clouds at mid-height (between camera and ground)
    for (let i = 0; i < 12; i++) {
      const cloud = this.createPuffyCloud();
      cloud.position.set(
        (Math.random() - 0.5) * 300,
        -10 + Math.random() * 20,
        -60 - Math.random() * 100
      );
      const driftSpeed = 0.2 + Math.random() * 0.3;
      this.addBackgroundObject(cloud, (dt) => {
        cloud.position.x += driftSpeed * dt * 2;
        if (cloud.position.x > 180) {
          cloud.position.x = -180;
        }
      });
    }

    // Floating colorful balloons in the distance
    for (let i = 0; i < 4; i++) {
      const balloon = this.createBalloon();
      const baseY = -5 + Math.random() * 10;
      balloon.position.set(
        -60 + i * 40,
        baseY,
        -50 - Math.random() * 30
      );
      balloon.scale.setScalar(0.7);
      const bobSpeed = 0.6 + i * 0.15;
      const bobOffset = i * 1.5;
      this.addBackgroundObject(balloon, (dt) => {
        balloon.position.y = baseY + Math.sin(Date.now() * 0.001 * bobSpeed + bobOffset) * 2;
        balloon.rotation.y += dt * 0.2;
      });
    }

    // Birds flying at various heights between camera and ground
    for (let i = 0; i < 6; i++) {
      const bird = this.createBird();
      bird.position.set(
        -80 + i * 30,
        -15 + Math.random() * 25,
        -50 - Math.random() * 40
      );
      bird.scale.setScalar(1.5);
      const speed = 0.4 + Math.random() * 0.3;
      const circleRadius = 20 + Math.random() * 15;
      const angleOffset = (i / 6) * Math.PI * 2;
      this.addBackgroundObject(bird, (_dt) => {
        const time = Date.now() * 0.0003 * speed;
        bird.position.x = Math.cos(time + angleOffset) * circleRadius + (i * 30 - 80);
        bird.position.z = Math.sin(time + angleOffset) * circleRadius + (-50 - i * 5);
        bird.rotation.y = time + angleOffset;
      });
    }
  }

  private createSunsetBackground(): void {
    // Floating islands at various heights (more visible from above)
    for (let i = 0; i < 6; i++) {
      const island = this.createFloatingIsland();
      island.position.set(
        -90 + i * 35,
        -10 + Math.sin(i) * 8,
        -70 - i * 10
      );
      const bobSpeed = 0.5 + i * 0.2;
      const bobOffset = i * 2;
      this.addBackgroundObject(island, (dt) => {
        island.position.y = -10 + Math.sin(i) * 8 + Math.sin(Date.now() * 0.001 * bobSpeed + bobOffset) * 2;
        island.rotation.y += dt * 0.1;
      });
    }

    // Glowing lanterns floating in the distance
    for (let i = 0; i < 10; i++) {
      const lantern = this.createLantern();
      lantern.position.set(
        (Math.random() - 0.5) * 180,
        -5 + Math.random() * 15,
        -60 - Math.random() * 50
      );
      const floatSpeed = 0.3 + Math.random() * 0.4;
      const driftSpeed = (Math.random() - 0.5) * 2;
      this.addBackgroundObject(lantern, (dt) => {
        lantern.position.y += floatSpeed * dt * 0.5;
        lantern.position.x += driftSpeed * dt;
        if (lantern.position.y > 20) {
          lantern.position.y = -15;
        }
        // Gentle pulsing glow
        const scale = 1.0 + Math.sin(Date.now() * 0.002) * 0.1;
        lantern.scale.set(scale, scale, scale);
      });
    }

    // Distant water/ocean floor plane with waves
    const waterGeometry = new THREE.PlaneGeometry(300, 200, 20, 20);
    const waterMaterial = new THREE.MeshBasicMaterial({
      color: 0x3a6ea5,
      transparent: true,
      opacity: 0.4,
    });
    const water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.rotation.x = -Math.PI / 2;
    water.position.set(0, -30, -100);
    this.addBackgroundObject(water);
  }

  private createMountainBackground(): void {
    // Large distant mountain peaks on the horizon
    for (let i = 0; i < 8; i++) {
      const mountain = this.createMountain();
      mountain.position.set(
        -120 + i * 35,
        -30,
        -90 - i * 8
      );
      mountain.scale.set(
        18 + Math.random() * 12,
        30 + Math.random() * 20,
        18 + Math.random() * 12
      );
      this.addBackgroundObject(mountain);
    }

    // Rocky outcrops closer and lower
    for (let i = 0; i < 12; i++) {
      const rock = this.createRock();
      rock.position.set(
        (Math.random() - 0.5) * 200,
        -20 - Math.random() * 15,
        -50 - Math.random() * 60
      );
      rock.scale.setScalar(3 + Math.random() * 5);
      this.addBackgroundObject(rock);
    }

    // Flying eagles/birds at various heights
    for (let i = 0; i < 6; i++) {
      const bird = this.createBird();
      bird.position.set(
        -80 + i * 30,
        -5 + Math.random() * 20,
        -60 - Math.random() * 40
      );
      bird.scale.setScalar(2);
      const speed = 0.4 + Math.random() * 0.3;
      const circleRadius = 15 + Math.random() * 10;
      const angleOffset = (i / 6) * Math.PI * 2;
      this.addBackgroundObject(bird, (_dt) => {
        const time = Date.now() * 0.0003 * speed;
        bird.position.x = Math.cos(time + angleOffset) * circleRadius + (i * 30 - 80);
        bird.position.z = Math.sin(time + angleOffset) * circleRadius + (-60 - i * 5);
        bird.rotation.y = time + angleOffset;
      });
    }

    // Snow/ice crystals floating around
    for (let i = 0; i < 15; i++) {
      const crystal = this.createCrystal();
      crystal.position.set(
        (Math.random() - 0.5) * 150,
        -10 + Math.random() * 25,
        -50 - Math.random() * 50
      );
      const rotSpeed = 0.5 + Math.random();
      this.addBackgroundObject(crystal, (dt) => {
        crystal.rotation.x += dt * rotSpeed;
        crystal.rotation.y += dt * rotSpeed * 0.7;
        crystal.position.y += Math.sin(Date.now() * 0.001) * dt * 0.5;
      });
    }
  }

  private createTwilightBackground(): void {
    // Glowing mushrooms scattered on the ground
    for (let i = 0; i < 20; i++) {
      const mushroom = this.createGlowingMushroom();
      mushroom.position.set(
        (Math.random() - 0.5) * 180,
        -25 + Math.random() * 5,
        -55 - Math.random() * 55
      );
      const glowSpeed = 0.5 + Math.random() * 1.5;
      const glowOffset = Math.random() * Math.PI * 2;
      this.addBackgroundObject(mushroom, (_dt) => {
        const intensity = 0.7 + Math.sin(Date.now() * 0.001 * glowSpeed + glowOffset) * 0.3;
        mushroom.scale.set(intensity, intensity, intensity);
      });
    }

    // Fireflies floating around at various heights
    for (let i = 0; i < 30; i++) {
      const firefly = this.createFirefly();
      firefly.position.set(
        (Math.random() - 0.5) * 150,
        -15 + Math.random() * 30,
        -50 - Math.random() * 60
      );
      const moveSpeed = 0.3 + Math.random() * 0.4;
      const angleOffset = Math.random() * Math.PI * 2;
      const twinkleSpeed = 2 + Math.random() * 3;
      const twinkleOffset = Math.random() * Math.PI * 2;
      this.addBackgroundObject(firefly, (dt) => {
        const time = Date.now() * 0.001 * moveSpeed;
        firefly.position.x += Math.sin(time + angleOffset) * dt * 2;
        firefly.position.y += Math.cos(time + angleOffset * 2) * dt * 1.5;
        // Twinkling effect
        const brightness = 0.5 + Math.sin(Date.now() * 0.001 * twinkleSpeed + twinkleOffset) * 0.5;
        firefly.scale.setScalar(brightness);
      });
    }

    // Dark silhouettes of trees in the distance
    for (let i = 0; i < 12; i++) {
      const tree = this.createTree();
      tree.position.set(
        -110 + i * 20,
        -25,
        -70 - Math.random() * 30
      );
      tree.scale.set(
        4 + Math.random() * 3,
        10 + Math.random() * 8,
        4 + Math.random() * 3
      );
      this.addBackgroundObject(tree);
    }

    // Bats flying in circular patterns
    for (let i = 0; i < 8; i++) {
      const bat = this.createBat();
      bat.position.set(
        -60 + i * 20,
        0 + Math.random() * 10,
        -60 - Math.random() * 30
      );
      const speed = 0.6 + Math.random() * 0.4;
      const radius = 10 + Math.random() * 8;
      const angleOffset = (i / 8) * Math.PI * 2;
      this.addBackgroundObject(bat, (_dt) => {
        const time = Date.now() * 0.001 * speed;
        bat.position.x = Math.cos(time + angleOffset) * radius + (i * 20 - 60);
        bat.position.y = Math.sin(time * 2 + angleOffset) * 3 + (5 + i);
        bat.rotation.y = time + angleOffset + Math.PI / 2;
      });
    }
  }

  private createSpaceBackground(): void {
    // Large planets visible on the horizon/below
    const planets = [
      { color: 0xff6b4a, size: 25, position: new THREE.Vector3(-70, -20, -120) },
      { color: 0x4a9eff, size: 18, position: new THREE.Vector3(80, -15, -130) },
      { color: 0xffcc66, size: 15, position: new THREE.Vector3(40, -10, -100) },
      { color: 0x9966ff, size: 20, position: new THREE.Vector3(-40, -25, -110) },
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

    // Asteroids floating at various heights
    for (let i = 0; i < 15; i++) {
      const asteroid = this.createAsteroid();
      asteroid.position.set(
        (Math.random() - 0.5) * 200,
        -15 + Math.random() * 30,
        -60 - Math.random() * 60
      );
      const rotSpeed = 0.3 + Math.random() * 0.7;
      const driftSpeed = (Math.random() - 0.5) * 3;
      this.addBackgroundObject(asteroid, (dt) => {
        asteroid.rotation.x += dt * rotSpeed;
        asteroid.rotation.y += dt * rotSpeed * 0.7;
        asteroid.position.x += driftSpeed * dt;
        if (asteroid.position.x > 120) asteroid.position.x = -120;
        if (asteroid.position.x < -120) asteroid.position.x = 120;
      });
    }

    // Space crystals/minerals floating
    for (let i = 0; i < 20; i++) {
      const crystal = this.createSpaceCrystal();
      crystal.position.set(
        (Math.random() - 0.5) * 180,
        -10 + Math.random() * 25,
        -50 - Math.random() * 70
      );
      const rotSpeed = 0.4 + Math.random() * 0.6;
      const floatSpeed = 0.2 + Math.random() * 0.3;
      const floatOffset = Math.random() * Math.PI * 2;
      this.addBackgroundObject(crystal, (dt) => {
        crystal.rotation.x += dt * rotSpeed;
        crystal.rotation.z += dt * rotSpeed * 0.5;
        crystal.position.y += Math.sin(Date.now() * 0.001 * floatSpeed + floatOffset) * dt * 0.5;
      });
    }

    // Glowing space debris
    for (let i = 0; i < 12; i++) {
      const debris = this.createSpaceDebris();
      debris.position.set(
        (Math.random() - 0.5) * 160,
        -12 + Math.random() * 24,
        -55 - Math.random() * 55
      );
      const glowSpeed = 0.8 + Math.random() * 1.2;
      const glowOffset = Math.random() * Math.PI * 2;
      const spinSpeed = 0.5 + Math.random() * 0.8;
      this.addBackgroundObject(debris, (dt) => {
        debris.rotation.y += dt * spinSpeed;
        debris.rotation.x += dt * spinSpeed * 0.6;
        // Pulsing glow effect
        const glow = 0.8 + Math.sin(Date.now() * 0.001 * glowSpeed + glowOffset) * 0.2;
        debris.scale.setScalar(glow);
      });
    }

    // Distant space station or satellite
    const spaceStation = this.createSpaceStation();
    spaceStation.position.set(60, 0, -95);
    this.addBackgroundObject(spaceStation, (dt) => {
      spaceStation.rotation.y += dt * 0.3;
      spaceStation.position.y = Math.sin(Date.now() * 0.0005) * 5;
    });
  }

  // Helper methods to create various objects
  private createPuffyCloud(): THREE.Group {
    const cloud = new THREE.Group();
    const sphereGeometry = new THREE.SphereGeometry(1, 12, 12);
    const cloudMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.7,
    });

    // Create a puffy cloud from multiple spheres
    const positions = [
      [0, 0, 0, 3],
      [2.5, 0, 0, 2.5],
      [-2.5, 0, 0, 2.5],
      [1.5, 0.8, 0, 2],
      [-1.5, 0.8, 0, 2],
      [0, 1.2, 0, 2.2],
    ];

    positions.forEach(([x, y, z, scale]) => {
      const sphere = new THREE.Mesh(sphereGeometry, cloudMaterial);
      sphere.position.set(x, y, z);
      sphere.scale.setScalar(scale);
      cloud.add(sphere);
    });

    return cloud;
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

  // Level 1 objects
  private createBalloon(): THREE.Group {
    const balloon = new THREE.Group();

    // Balloon sphere
    const balloonGeometry = new THREE.SphereGeometry(1.5, 16, 16);
    const colors = [0xff6b6b, 0x4ecdc4, 0xffe66d, 0x95e1d3, 0xf38181];
    const balloonMaterial = new THREE.MeshBasicMaterial({
      color: colors[Math.floor(Math.random() * colors.length)],
    });
    const balloonMesh = new THREE.Mesh(balloonGeometry, balloonMaterial);
    balloon.add(balloonMesh);

    // String
    const stringGeometry = new THREE.CylinderGeometry(0.05, 0.05, 3, 4);
    const stringMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
    const string = new THREE.Mesh(stringGeometry, stringMaterial);
    string.position.y = -2.5;
    balloon.add(string);

    return balloon;
  }

  // Level 2 objects
  private createLantern(): THREE.Group {
    const lantern = new THREE.Group();

    // Lantern body
    const bodyGeometry = new THREE.CylinderGeometry(0.6, 0.6, 1.5, 6);
    const bodyMaterial = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.8,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    lantern.add(body);

    // Glow sphere inside
    const glowGeometry = new THREE.SphereGeometry(0.4, 8, 8);
    const glowMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    lantern.add(glow);

    return lantern;
  }

  // Level 3 objects
  private createRock(): THREE.Mesh {
    const geometry = new THREE.DodecahedronGeometry(1, 0);
    const material = new THREE.MeshBasicMaterial({ color: 0x888888 });
    const rock = new THREE.Mesh(geometry, material);

    // Make it irregular
    const vertices = geometry.attributes.position;
    for (let i = 0; i < vertices.count; i++) {
      const v = new THREE.Vector3(
        vertices.getX(i),
        vertices.getY(i),
        vertices.getZ(i)
      );
      v.multiplyScalar(0.7 + Math.random() * 0.6);
      vertices.setXYZ(i, v.x, v.y, v.z);
    }
    geometry.computeVertexNormals();

    return rock;
  }

  private createCrystal(): THREE.Mesh {
    const geometry = new THREE.OctahedronGeometry(0.5, 0);
    const material = new THREE.MeshBasicMaterial({
      color: 0xaaccff,
      transparent: true,
      opacity: 0.6,
    });
    return new THREE.Mesh(geometry, material);
  }

  // Level 4 objects
  private createGlowingMushroom(): THREE.Group {
    const mushroom = new THREE.Group();

    // Cap
    const capGeometry = new THREE.SphereGeometry(1, 12, 12);
    const capMaterial = new THREE.MeshBasicMaterial({
      color: 0xff4488,
      transparent: true,
      opacity: 0.8,
    });
    const cap = new THREE.Mesh(capGeometry, capMaterial);
    cap.scale.set(1, 0.6, 1);
    cap.position.y = 0.5;
    mushroom.add(cap);

    // Stem
    const stemGeometry = new THREE.CylinderGeometry(0.3, 0.4, 1, 8);
    const stemMaterial = new THREE.MeshBasicMaterial({ color: 0xdddddd });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    mushroom.add(stem);

    return mushroom;
  }

  private createFirefly(): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(0.3, 8, 8);
    const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    return new THREE.Mesh(geometry, material);
  }

  private createTree(): THREE.Group {
    const tree = new THREE.Group();

    // Trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.4, 0.6, 2, 6);
    const trunkMaterial = new THREE.MeshBasicMaterial({ color: 0x3d2817 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    tree.add(trunk);

    // Foliage (cone)
    const foliageGeometry = new THREE.ConeGeometry(1.2, 2, 8);
    const foliageMaterial = new THREE.MeshBasicMaterial({ color: 0x1a1a2e });
    const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
    foliage.position.y = 2;
    tree.add(foliage);

    return tree;
  }

  private createBat(): THREE.Group {
    const bat = new THREE.Group();

    // Body
    const bodyGeometry = new THREE.SphereGeometry(0.3, 8, 8);
    const bodyMaterial = new THREE.MeshBasicMaterial({ color: 0x2a2a2a });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    bat.add(body);

    // Wings
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0);
    wingShape.lineTo(1.2, 0.4);
    wingShape.lineTo(1.2, -0.4);
    wingShape.lineTo(0, 0);

    const wingGeometry = new THREE.ShapeGeometry(wingShape);
    const wingMaterial = new THREE.MeshBasicMaterial({
      color: 0x3a3a3a,
      side: THREE.DoubleSide,
    });

    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.position.x = -0.2;
    bat.add(leftWing);

    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    rightWing.scale.x = -1;
    rightWing.position.x = 0.2;
    bat.add(rightWing);

    return bat;
  }

  // Level 5 objects
  private createSpaceCrystal(): THREE.Mesh {
    const geometry = new THREE.OctahedronGeometry(1, 0);
    const colors = [0xff44ff, 0x44ffff, 0xffff44, 0x44ff44];
    const material = new THREE.MeshBasicMaterial({
      color: colors[Math.floor(Math.random() * colors.length)],
      transparent: true,
      opacity: 0.7,
    });
    const crystal = new THREE.Mesh(geometry, material);
    crystal.scale.set(1, 2, 1); // Make it elongated
    return crystal;
  }

  private createSpaceDebris(): THREE.Mesh {
    const geometry = new THREE.IcosahedronGeometry(1, 0);
    const material = new THREE.MeshBasicMaterial({
      color: 0x6688ff,
      transparent: true,
      opacity: 0.6,
    });
    return new THREE.Mesh(geometry, material);
  }

  private createSpaceStation(): THREE.Group {
    const station = new THREE.Group();

    // Central hub
    const hubGeometry = new THREE.SphereGeometry(3, 16, 16);
    const hubMaterial = new THREE.MeshBasicMaterial({ color: 0xcccccc });
    const hub = new THREE.Mesh(hubGeometry, hubMaterial);
    station.add(hub);

    // Solar panels (flat rectangles)
    for (let i = 0; i < 4; i++) {
      const panelGeometry = new THREE.BoxGeometry(6, 0.1, 2);
      const panelMaterial = new THREE.MeshBasicMaterial({ color: 0x2244aa });
      const panel = new THREE.Mesh(panelGeometry, panelMaterial);
      panel.position.x = i % 2 === 0 ? 5 : -5;
      panel.position.z = i < 2 ? 3 : -3;
      station.add(panel);
    }

    // Antenna
    const antennaGeometry = new THREE.CylinderGeometry(0.2, 0.2, 8, 8);
    const antennaMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
    antenna.position.y = 5;
    station.add(antenna);

    return station;
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
