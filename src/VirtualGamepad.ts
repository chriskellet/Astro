import { Controls } from './types';

export class VirtualGamepad {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private controls: Controls;
  private touches: Map<number, { x: number; y: number; zone: string }>;
  private dpadCenter: { x: number; y: number };
  private dpadRadius: number;
  private jumpButton: { x: number; y: number; radius: number };
  private cameraButton: { x: number; y: number; radius: number };
  private lastJumpTapTime: number = 0;
  private lastCameraTapTime: number = 0;
  private doubleTapWindow: number = 300; // milliseconds
  private onCameraToggle?: () => void;
  private dpadTouchPosition: { x: number; y: number } | null = null;
  private debugMode: boolean = false;
  private debugInfo: {
    rotationSpeed: number;
    forwardSpeed: number;
    lateralSpeed: number;
  } = { rotationSpeed: 0, forwardSpeed: 0, lateralSpeed: 0 };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.controls = {
      left: false,
      right: false,
      forward: false,
      backward: false,
      jump: false,
      booster: false,
      analogMagnitude: 0,
      analogAngle: 0,
    };
    this.touches = new Map();

    // D-pad on the left side
    this.dpadRadius = 80;
    this.dpadCenter = {
      x: 120,
      y: canvas.height - 120,
    };

    // Jump button on the right side
    this.jumpButton = {
      x: canvas.width - 120,
      y: canvas.height - 120,
      radius: 60,
    };

    // Camera toggle button in the top-right corner
    this.cameraButton = {
      x: canvas.width - 80,
      y: 80,
      radius: 40,
    };

