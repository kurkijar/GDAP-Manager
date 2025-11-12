import React from 'react';

const ClipboardCheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75l2.25 2.25 4.5-4.5m6-4.5H15a2.25 2.25 0 01-2.25-2.25V5.25A2.25 2.25 0 0115 3h4.5a2.25 2.25 0 012.25 2.25v13.5A2.25 2.25 0 0119.5 21H5.25A2.25 2.25 0 013 18.75V5.25A2.25 2.25 0 015.25 3H9" />
    </svg>
);

export default ClipboardCheckIcon;
