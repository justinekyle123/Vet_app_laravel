import { useEffect, useRef, useState } from 'react';

interface CountUpProps {
    end: number;
    duration?: number;
    prefix?: string;
    suffix?: string;
    decimals?: number;
}

/** easeOutCubic — fast start, gentle settle. */
const easeOut = (progress: number) => 1 - Math.pow(1 - progress, 3);

export default function CountUp({
    end,
    duration = 1800,
    prefix = '',
    suffix = '',
    decimals = 0,
}: CountUpProps) {
    const ref = useRef<HTMLSpanElement>(null);
    const [value, setValue] = useState(0);

    useEffect(() => {
        const element = ref.current;

        if (!element) {
            return;
        }

        if (typeof IntersectionObserver === 'undefined') {
            setValue(end);

            return;
        }

        let frame = 0;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting) {
                    return;
                }

                observer.disconnect();

                if (
                    window.matchMedia('(prefers-reduced-motion: reduce)')
                        .matches
                ) {
                    setValue(end);

                    return;
                }

                const start = performance.now();

                const tick = (now: number) => {
                    const progress = Math.min((now - start) / duration, 1);
                    setValue(end * easeOut(progress));

                    if (progress < 1) {
                        frame = requestAnimationFrame(tick);
                    } else {
                        setValue(end);
                    }
                };

                frame = requestAnimationFrame(tick);
            },
            { threshold: 0.4 },
        );

        observer.observe(element);

        return () => {
            observer.disconnect();
            cancelAnimationFrame(frame);
        };
    }, [end, duration]);

    const display =
        decimals > 0
            ? value.toFixed(decimals)
            : Math.round(value).toLocaleString('en-US');

    return (
        <span ref={ref}>
            {prefix}
            {display}
            {suffix}
        </span>
    );
}
