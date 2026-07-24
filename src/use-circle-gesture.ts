import { useEffect } from 'react';

const WINDOW_MS = 4000;
const MIN_SAMPLE_DISTANCE_PX = 4;
const MIN_RADIUS_PX = 30;
const MIN_POINTS = 24;
const REQUIRED_REVOLUTIONS = 3;
const FULL_TURN = Math.PI * 2;

interface TrailPoint {
  x: number;
  y: number;
  t: number;
}

/**
 * Detects the user drawing three full circles with their cursor within a
 * short window. Used as a hidden activation gesture for the feedback toolbar.
 */
export function useCircleGesture(onTrigger: () => void, enabled: boolean) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    let trail: TrailPoint[] = [];

    const handlePointerMove = (event: PointerEvent) => {
      const now = performance.now();
      const last = trail[trail.length - 1];
      if (
        last &&
        Math.hypot(event.clientX - last.x, event.clientY - last.y) < MIN_SAMPLE_DISTANCE_PX
      ) {
        return;
      }

      trail.push({ x: event.clientX, y: event.clientY, t: now });
      trail = trail.filter((point) => now - point.t <= WINDOW_MS);
      if (trail.length < MIN_POINTS) {
        return;
      }

      const centerX = trail.reduce((sum, p) => sum + p.x, 0) / trail.length;
      const centerY = trail.reduce((sum, p) => sum + p.y, 0) / trail.length;

      let windingAngle = 0;
      let radiusSum = 0;
      let previousAngle: number | null = null;
      for (const point of trail) {
        const dx = point.x - centerX;
        const dy = point.y - centerY;
        radiusSum += Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);
        if (previousAngle !== null) {
          let delta = angle - previousAngle;
          if (delta > Math.PI) delta -= FULL_TURN;
          if (delta < -Math.PI) delta += FULL_TURN;
          windingAngle += delta;
        }
        previousAngle = angle;
      }

      const meanRadius = radiusSum / trail.length;
      if (
        meanRadius >= MIN_RADIUS_PX &&
        Math.abs(windingAngle) >= REQUIRED_REVOLUTIONS * FULL_TURN
      ) {
        trail = [];
        onTrigger();
      }
    };

    window.addEventListener('pointermove', handlePointerMove, {
      passive: true,
    });
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, [enabled, onTrigger]);
}
