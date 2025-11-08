import { Controls } from './types';

export class VirtualGamepad {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private controls: Controls;
  private touches: Map<number, { x: number; y: number; zone: string }>;
  private dpadCenter: { x: number; y: number };
  private dpadRadius: number;
  private jumpButton: { x: number; y: number; radius: number };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.controls = {
      left: false,
      right: false,
      forward: false,
      backward: false,
      jump: false,
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
        this.controls.jump = true;
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
        } else if (touchData.zone === 'jump') {
          this.controls.jump = false;
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

    // Reset all directions
    this.controls.left = false;
    this.controls.right = false;
    this.controls.forward = false;
    this.controls.backward = false;

    if (distance > 20) {
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
    this.ctx.globalAlpha = this.controls.jump ? 0.6 : 0.3;
    this.ctx.fillStyle = '#00ff88';
    this.ctx.beginPath();
    this.ctx.arc(this.jumpButton.x, this.jumpButton.y, this.jumpButton.radius, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.globalAlpha = 1;
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 24px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('A', this.jumpButton.x, this.jumpButton.y);
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

    this.draw();
  }
}
