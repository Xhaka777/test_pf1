import * as React from "react";
import Svg, {
  G,
  Path,
  Ellipse,
  Line,
  Defs,
  LinearGradient,
  Stop,
  RadialGradient,
  ClipPath,
} from "react-native-svg";
/* SVGR has dropped some elements not supported by react-native-svg: filter */
const BgOverview = (props) => (
  <Svg
    width={375}
    height={110}
    viewBox="0 0 375 110"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <G filter="url(#filter0_dd_6_51)">
      <G clipPath="url(#clip0_6_51)">
        <Path
          d="M3 10C3 5.58172 6.58172 2 11 2H364C368.418 2 372 5.58172 372 10V98C372 102.418 368.418 106 364 106H11C6.58173 106 3 102.418 3 98V10Z"
          fill="url(#paint0_linear_6_51)"
          fillOpacity={0.1}
        />
        <G filter="url(#filter1_f_6_51)">
          <Ellipse
            cx={99.1011}
            cy={140.213}
            rx={99.1011}
            ry={140.213}
            transform="matrix(-0.866025 -0.5 -0.5 0.866025 475.113 -94.7324)"
            fill="url(#paint1_radial_6_51)"
          />
        </G>
        <G filter="url(#filter2_f_6_51)">
          <Ellipse
            cx={158.357}
            cy={77.6812}
            rx={158.357}
            ry={77.6812}
            transform="matrix(-0.866025 -0.5 -0.5 0.866025 495.164 -10.9512)"
            fill="url(#paint2_radial_6_51)"
          />
        </G>
        <G filter="url(#filter3_f_6_51)">
          <Ellipse
            cx={118.717}
            cy={107.658}
            rx={118.717}
            ry={107.658}
            transform="matrix(-0.866025 -0.5 -0.5 0.866025 461.8 -32.4453)"
            fill="url(#paint3_radial_6_51)"
          />
        </G>
        <Line x1={188} y1={62} x2={188} y2={94} stroke="#2F2C2D" />
      </G>
      <Path
        d="M11 2.5H364C368.142 2.5 371.5 5.85787 371.5 10V98C371.5 102.142 368.142 105.5 364 105.5H11C6.85787 105.5 3.5 102.142 3.5 98V10C3.5 5.85786 6.85786 2.5 11 2.5Z"
        stroke="url(#paint4_linear_6_51)"
      />
    </G>
    <Defs>
      <LinearGradient
        id="paint0_linear_6_51"
        x1={187.459}
        y1={106}
        x2={187.459}
        y2={2}
        gradientUnits="userSpaceOnUse"
      >
        <Stop stopColor="#9061F9" />
        <Stop offset={1} stopColor="#7EDCE2" />
      </LinearGradient>
      <RadialGradient
        id="paint1_radial_6_51"
        cx={0}
        cy={0}
        r={1}
        gradientUnits="userSpaceOnUse"
        gradientTransform="translate(119.558 140.213) rotate(-180) scale(119.558 465.035)"
      >
        <Stop stopColor="#2565F2" />
        <Stop offset={1} stopColor="#8D62F9" />
      </RadialGradient>
      <RadialGradient
        id="paint2_radial_6_51"
        cx={0}
        cy={0}
        r={1}
        gradientUnits="userSpaceOnUse"
        gradientTransform="translate(158.357 8.36567) rotate(90) scale(83.3579 165.01)"
      >
        <Stop stopColor="#B7CDFC" />
        <Stop offset={1} stopColor="#2565F2" stopOpacity={0} />
      </RadialGradient>
      <RadialGradient
        id="paint3_radial_6_51"
        cx={0}
        cy={0}
        r={1}
        gradientUnits="userSpaceOnUse"
        gradientTransform="translate(118.717 11.5939) rotate(90) scale(115.525 123.704)"
      >
        <Stop stopColor="#B7CDFC" stopOpacity={0.3} />
        <Stop offset={1} stopColor="#2565F2" stopOpacity={0} />
      </RadialGradient>
      <LinearGradient
        id="paint4_linear_6_51"
        x1={187.459}
        y1={106}
        x2={187.459}
        y2={2}
        gradientUnits="userSpaceOnUse"
      >
        <Stop stopColor="#9061F9" />
        <Stop offset={1} stopColor="#7EDCE2" />
      </LinearGradient>
      <ClipPath id="clip0_6_51">
        <Path
          d="M3 10C3 5.58172 6.58172 2 11 2H364C368.418 2 372 5.58172 372 10V98C372 102.418 368.418 106 364 106H11C6.58173 106 3 102.418 3 98V10Z"
          fill="white"
        />
      </ClipPath>
    </Defs>
  </Svg>
);
export default BgOverview;
