export type TransitionType = 'fade' | 'starwipe';

export class ScreenTransition {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private active: boolean = false;
  private progress: number = 0;
  private duration: number = 1000; // milliseconds
  private type: TransitionType = 'fade';
  private direction: 'in' | 'out' = 'out';
  private callback?: () => void;
  private startTime: number = 0;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
    this.canvas.style.position = 'fixed';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '1000';
    document.body.appendChild(this.canvas);

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  private resize(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  public start(type: TransitionType, direction: 'in' | 'out', duration: number = 1000, callback?: () => void): void {
    this.active = true;
    this.type = type;
    this.direction = direction;
    this.duration = duration;
    this.callback = callback;
    this.progress = 0;
    this.startTime = Date.now();
    this.animate();
  }

  private animate(): void {
    if (!this.active) return;

    const elapsed = Date.now() - this.startTime;
    this.progress = Math.min(elapsed / this.duration, 1);

    this.draw();

    if (this.progress >= 1) {
      this.active = false;
      if (this.callback) {
        this.callback();
      }
    } else {
      requestAnimationFrame(() => this.animate());
    }
  }

  private draw(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // If transition is complete, clear everything
    if (this.progress >= 1) {
      return;
    }

    if (this.type === 'fade') {
      this.drawFade();
    } else if (this.type === 'starwipe') {
      this.drawStarWipe();
    }
  }

  private drawFade(): void {
    const alpha = this.direction === 'out' ? this.progress : 1 - this.progress;
    this.ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private drawStarWipe(): void {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY) * 1.5;

    let radius: number;
    if (this.direction === 'out') {
      // Start with full black screen, expand hole to reveal
      radius = maxRadius * this.progress;
    } else {
      // 'in' - Start with no black, expand star to cover screen with black
      radius = maxRadius * this.progress;
    }

    // Create a star shape mask
    this.ctx.save();
    this.ctx.fillStyle = 'black';

    if (this.direction === 'out') {
      // Fill everything with black
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // Cut out star shape (creates expanding hole that reveals screen)
      this.ctx.globalCompositeOperation = 'destination-out';
      this.drawStar(centerX, centerY, radius);
      this.ctx.fill();
    } else {
      // Draw expanding black star that covers the screen
      this.drawStar(centerX, centerY, radius);
      this.ctx.fill();
    }

    this.ctx.restore();
  }

  private drawStar(cx: number, cy: number, radius: number): void {
    const points = 5;
    const outerRadius = radius;
    const innerRadius = radius * 0.4;

    this.ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const r = i % 2 === 0 ? outerRadius : innerRadius;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;

      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }
    this.ctx.closePath();
  }

  public isActive(): boolean {
    return this.active;
  }

  public cleanup(): void {
    if (this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }
}
