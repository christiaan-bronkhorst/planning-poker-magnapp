interface Position {
  x: number;
  y: number;
  angle: number;
}

interface BoardroomDimensions {
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  radiusX: number;
  radiusY: number;
}

const MAX_SEATS = 16;

export const calculateBoardroomDimensions = (
  containerWidth: number, 
  containerHeight: number
): BoardroomDimensions => {
  const padding = Math.min(containerWidth, containerHeight) * 0.1;
  const availableWidth = containerWidth - padding * 2;
  const availableHeight = containerHeight - padding * 2;
  
  return {
    width: availableWidth,
    height: availableHeight,
    centerX: containerWidth / 2,
    centerY: containerHeight / 2,
    radiusX: availableWidth * 0.35,
    radiusY: availableHeight * 0.3,
  };
};

export const calculateUserPositions = (
  userCount: number,
  dimensions: BoardroomDimensions
): Position[] => {
  const positions: Position[] = [];
  const actualSeats = Math.min(userCount, MAX_SEATS);
  
  for (let i = 0; i < actualSeats; i++) {
    // Distribute users evenly around the oval
    const angle = (i * 2 * Math.PI) / actualSeats - Math.PI / 2; // Start from top
    
    // Calculate position on ellipse
    const x = dimensions.centerX + dimensions.radiusX * Math.cos(angle);
    const y = dimensions.centerY + dimensions.radiusY * Math.sin(angle);
    
    positions.push({
      x,
      y,
      angle: angle + Math.PI / 2, // Adjust angle for avatar rotation
    });
  }
  
  return positions;
};

export const getSeatPosition = (
  seatIndex: number, 
  totalSeats: number,
  dimensions: BoardroomDimensions
): Position => {
  const angle = (seatIndex * 2 * Math.PI) / totalSeats - Math.PI / 2;
  
  return {
    x: dimensions.centerX + dimensions.radiusX * Math.cos(angle),
    y: dimensions.centerY + dimensions.radiusY * Math.sin(angle),
    angle: angle + Math.PI / 2,
  };
};

export const getResponsiveAvatarSize = (containerWidth: number): number => {
  if (containerWidth < 640) return 48; // sm screens
  if (containerWidth < 1024) return 56; // md screens
  return 64; // lg+ screens
};

export const getTableDimensions = (dimensions: BoardroomDimensions) => {
  return {
    rx: dimensions.radiusX * 0.7,
    ry: dimensions.radiusY * 0.5,
    cx: dimensions.centerX,
    cy: dimensions.centerY,
  };
};