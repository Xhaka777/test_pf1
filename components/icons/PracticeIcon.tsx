import React from 'react';
import Svg, { Path, G, Defs, ClipPath, Rect } from 'react-native-svg';

interface IconProps {
  size?: number;
  width?: number;
  height?: number;
}

export const PracticeIcon = ({ size = 40, width, height, ...props }: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">

      <Path
        fill="#633112"
        d="M6 .5h28A5.5 5.5 0 0 1 39.5 6v28a5.5 5.5 0 0 1-5.5 5.5H6A5.5 5.5 0 0 1 .5 34V6A5.5 5.5 0 0 1 6 .5Z"
      />
      <Path
        stroke="#2F2C2D"
        d="M6 .5h28A5.5 5.5 0 0 1 39.5 6v28a5.5 5.5 0 0 1-5.5 5.5H6A5.5 5.5 0 0 1 .5 34V6A5.5 5.5 0 0 1 6 .5Z"
      />
      <Path
        fill="#FACA15"
        d="M20 13.334a6.67 6.67 0 0 1 6.666 6.667A6.669 6.669 0 0 1 20 26.667a6.669 6.669 0 0 1-6.667-6.666A6.67 6.67 0 0 1 20 13.334Zm-1.334 9.667 4-3-4-3v6Z"
      />
    </Svg>
  );
};
