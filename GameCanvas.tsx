
import React, { useEffect, useRef, useCallback } from 'react';
import { GameStatus, Bird, Pipe, GameState, AppSettings, Particle } from '../types';
import { 
  GRAVITY, 
  JUMP_STRENGTH, 
  PIPE_SPEED, 
  PIPE_WIDTH, 
  PIPE_GAP, 
  BIRD_X_POSITION, 
  PIPE_SPAWN_RATE,
  GROUND_HEIGHT
} from '../constants';
import { checkCollision } from '../utils/gameUtils';
import { audioManager } from '../utils/audio';

interface GameCanvasProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  triggerJump: boolean;
  setTriggerJump: (val: boolean) => void;
  settings: AppSettings;
}

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  twinkleSpeed: number;
}

declare const window: any;

const GROUND_URL = "https://images.unsplash.com/photo-1545310727-b5db86055c55?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";
// Concrete texture for pillars
const PIPE_TEXTURE_URL = "https://images.unsplash.com/photo-1518391846015-55d3e55d78ca?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80";

const GameCanvas: React.FC<GameCanvasProps> = ({ gameState, setGameState, triggerJump, setTriggerJump, settings }) => {
  const canvasRef = useRef<any>(null);
  const requestRef = useRef<number | null>(null);
  const frameCountRef = useRef<number>(0);
  
  // Game Entities
  const birdRef = useRef<Bird>({
    x: BIRD_X_POSITION,
    y: 300,
    velocity: 0,
    radius: 16,
    rotation: 0,
    frame: 0
  });
  
  const pipesRef = useRef<Pipe[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const starsRef = useRef<Star[]>([]);
  
  // Assets
  const fgImageRef = useRef<any>(null);
  const pipeImageRef = useRef<any>(null);

  // Constants Modifiers based on Settings
  const CURRENT_GRAVITY = settings.hardcoreMode ? GRAVITY * 1.2 : GRAVITY;
  const CURRENT_PIPE_SPEED = settings.hardcoreMode ? PIPE_SPEED * 1.3 : PIPE_SPEED;
  const CURRENT_SPAWN_RATE = settings.hardcoreMode ? Math.floor(PIPE_SPAWN_RATE * 0.8) : PIPE_SPAWN_RATE;
  
  useEffect(() => {
    // Initialize procedural stars
    const stars: Star[] = [];
    const numStars = 150;
    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 0.5 + 0.1,
        opacity: Math.random(),
        twinkleSpeed: Math.random() * 0.05
      });
    }
    starsRef.current = stars;

    const fg = new window.Image();
    fg.src = GROUND_URL;
    fg.onload = () => { fgImageRef.current = fg; };

    const pipeImg = new window.Image();
    pipeImg.src = PIPE_TEXTURE_URL;
    pipeImg.onload = () => { pipeImageRef.current = pipeImg; };
  }, []);

  // --- PARTICLE SYSTEM ---
  const spawnParticles = (x: number, y: number, count: number, type: 'FEATHER' | 'DUST') => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        id: Math.random(),
        x,
        y,
        vx: (Math.random() - 0.5) * (type === 'FEATHER' ? 2 : 5),
        vy: (Math.random() - 0.5) * (type === 'FEATHER' ? 2 : 5),
        life: 1.0,
        maxLife: 1.0,
        size: Math.random() * (type === 'FEATHER' ? 4 : 2) + 1,
        color: type === 'FEATHER' ? `rgba(240, 240, 240, ${Math.random()})` : '#5d4037',
        type
      });
    }
  };

  const updateAndDrawParticles = (ctx: any) => {
    particlesRef.current.forEach((p, index) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.02;
      
      // Gravity for particles
      p.vy += 0.1;

      if (p.type === 'FEATHER') {
        // Feathers float down
        p.vx *= 0.95; 
        p.rotation = Math.sin(p.life * 10);
      }

      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      if (p.type === 'FEATHER') {
         ctx.ellipse(p.x, p.y, p.size, p.size/3, p.rotation || 0, 0, Math.PI*2);
      } else {
         ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.globalAlpha = 1.0;
    });

    // Cleanup dead particles
    particlesRef.current = particlesRef.current.filter(p => p.life > 0);
  };

  const resetGame = useCallback(() => {
    if (canvasRef.current) {
      birdRef.current = {
        x: BIRD_X_POSITION,
        y: canvasRef.current.height / 2,
        velocity: 0,
        radius: 16,
        rotation: 0,
        frame: 0
      };
      pipesRef.current = [];
      particlesRef.current = [];
      frameCountRef.current = 0;
    }
  }, []);

  useEffect(() => {
    if (gameState.status === GameStatus.IDLE) {
      resetGame();
    }
  }, [gameState.status, resetGame]);

  // Input Handling
  useEffect(() => {
    if (triggerJump) {
      if (gameState.status === GameStatus.PLAYING) {
        birdRef.current.velocity = JUMP_STRENGTH;
        birdRef.current.frame = 0; 
        audioManager.playJump();
        spawnParticles(birdRef.current.x - 10, birdRef.current.y, 2, 'FEATHER');
      } else if (gameState.status === GameStatus.IDLE) {
        setGameState(prev => ({ ...prev, status: GameStatus.PLAYING }));
        birdRef.current.velocity = JUMP_STRENGTH;
        audioManager.playJump();
        audioManager.playMusic();
      }
      setTriggerJump(false);
    }
  }, [triggerJump, gameState.status, setGameState, setTriggerJump]);

  const drawPigeon = (ctx: any, bird: Bird) => {
    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate(bird.rotation);

    const isFlapping = bird.velocity < 0 || gameState.status === GameStatus.IDLE;
    const flapSpeed = isFlapping ? 0.6 : 0.1;
    bird.frame += flapSpeed;
    
    const wingAngle = Math.sin(bird.frame) * (isFlapping ? 40 : 10);

    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 8;
    ctx.shadowOffsetX = 4;

    ctx.scale(0.85, 0.85);

    // Tail feathers (White/Grey fan)
    ctx.beginPath();
    ctx.moveTo(-22, 4);
    ctx.lineTo(-38, 0);
    ctx.lineTo(-36, 12);
    ctx.lineTo(-22, 8);
    ctx.fillStyle = '#E0E0E0';
    ctx.fill();

    // Body (White/Plump)
    const chestGrad = ctx.createRadialGradient(5, 5, 0, 0, 5, 25);
    chestGrad.addColorStop(0, '#FFFFFF');
    chestGrad.addColorStop(1, '#E0E0E0'); // Slight grey shadow at bottom
    
    ctx.beginPath();
    ctx.ellipse(0, 5, 24, 15, -0.1, 0, Math.PI * 2);
    ctx.fillStyle = chestGrad;
    ctx.fill();

    // Back/Upper body
    const backGrad = ctx.createLinearGradient(-20, -10, 20, -10);
    backGrad.addColorStop(0, '#FFFFFF');
    backGrad.addColorStop(1, '#F5F5F5');

    ctx.beginPath();
    ctx.ellipse(-2, -2, 22, 13, 0, Math.PI, Math.PI * 2, false);
    ctx.fillStyle = backGrad;
    ctx.fill();

    // Neck Iridescence (The purple/green shimmer typical of pigeons)
    const neckGrad = ctx.createLinearGradient(8, -8, 16, -4);
    neckGrad.addColorStop(0, '#9C27B0'); // Purple
    neckGrad.addColorStop(1, '#009688'); // Teal
    
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(12, -5, 8, 0, Math.PI * 2);
    ctx.fillStyle = neckGrad;
    ctx.fill();
    ctx.globalAlpha = 1.0;

    // Head (White)
    ctx.beginPath();
    ctx.arc(14, -8, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    // Beak (Dark Grey/Black with white Cere)
    ctx.beginPath();
    ctx.moveTo(22, -6);
    ctx.lineTo(34, -1);
    ctx.lineTo(22, 3);
    ctx.quadraticCurveTo(20, -2, 22, -6);
    ctx.fillStyle = '#37474F'; // Dark grey beak
    ctx.fill();

    // Cere (White bump on beak)
    ctx.beginPath();
    ctx.ellipse(23, -7, 2, 1.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#F5F5F5';
    ctx.fill();

    // Eye (Orange/Red ring with black pupil)
    ctx.beginPath();
    ctx.arc(16, -9, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = '#FF5722'; // Orange eye ring
    ctx.fill();
    ctx.beginPath();
    ctx.arc(16, -9, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = '#000';
    ctx.fill();
    // Eye highlight
    ctx.beginPath();
    ctx.arc(17, -10, 0.8, 0, Math.PI * 2);
    ctx.fillStyle = '#FFF';
    ctx.fill();

    // Wing (White with grey feather detailing)
    ctx.save();
    ctx.translate(2, -2);
    ctx.rotate((wingAngle * Math.PI) / 180);

    const wingGrad = ctx.createLinearGradient(0, 0, 30, 10);
    wingGrad.addColorStop(0, '#FFFFFF');
    wingGrad.addColorStop(1, '#CFD8DC'); // Light blue-grey tip

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(15, -10, 40, 5); // Longer wing span
    ctx.quadraticCurveTo(20, 18, 5, 5);
    ctx.closePath();
    
    ctx.fillStyle = wingGrad;
    ctx.fill();
    
    // Feather details
    ctx.strokeStyle = '#B0BEC5';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(10, 0); ctx.lineTo(25, 5);
    ctx.moveTo(12, 2); ctx.lineTo(30, 8);
    ctx.moveTo(14, 4); ctx.lineTo(28, 12);
    ctx.stroke();

    ctx.restore(); 

    ctx.restore(); 
  };

  const drawRealisticPipe = (ctx: any, pipe: Pipe, height: number) => {
    const bottomY = pipe.topHeight + pipe.gap;
    const pipeColor = '#808080'; // Concrete grey fallback

    // Helper to draw a single cylindrical segment
    const drawCylinder = (x: number, y: number, w: number, h: number) => {
       // Texture
       if (pipeImageRef.current) {
          const pat = ctx.createPattern(pipeImageRef.current, 'repeat');
          ctx.fillStyle = pat;
          ctx.save();
          ctx.translate(x, y);
          ctx.fillRect(0, 0, w, h);
          ctx.restore();
       } else {
          ctx.fillStyle = pipeColor;
          ctx.fillRect(x, y, w, h);
       }

       // Cylindrical Shading (Gradient Overlay)
       // Dark edges, lighter center to simulate roundness
       const grad = ctx.createLinearGradient(x, y, x + w, y);
       grad.addColorStop(0, 'rgba(0,0,0,0.65)');   // Dark shadow left
       grad.addColorStop(0.15, 'rgba(0,0,0,0.1)'); // Mid shadow
       grad.addColorStop(0.4, 'rgba(255,255,255,0.15)'); // Highlight
       grad.addColorStop(0.8, 'rgba(0,0,0,0.1)'); // Mid shadow
       grad.addColorStop(1, 'rgba(0,0,0,0.65)');   // Dark shadow right
       
       ctx.fillStyle = grad;
       ctx.fillRect(x, y, w, h);
       
       // Subtle border definition
       ctx.strokeStyle = 'rgba(0,0,0,0.5)';
       ctx.lineWidth = 1;
       ctx.strokeRect(x, y, w, h);
    };

    // Capital/Base styling
    const capHeight = 35;
    const capOverhang = 8;

    // --- TOP PIPE (Stalactite) ---
    // Main Shaft
    drawCylinder(pipe.x, 0, pipe.width, pipe.topHeight - capHeight);
    // Cap (Bottom of top pipe)
    drawCylinder(
      pipe.x - capOverhang, 
      pipe.topHeight - capHeight, 
      pipe.width + (capOverhang * 2), 
      capHeight
    );

    // --- BOTTOM PIPE (Stalagmite) ---
    // Cap (Top of bottom pipe)
    drawCylinder(
      pipe.x - capOverhang, 
      bottomY, 
      pipe.width + (capOverhang * 2), 
      capHeight
    );
    // Main Shaft
    drawCylinder(
      pipe.x, 
      bottomY + capHeight, 
      pipe.width, 
      height - bottomY - GROUND_HEIGHT - capHeight
    );
  };

  const animate = useCallback((time: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // Re-init stars if resize happens to fill screen
      if (starsRef.current.length > 0) {
         // optional: add more stars if screen got bigger
      }
    }

    const { width, height } = canvas;

    // Skip update logic if paused, but still draw
    if (gameState.status !== GameStatus.PAUSED) {
      if (gameState.status === GameStatus.PLAYING) {
        const bird = birdRef.current;
        
        bird.velocity += CURRENT_GRAVITY;
        bird.y += bird.velocity;

        const targetRot = Math.min(Math.PI / 2.5, Math.max(-Math.PI / 3, (bird.velocity * 0.12)));
        bird.rotation += (targetRot - bird.rotation) * 0.15;

        frameCountRef.current++;
        if (frameCountRef.current % CURRENT_SPAWN_RATE === 0) {
          const minPipeHeight = 150;
          const maxPipeHeight = height - GROUND_HEIGHT - PIPE_GAP - 150;
          const randomHeight = Math.floor(Math.random() * (maxPipeHeight - minPipeHeight + 1)) + minPipeHeight;
          
          pipesRef.current.push({
            x: width,
            topHeight: randomHeight,
            width: PIPE_WIDTH,
            gap: PIPE_GAP,
            passed: false
          });
        }

        pipesRef.current.forEach(pipe => {
          pipe.x -= CURRENT_PIPE_SPEED;
        });
        pipesRef.current = pipesRef.current.filter(pipe => pipe.x + pipe.width > -150);

        pipesRef.current.forEach(pipe => {
          if (!pipe.passed && bird.x > pipe.x + pipe.width) {
            pipe.passed = true;
            setGameState(prev => ({
              ...prev,
              score: prev.score + 1,
              highScore: Math.max(prev.highScore, prev.score + 1)
            }));
            audioManager.playScore();
          }
        });

        if (checkCollision(bird, pipesRef.current, height, GROUND_HEIGHT)) {
          setGameState(prev => ({ ...prev, status: GameStatus.GAME_OVER }));
          audioManager.playCrash();
          // Explosion of particles on death
          spawnParticles(bird.x, bird.y, 25, 'FEATHER');
          spawnParticles(bird.x, bird.y, 15, 'DUST');
        }
      } else if (gameState.status === GameStatus.IDLE) {
        birdRef.current.y = height / 2 + Math.sin(Date.now() / 250) * 15;
        birdRef.current.rotation = 0;
      }
    }

    // --- RENDERING ---
    ctx.clearRect(0, 0, width, height);

    // 1. Background - Endless Galaxy (Procedural)
    // Deep space gradient
    const spaceGrad = ctx.createLinearGradient(0, 0, 0, height);
    spaceGrad.addColorStop(0, '#0B0B20'); // Very dark blue/black
    spaceGrad.addColorStop(0.4, '#1A1A3A'); // Deep purple-ish blue
    spaceGrad.addColorStop(1, '#2C1E38'); // Deep nebula purple
    ctx.fillStyle = spaceGrad;
    ctx.fillRect(0, 0, width, height);

    // Draw and Move Stars
    starsRef.current.forEach(star => {
        // Update position
        if (gameState.status === GameStatus.PLAYING) {
            star.x -= star.speed;
        } else {
            star.x -= star.speed * 0.2; // Slow drift when idle
        }

        // Wrap around (Endless loop)
        if (star.x < 0) {
            star.x = width;
            star.y = Math.random() * height; // Randomize Y for variety
        }

        // Twinkle
        star.opacity += star.twinkleSpeed;
        if (star.opacity > 1 || star.opacity < 0.2) {
            star.twinkleSpeed = -star.twinkleSpeed;
        }

        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    });

    // 2. Pipes
    pipesRef.current.forEach(pipe => drawRealisticPipe(ctx, pipe, height));

    // 3. Ground
    if (fgImageRef.current) {
       const ptrn = ctx.createPattern(fgImageRef.current, 'repeat');
       if (ptrn) {
         ctx.fillStyle = ptrn;
         ctx.save();
         const groundSpeed = (gameState.status === GameStatus.PLAYING) ? CURRENT_PIPE_SPEED : 0;
         const offset = (frameCountRef.current * groundSpeed) % 400;
         ctx.translate(-offset, height - GROUND_HEIGHT);
         ctx.fillRect(offset, 0, width + 400, GROUND_HEIGHT);
         
         // Grass top line - changed to a space-ish ground rim or keep green?
         // Keeping green as it contrasts well with the pigeon, or make it concrete to match pillars?
         // Let's make it a dark rim to blend with galaxy but show separation
         ctx.fillStyle = '#1a1a1a';
         ctx.fillRect(offset, 0, width + 400, 6);
         ctx.restore();
       }
    } else {
       ctx.fillStyle = '#3e2723';
       ctx.fillRect(0, height - GROUND_HEIGHT, width, GROUND_HEIGHT);
    }

    // 4. Bird (Pigeon)
    drawPigeon(ctx, birdRef.current);

    // 5. Particles
    updateAndDrawParticles(ctx);

    requestRef.current = window.requestAnimationFrame(animate);
  }, [gameState.status, setGameState, settings, CURRENT_GRAVITY, CURRENT_PIPE_SPEED, CURRENT_SPAWN_RATE]);

  useEffect(() => {
    requestRef.current = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(requestRef.current!);
  }, [animate]);

  return <canvas ref={canvasRef} className="block w-full h-full" />;
};

export default GameCanvas;
