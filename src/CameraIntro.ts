import * as THREE from 'three';

export class CameraIntro {
  private camera: THREE.PerspectiveCamera;
  private startPosition: THREE.Vector3;
  private endPosition: THREE.Vector3;
  private lookAtStart: THREE.Vector3;
  private lookAtEnd: THREE.Vector3;
  private duration: number;
  private fastDuration: number;
  private elapsed: number;
  private isPlaying: boolean;
  private isFast: boolean;
  private onComplete: () => void;

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.startPosition = new THREE.Vector3();
    this.endPosition = new THREE.Vector3();
    this.lookAtStart = new THREE.Vector3();
    this.lookAtEnd = new THREE.Vector3();
    this.duration = 3.0; // 3 seconds normal
    this.fastDuration = 1.0; // 1 second when skipped
    this.elapsed = 0;
    this.isPlaying = false;
    this.isFast = false;
    this.onComplete = () => {};
  }

  public start(
    levelStartPos: THREE.Vector3,
    levelEndPos: THREE.Vector3,
    onComplete: () => void
  ): void {
    this.onComplete = onComplete;
    this.isPlaying = true;
    this.isFast = false;
    this.elapsed = 0;

    // Start at the end position, elevated and back
    this.startPosition.copy(levelEndPos);
    this.startPosition.y += 20; // Elevated view
    this.startPosition.z += 15; // Pull back for better view

    // End at the player spawn, standard third-person position
    this.endPosition.copy(levelStartPos);
    this.endPosition.y += 8;
    this.endPosition.z += 6;

    // Look at targets
    this.lookAtStart.copy(levelEndPos);
    this.lookAtEnd.copy(levelStartPos);

    // Set initial camera position
    this.camera.position.copy(this.startPosition);
    this.camera.lookAt(this.lookAtStart);
  }

  public speedUp(): void {
    if (this.isPlaying && !this.isFast) {
      this.isFast = true;
      // Adjust elapsed time to maintain visual continuity
      this.elapsed = this.elapsed * (this.fastDuration / this.duration);
    }
  }

  public skip(): void {
    if (this.isPlaying) {
      this.isPlaying = false;
      this.camera.position.copy(this.endPosition);
      this.camera.lookAt(this.lookAtEnd);
      this.onComplete();
    }
  }

  public update(deltaTime: number): void {
    if (!this.isPlaying) return;

    const currentDuration = this.isFast ? this.fastDuration : this.duration;
    this.elapsed += deltaTime;

    if (this.elapsed >= currentDuration) {
      this.isPlaying = false;
      this.camera.position.copy(this.endPosition);
      this.camera.lookAt(this.lookAtEnd);
      this.onComplete();
      return;
    }

    // Smooth easing (ease-in-out)
    const t = this.elapsed / currentDuration;
    const easedT = t < 0.5
      ? 2 * t * t
      : 1 - Math.pow(-2 * t + 2, 2) / 2;

    // Interpolate camera position
    this.camera.position.lerpVectors(this.startPosition, this.endPosition, easedT);

    // Interpolate look-at target
    const lookAtTarget = new THREE.Vector3();
    lookAtTarget.lerpVectors(this.lookAtStart, this.lookAtEnd, easedT);
    this.camera.lookAt(lookAtTarget);
  }

  public isActive(): boolean {
    return this.isPlaying;
  }
}