    this.setupTouchListeners();
    this.draw();
  }

  private setupTouchListeners(): void {
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    this.canvas.addEventListener('touchcancel', this.handleTouchEnd.bind(this), { passive: false });
  }

  private handleTouchStart(e: TouchEvent): void {
    e.preventDefault();

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const rect = this.canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      // Check if touch is on D-pad
      const dpadDist = Math.sqrt(
        Math.pow(x - this.dpadCenter.x, 2) + Math.pow(y - this.dpadCenter.y, 2)
      );

      if (dpadDist < this.dpadRadius * 1.5) {
        this.touches.set(touch.identifier, { x, y, zone: 'dpad' });
        this.updateDpad(x, y);
      }

      // Check if touch is on jump button
      const jumpDist = Math.sqrt(
        Math.pow(x - this.jumpButton.x, 2) + Math.pow(y - this.jumpButton.y, 2)
      );

      if (jumpDist < this.jumpButton.radius * 1.5) {
        this.touches.set(touch.identifier, { x, y, zone: 'jump' });

        const now = Date.now();
        const timeSinceLastTap = now - this.lastJumpTapTime;

        // Check for double-tap
        if (timeSinceLastTap < this.doubleTapWindow && timeSinceLastTap > 0) {
          // Double-tap detected - activate booster while held
          this.controls.booster = true;
          this.controls.jump = false; // Don't trigger regular jump on second tap
        } else {
          // Single tap
          this.controls.jump = true;
          this.controls.booster = false;
        }

        this.lastJumpTapTime = now;
      }

      // Check if touch is on camera button
      const cameraDist = Math.sqrt(
        Math.pow(x - this.cameraButton.x, 2) + Math.pow(y - this.cameraButton.y, 2)
      );

      if (cameraDist < this.cameraButton.radius * 1.5) {
        this.touches.set(touch.identifier, { x, y, zone: 'camera' });

        const now = Date.now();
        const timeSinceLastTap = now - this.lastCameraTapTime;

        // Check for double-tap to toggle debug mode
        if (timeSinceLastTap < this.doubleTapWindow && timeSinceLastTap > 0) {
          this.debugMode = !this.debugMode;
        } else {
          // Single tap - toggle camera mode
          if (this.onCameraToggle) {
            this.onCameraToggle();
          }
        }

        this.lastCameraTapTime = now;
      }
    }
  }

  private handleTouchMove(e: TouchEvent): void {
    e.preventDefault();

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const touchData = this.touches.get(touch.identifier);

      if (touchData && touchData.zone === 'dpad') {
        const rect = this.canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        touchData.x = x;
        touchData.y = y;
        this.updateDpad(x, y);
      }
    }
  }

  private handleTouchEnd(e: TouchEvent): void {
    e.preventDefault();

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const touchData = this.touches.get(touch.identifier);

      if (touchData) {
        if (touchData.zone === 'dpad') {
          this.controls.left = false;
          this.controls.right = false;
          this.controls.forward = false;
          this.controls.backward = false;
          this.controls.analogMagnitude = 0;
          this.controls.analogAngle = 0;
          this.dpadTouchPosition = null;
        } else if (touchData.zone === 'jump') {
          this.controls.jump = false;
          this.controls.booster = false;
        }

        this.touches.delete(touch.identifier);
      }
    }
  }

  private updateDpad(x: number, y: number): void {
    const dx = x - this.dpadCenter.x;
    const dy = y - this.dpadCenter.y;
    const angle = Math.atan2(dy, dx);
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Multi-zone analog control for fine adjustments
    const innerDeadZone = 10;  // True dead zone - no input
    const fineControlZone = 35; // Fine control zone - linear, small magnitude
    const maxFineControlMagnitude = 0.05; // Cap fine control at 5% speed for tiny drift

    // Calculate analog values with multi-zone approach
    let magnitude = 0;

    if (distance <= innerDeadZone) {
      // True dead zone - no input
      magnitude = 0;
    } else if (distance <= fineControlZone) {
      // Fine control zone - linear mapping to small magnitude for precise adjustments
      const fineZoneProgress = (distance - innerDeadZone) / (fineControlZone - innerDeadZone);
      magnitude = fineZoneProgress * maxFineControlMagnitude;
    } else {
      // Acceleration zone - quadratic curve from max fine control to full speed
      const adjustedDistance = (distance - fineControlZone) / (this.dpadRadius - fineControlZone);
      const curveProgress = Math.min(adjustedDistance, 1.0);

      // Quadratic curve starting from where fine control ended
      magnitude = maxFineControlMagnitude + (curveProgress * curveProgress) * (1.0 - maxFineControlMagnitude);
    }

    this.controls.analogMagnitude = magnitude;
    this.controls.analogAngle = angle;

    // Store touch position for visual feedback
    this.dpadTouchPosition = { x, y };

    // Reset all directions
    this.controls.left = false;
    this.controls.right = false;
    this.controls.forward = false;
    this.controls.backward = false;

    if (distance > innerDeadZone) {
      // Convert angle to direction (8-way movement)
      const deg = angle * (180 / Math.PI);

      // Right (337.5 to 22.5 or -22.5 to 22.5)
      if ((deg >= -22.5 && deg < 22.5)) {
        this.controls.right = true;
      }
      // Down-Right (22.5 to 67.5)
      else if (deg >= 22.5 && deg < 67.5) {
        this.controls.right = true;
        this.controls.backward = true;
      }
      // Down (67.5 to 112.5)
      else if (deg >= 67.5 && deg < 112.5) {
        this.controls.backward = true;
      }
      // Down-Left (112.5 to 157.5)
      else if (deg >= 112.5 && deg < 157.5) {
        this.controls.left = true;
        this.controls.backward = true;
      }
      // Left (157.5 to -157.5)
      else if (deg >= 157.5 || deg < -157.5) {
        this.controls.left = true;
      }
      // Up-Left (-157.5 to -112.5)
      else if (deg >= -157.5 && deg < -112.5) {
        this.controls.left = true;
        this.controls.forward = true;
      }
      // Up (-112.5 to -67.5)
      else if (deg >= -112.5 && deg < -67.5) {
        this.controls.forward = true;
      }
      // Up-Right (-67.5 to -22.5)
      else if (deg >= -67.5 && deg < -22.5) {
        this.controls.right = true;
        this.controls.forward = true;
      }
    }
  }

  public draw(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw D-pad
    this.ctx.save();
    this.ctx.globalAlpha = 0.3;
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.arc(this.dpadCenter.x, this.dpadCenter.y, this.dpadRadius, 0, Math.PI * 2);
    this.ctx.fill();

    // Draw directional indicators
    this.ctx.globalAlpha = 0.5;
    this.ctx.strokeStyle = '#00a8ff';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(this.dpadCenter.x - this.dpadRadius * 0.7, this.dpadCenter.y);
    this.ctx.lineTo(this.dpadCenter.x + this.dpadRadius * 0.7, this.dpadCenter.y);
    this.ctx.moveTo(this.dpadCenter.x, this.dpadCenter.y - this.dpadRadius * 0.7);
    this.ctx.lineTo(this.dpadCenter.x, this.dpadCenter.y + this.dpadRadius * 0.7);
    this.ctx.stroke();
    this.ctx.restore();

    // Draw jump button
    this.ctx.save();

    // Add glow effect for booster mode
    if (this.controls.booster) {
      this.ctx.shadowBlur = 20;
      this.ctx.shadowColor = '#ff6600';
      this.ctx.globalAlpha = 0.8;
      this.ctx.fillStyle = '#ff6600';
    } else {
      this.ctx.globalAlpha = this.controls.jump ? 0.6 : 0.3;
      this.ctx.fillStyle = '#00ff88';
    }

    this.ctx.beginPath();
    this.ctx.arc(this.jumpButton.x, this.jumpButton.y, this.jumpButton.radius, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.shadowBlur = 0;
    this.ctx.globalAlpha = 1;
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 24px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(this.controls.booster ? '🚀' : 'A', this.jumpButton.x, this.jumpButton.y);
    this.ctx.restore();

    // Highlight active directions
    if (this.controls.left || this.controls.right || this.controls.forward || this.controls.backward) {
      this.ctx.save();
      this.ctx.globalAlpha = 0.6;
      this.ctx.fillStyle = '#00a8ff';
      this.ctx.beginPath();
      this.ctx.arc(this.dpadCenter.x, this.dpadCenter.y, this.dpadRadius * 0.4, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

    // Draw camera toggle button
    this.ctx.save();
    this.ctx.globalAlpha = 0.4;
    this.ctx.fillStyle = '#9b59b6';
    this.ctx.beginPath();
    this.ctx.arc(this.cameraButton.x, this.cameraButton.y, this.cameraButton.radius, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.globalAlpha = 1;
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 24px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('📷', this.cameraButton.x, this.cameraButton.y);
    this.ctx.restore();

    // Draw D-pad touch indicator
    if (this.dpadTouchPosition) {
      this.ctx.save();
      this.ctx.fillStyle = '#ff0000';
      this.ctx.globalAlpha = 0.8;
      this.ctx.beginPath();
      this.ctx.arc(this.dpadTouchPosition.x, this.dpadTouchPosition.y, 10, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

    // Draw debug info
    if (this.debugMode) {
      this.ctx.save();
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(10, 10, 280, 140);

      this.ctx.fillStyle = '#00ff00';
      this.ctx.font = '12px monospace';
      this.ctx.textAlign = 'left';
      this.ctx.textBaseline = 'top';

      const dx = this.dpadTouchPosition ? (this.dpadTouchPosition.x - this.dpadCenter.x).toFixed(1) : '0.0';
      const dy = this.dpadTouchPosition ? (this.dpadTouchPosition.y - this.dpadCenter.y).toFixed(1) : '0.0';
      const mag = this.controls.analogMagnitude.toFixed(3);
      const angle = this.controls.analogAngle.toFixed(2);

      this.ctx.fillText(`Stick X: ${dx}`, 20, 20);
      this.ctx.fillText(`Stick Y: ${dy}`, 20, 40);
      this.ctx.fillText(`Magnitude: ${mag}`, 20, 60);
      this.ctx.fillText(`Angle: ${angle} rad`, 20, 80);
      this.ctx.fillText(`Rot Speed: ${this.debugInfo.rotationSpeed.toFixed(2)} rad/s`, 20, 100);
      this.ctx.fillText(`Forward: ${this.debugInfo.forwardSpeed.toFixed(2)}`, 20, 120);

      this.ctx.restore();
    }
  }

  public getControls(): Controls {
    return { ...this.controls };
  }

  public resize(width: number, height: number): void {
    this.dpadCenter = {
      x: 120,
      y: height - 120,
    };

    this.jumpButton = {
      x: width - 120,
      y: height - 120,
      radius: 60,
    };

    this.cameraButton = {
      x: width - 80,
      y: 80,
      radius: 40,
    };

    this.draw();
  }

  public setCameraToggleCallback(callback: () => void): void {
    this.onCameraToggle = callback;
  }

  public updateDebugInfo(rotationSpeed: number, forwardSpeed: number, lateralSpeed: number): void {
    this.debugInfo.rotationSpeed = rotationSpeed;
    this.debugInfo.forwardSpeed = forwardSpeed;
    this.debugInfo.lateralSpeed = lateralSpeed;
  }
}
