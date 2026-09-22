import { useEffect, useRef, useState, type ReactNode } from 'react';

type Direction = 'up' | 'down' | 'left' | 'right' | 'none';

interface RevealProps {
    children: ReactNode;
    /** Milliseconds to stagger this element behind its siblings. */
    delay?: number;
    /** Edge the element animates in from. */
    direction?: Direction;
    /** Set false to replay the animation each time it scrolls back into view. */
    once?: boolean;
    className?: string;
}

const hiddenOffset: Record<Direction, string> = {
    up: 'translate-y-8',
    down: '-translate-y-8',
    left: '-translate-x-8',
    right: 'translate-x-8',
    none: '',
};

export default function Reveal({
    children,
    delay = 0,
    direction = 'up',
    once = true,
    className = '',
}: RevealProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const element = ref.current;

        if (!element) {
            return;
        }

        // Without observer support, show the content rather than hiding it.
        if (typeof IntersectionObserver === 'undefined') {
            setIsVisible(true);

            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);

                    if (once) {
                        observer.unobserve(entry.target);
                    }
                } else if (!once) {
                    setIsVisible(false);
                }
            },
            { threshold: 0.15, rootMargin: '0px 0px -60px 0px' },
        );

        observer.observe(element);

        return () => observer.disconnect();
    }, [once]);

    return (
        <div
            ref={ref}
            style={{ transitionDelay: `${delay}ms` }}
            className={`transform-gpu transition-[opacity,transform] duration-700 ease-out ${
                isVisible
                    ? 'translate-x-0 translate-y-0 opacity-100'
                    : `${hiddenOffset[direction]} opacity-0`
            } ${className}`}
        >
            {children}
        </div>
    );
}
