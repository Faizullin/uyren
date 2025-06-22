import { useEffect, useState } from 'react';

const MOBILE_BREAKPOINT = 768


export function useMediaQuery() {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
        setIsOpen(mediaQuery.matches);

        const handler = (e: MediaQueryListEvent) => {
            setIsOpen(e.matches);
        };

        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, []);

    return { isOpen };
}