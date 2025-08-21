import {
  calculateBoardroomDimensions,
  calculateUserPositions,
  getSeatPosition,
  getResponsiveAvatarSize,
  getTableDimensions
} from '../positioning';

describe('positioning utils', () => {
  describe('calculateBoardroomDimensions', () => {
    it('calculates correct dimensions with padding', () => {
      const dimensions = calculateBoardroomDimensions(1000, 600);
      
      // Padding is Math.min(1000, 600) * 0.1 = 60
      expect(dimensions.centerX).toBe(500);
      expect(dimensions.centerY).toBe(300);
      expect(dimensions.width).toBe(880); // 1000 - (60 * 2) padding
      expect(dimensions.height).toBe(480); // 600 - (60 * 2) padding
      expect(dimensions.radiusX).toBe(308); // width * 0.35
      expect(dimensions.radiusY).toBe(144); // height * 0.3
    });
  });

  describe('calculateUserPositions', () => {
    it('returns correct number of positions', () => {
      const dimensions = calculateBoardroomDimensions(800, 600);
      const positions = calculateUserPositions(5, dimensions);
      
      expect(positions).toHaveLength(5);
    });

    it('positions users around the ellipse', () => {
      const dimensions = calculateBoardroomDimensions(800, 600);
      const positions = calculateUserPositions(4, dimensions);
      
      // Check that positions are different
      expect(positions[0].x).not.toBe(positions[1].x);
      expect(positions[0].y).not.toBe(positions[1].y);
      
      // Check that all positions are within reasonable bounds
      positions.forEach(pos => {
        expect(pos.x).toBeGreaterThan(0);
        expect(pos.x).toBeLessThan(800);
        expect(pos.y).toBeGreaterThan(0);
        expect(pos.y).toBeLessThan(600);
      });
    });

    it('limits users to maximum of 16', () => {
      const dimensions = calculateBoardroomDimensions(800, 600);
      const positions = calculateUserPositions(20, dimensions);
      
      expect(positions).toHaveLength(16);
    });
  });

  describe('getSeatPosition', () => {
    it('calculates specific seat position', () => {
      const dimensions = calculateBoardroomDimensions(800, 600);
      const position = getSeatPosition(0, 4, dimensions);
      
      expect(position.x).toBeCloseTo(dimensions.centerX);
      expect(position.y).toBeLessThan(dimensions.centerY); // First position is at top
      expect(position.angle).toBeDefined();
    });
  });

  describe('getResponsiveAvatarSize', () => {
    it('returns small size for mobile', () => {
      expect(getResponsiveAvatarSize(500)).toBe(48);
    });

    it('returns medium size for tablet', () => {
      expect(getResponsiveAvatarSize(700)).toBe(56);
    });

    it('returns large size for desktop', () => {
      expect(getResponsiveAvatarSize(1200)).toBe(64);
    });
  });

  describe('getTableDimensions', () => {
    it('calculates table dimensions as percentage of boardroom', () => {
      const dimensions = calculateBoardroomDimensions(800, 600);
      const tableDims = getTableDimensions(dimensions);
      
      expect(tableDims.rx).toBeCloseTo(dimensions.radiusX * 0.7);
      expect(tableDims.ry).toBeCloseTo(dimensions.radiusY * 0.5);
      expect(tableDims.cx).toBe(dimensions.centerX);
      expect(tableDims.cy).toBe(dimensions.centerY);
    });
  });
});