import { type ReactNode } from 'react';

interface MarqueeProps {
    children: ReactNode;
    /** Scroll right-to-left (default) or left-to-right. */
    reverse?: boolean;
    /** Seconds for one full loop. Higher is slower. */
    speed?: number;
    pauseOnHover?: boolean;
    className?: string;
}

export default function Marquee({
    children,
    reverse = false,
    speed = 40,
    pauseOnHover = true,
    className = '',
}: MarqueeProps) {
    const animation = reverse ? 'animate-marquee-reverse' : 'animate-marquee';

    return (
        <div className={`group relative flex overflow-hidden ${className}`}>
            <div
                className={`flex w-max shrink-0 ${animation} ${
                    pauseOnHover
                        ? 'group-hover:[animation-play-state:paused]'
                        : ''
                }`}
                style={{ animationDuration: `${speed}s` }}
            >
                {/* Second copy is purely visual, so hide it from assistive tech. */}
                <div className="flex shrink-0 items-center">{children}</div>
                <div className="flex shrink-0 items-center" aria-hidden="true">
                    {children}
                </div>
            </div>
        </div>
    );
}
