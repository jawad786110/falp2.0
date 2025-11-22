import { Bird, Pipe } from '../types';

export const checkCollision = (bird: Bird, pipes: Pipe[], canvasHeight: number, groundHeight: number): boolean => {
  // Ground collision
  if (bird.y + bird.radius >= canvasHeight - groundHeight) {
    return true;
  }
  
  // Ceiling collision (optional, but good for realism)
  if (bird.y - bird.radius <= 0) {
    return true;
  }

  // Pipe collision
  for (const pipe of pipes) {
    // Horizontal bounds
    if (bird.x + bird.radius > pipe.x && bird.x - bird.radius < pipe.x + pipe.width) {
      // Vertical bounds (hit top pipe OR hit bottom pipe)
      if (bird.y - bird.radius < pipe.topHeight || bird.y + bird.radius > pipe.topHeight + pipe.gap) {
        return true;
      }
    }
  }

  return false;
};

// Linear interpolation for smooth animations
export const lerp = (start: number, end: number, t: number): number => {
  return start * (1 - t) + end * t;
};