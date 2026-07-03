import { createPortal } from 'react-dom';

/**
 * Portal component simplifies rendering children at the document body root.
 * This is essential for bypass z-index and overflow clipping issues.
 */
const Portal = ({ children }) => {
    return createPortal(
        children,
        document.body
    );
};

export default Portal;
