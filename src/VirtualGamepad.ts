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
  private dpadFloatingCenter: { x: number; y: number } | null = null; // Re-centers on touch
  private debugMode: boolean = false;
  private debugInfo: {
    rotationSpeed: number;
    forwardSpeed: number;
    lateralSpeed: number;
  } = { rotationSpeed: 0, forwardSpeed: 0, lateralSpeed: 0 };

  // Keyboard and mouse support
  private pressedKeys: Set<string> = new Set();
  private isPointerLocked: boolean = false;
  private mouseSensitivity: number = 0.002; // Radians per pixel
  private currentCameraMode: 'traditional' | 'over-shoulder' = 'traditional';
  private mouseDownOnJumpButton: boolean = false;
  private lastSpacebarTapTime: number = 0;

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
      mouseRotationDelta: 0,
      mousePitchDelta: 0,
      isKeyboardMovement: false,
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
    this.setupKeyboardListeners();
    this.setupMouseListeners();
    this.draw();
  }

  private setupTouchListeners(): void {
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    this.canvas.addEventListener('touchcancel', this.handleTouchEnd.bind(this), { passive: false });
  }

  private setupKeyboardListeners(): void {
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
  }

  private setupMouseListeners(): void {
    this.canvas.addEventListener('click', this.handleMouseClick.bind(this));
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));

    // Pointer lock change event
    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === this.canvas;
    });
  }

  private handleKeyDown(e: KeyboardEvent): void {
    // Prevent default for game keys to avoid scrolling
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
      e.preventDefault();
    }

    // Avoid key repeat
    if (this.pressedKeys.has(e.key)) {
      return;
    }
    this.pressedKeys.add(e.key);

    // WASD and Arrow keys for movement
    if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') {
      this.controls.forward = true;
    }
    if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') {
      this.controls.backward = true;
    }
    if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
      this.controls.left = true;
    }
    if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
      this.controls.right = true;
    }

    // Spacebar for jump/booster (double-tap)
    if (e.key === ' ') {
      const now = Date.now();
      const timeSinceLastTap = now - this.lastSpacebarTapTime;

      // Check for double-tap
      if (timeSinceLastTap < this.doubleTapWindow && timeSinceLastTap > 0) {
        // Double-tap detected - activate booster
        this.controls.booster = true;
        this.controls.jump = false; // Don't trigger regular jump on second tap
      } else {
        // Single tap - jump
        this.controls.jump = true;
        this.controls.booster = false;
      }

      this.lastSpacebarTapTime = now;
    }

    // C key to toggle camera
    if (e.key === 'c' || e.key === 'C') {
      if (this.onCameraToggle) {
        this.onCameraToggle();
      }
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    this.pressedKeys.delete(e.key);

    // WASD and Arrow keys
    if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') {
      this.controls.forward = false;
    }
    if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') {
      this.controls.backward = false;
    }
    if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
      this.controls.left = false;
    }
    if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
      this.controls.right = false;
    }

    // Spacebar
    if (e.key === ' ') {
      this.controls.jump = false;
      this.controls.booster = false;
    }
  }

  private handleMouseDown(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if mousedown is on jump button
    const jumpDist = Math.sqrt(
      Math.pow(x - this.jumpButton.x, 2) + Math.pow(y - this.jumpButton.y, 2)
    );

    if (jumpDist < this.jumpButton.radius * 1.5) {
      this.mouseDownOnJumpButton = true;
      const now = Date.now();
      const timeSinceLastTap = now - this.lastJumpTapTime;

      // Check for double-click
      if (timeSinceLastTap < this.doubleTapWindow && timeSinceLastTap > 0) {
        // Double-click detected - activate booster (stays active while held)
        this.controls.booster = true;
        this.controls.jump = false;
      } else {
        // Single click - jump
        this.controls.jump = true;
      }

      this.lastJumpTapTime = now;
    }
  }

  private handleMouseUp(): void {
    if (this.mouseDownOnJumpButton) {
      this.controls.jump = false;
      this.controls.booster = false;
      this.mouseDownOnJumpButton = false;
    }
  }

  private handleMouseClick(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if click is on camera button
    const cameraDist = Math.sqrt(
      Math.pow(x - this.cameraButton.x, 2) + Math.pow(y - this.cameraButton.y, 2)
    );

    if (cameraDist < this.cameraButton.radius * 1.5) {
      const now = Date.now();
      const timeSinceLastTap = now - this.lastCameraTapTime;

      // Check for double-click to toggle debug mode
      if (timeSinceLastTap < this.doubleTapWindow && timeSinceLastTap > 0) {
        this.debugMode = !this.debugMode;
      } else {
        // Single click - toggle camera mode
        if (this.onCameraToggle) {
          this.onCameraToggle();
        }
      }

      this.lastCameraTapTime = now;
      return;
    }

    // Check if click is on jump button (already handled in mousedown/mouseup)
    const jumpDist = Math.sqrt(
      Math.pow(x - this.jumpButton.x, 2) + Math.pow(y - this.jumpButton.y, 2)
    );

    if (jumpDist < this.jumpButton.radius * 1.5) {
      return; // Already handled by mousedown/mouseup
    }

    // Click anywhere else in over-shoulder mode to request pointer lock
    if (this.currentCameraMode === 'over-shoulder' && !this.isPointerLocked) {
      this.canvas.requestPointerLock();
    }
  }

  private handleMouseMove(e: MouseEvent): void {
    // Only handle mouse movement in over-shoulder mode with pointer lock
    if (this.currentCameraMode === 'over-shoulder' && this.isPointerLocked) {
      // movementX and movementY are the raw mouse deltas
      this.controls.mouseRotationDelta = -e.movementX * this.mouseSensitivity;
      this.controls.mousePitchDelta = -e.movementY * this.mouseSensitivity;
    }
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
        // Set floating center to initial touch position
        this.dpadFloatingCenter = { x, y };
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
          this.dpadFloatingCenter = null; // Reset floating center
        } else if (touchData.zone === 'jump') {
          this.controls.jump = false;
          this.controls.booster = false;
        }

        this.touches.delete(touch.identifier);
      }
    }
  }

  private updateDpad(x: number, y: number): void {
    // Use floating center (set on touch start) for calculations
    const centerX = this.dpadFloatingCenter?.x ?? this.dpadCenter.x;
    const centerY = this.dpadFloatingCenter?.y ?? this.dpadCenter.y;

    const dx = x - centerX;
    const dy = y - centerY;
    const angle = Math.atan2(dy, dx);
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Multi-zone analog control with floating center
    const innerDeadZone = 5;   // Tiny dead zone to prevent finger jitter
    const fineControlZone = 25; // Fine control zone - linear, small magnitude
    const maxFineControlMagnitude = 0.05; // Cap fine control at 5% speed for tiny drift

    // Calculate analog values with multi-zone approach
    let magnitude = 0;

    if (distance <= innerDeadZone) {
      // Tiny dead zone - prevents jitter from resting finger
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

    // Draw floating center indicator
    if (this.dpadFloatingCenter) {
      this.ctx.save();
      this.ctx.fillStyle = '#00ff00';
      this.ctx.globalAlpha = 0.5;
      this.ctx.beginPath();
      this.ctx.arc(this.dpadFloatingCenter.x, this.dpadFloatingCenter.y, 8, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

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

      // Calculate distance from floating center (or fixed center if no floating center)
      const centerX = this.dpadFloatingCenter?.x ?? this.dpadCenter.x;
      const centerY = this.dpadFloatingCenter?.y ?? this.dpadCenter.y;
      const dx = this.dpadTouchPosition ? (this.dpadTouchPosition.x - centerX).toFixed(1) : '0.0';
      const dy = this.dpadTouchPosition ? (this.dpadTouchPosition.y - centerY).toFixed(1) : '0.0';
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
    const controls = { ...this.controls };

    // In over-shoulder mode, convert keyboard inputs to analog values
    if (this.currentCameraMode === 'over-shoulder') {
      // Only use keyboard analog conversion if there's no touch input
      if (controls.analogMagnitude === 0) {
        // Calculate analog values from keyboard inputs
        let analogX = 0;
        let analogY = 0;

        if (controls.forward) analogY -= 1;
        if (controls.backward) analogY += 1;
        if (controls.left) analogX -= 1;
        if (controls.right) analogX += 1;

        // Calculate magnitude and angle
        const magnitude = Math.sqrt(analogX * analogX + analogY * analogY);
        if (magnitude > 0) {
          controls.analogMagnitude = Math.min(magnitude, 1.0);
          controls.analogAngle = Math.atan2(analogY, analogX);
          controls.isKeyboardMovement = true; // Mark as keyboard input
        }
      }
    }

    // Reset mouse deltas after reading (they're per-frame values)
    this.controls.mouseRotationDelta = 0;
    this.controls.mousePitchDelta = 0;
    return controls;
  }

  public setCameraMode(mode: 'traditional' | 'over-shoulder'): void {
    this.currentCameraMode = mode;

    // Exit pointer lock when switching to traditional mode
    if (mode === 'traditional' && this.isPointerLocked) {
      document.exitPointerLock();
    }
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
