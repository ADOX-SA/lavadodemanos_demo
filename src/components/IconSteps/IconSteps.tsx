import * as React from "react";

type SvgIconProps = {
    width?: number | string;
    height?: number | string;
    color?: string;
    steps?: string | number; // Nueva prop para el número a mostrar
};

const IconSteps: React.FC<SvgIconProps> = ({ width = 72, height = 72, color = "#D9D9D9", steps = "x" }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={width}
        height={height}
        fill="none"
        viewBox="0 0 72 72"
    >
        <path
            fill={color}
            d="M70.286 36c0 18.935-15.35 34.286-34.286 34.286-18.935 0-34.286-15.35-34.286-34.286C1.714 17.065 17.064 1.714 36 1.714c18.935 0 34.286 15.35 34.286 34.286m-60 0c0 14.202 11.512 25.715 25.714 25.715S61.715 50.202 61.715 36 50.202 10.285 36 10.285 10.285 21.798 10.285 36"
        />

        <text 
            x="50%" 
            y="50%" 
            dominantBaseline="middle" 
            textAnchor="middle" 
            fontSize="40" 
            fontWeight="300"
            fill={color}
            fontFamily="Roboto"
        >
            {steps}
        </text>
    </svg>
);

export default IconSteps;
