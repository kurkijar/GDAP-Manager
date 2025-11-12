
import React from 'react';

const SpinnerIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" {...props}>
        <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
        <path
            className="opacity-25"
            fill="currentColor"
            d="M12 20a8 8 0 008-8h4a12 12 0 01-24 0h4a8 8 0 008 8z"
        ></path>
    </svg>
);

export default SpinnerIcon;
