import { useEffect, useMemo, useRef, useState } from 'react';

type RollingNumberProps = {
  value: number;
  className?: string;
  durationMs?: number;
  digitHeightPx?: number;
};

// RollingNumber animates each digit by vertically translating a stack of 0-9
// so that the next value appears to "roll" upward.
export default function RollingNumber({
  value,
  className,
  durationMs = 350,
  digitHeightPx = 28,
}: RollingNumberProps) {
  const safeValue = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  const digits = useMemo(() => safeValue.toString().split(''), [safeValue]);
  const [previousDigits, setPreviousDigits] = useState<string[]>(digits);

  // Keep previous digits to allow width stability when digit count changes
  useEffect(() => {
    setPreviousDigits(prev => {
      return digits.length > prev.length ? new Array(digits.length - prev.length).fill('0').concat(prev) : prev;
    });
  }, [digits.length]);

  const containerStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'baseline',
    gap: 0,
    fontVariantNumeric: 'tabular-nums',
    WebkitFontFeatureSettings: 'tnum',
    fontFeatureSettings: 'tnum',
  };

  const digitContainerStyle: React.CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    height: `${digitHeightPx}px`,
    width: '1ch',
  };

  const stripStyleBase: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    display: 'flex',
    flexDirection: 'column',
    transition: `transform ${durationMs}ms cubic-bezier(0.22, 1, 0.36, 1)`,
  };

  const digitStyle: React.CSSProperties = {
    display: 'block',
    height: `${digitHeightPx}px`,
    lineHeight: `${digitHeightPx}px`,
    textAlign: 'center',
    fontVariantNumeric: 'tabular-nums',
    WebkitFontFeatureSettings: 'tnum',
    fontFeatureSettings: 'tnum',
  };

  return (
    <span className={className} style={containerStyle} aria-label={safeValue.toString()}>
      {digits.map((d, idx) => {
        // Support thousands separators by rendering commas as static
        if (d === ',') {
          return (
            <span key={`comma-${idx}`} style={{ width: '0.4ch', textAlign: 'center' }}>,</span>
          );
        }

        const currentDigit = parseInt(d, 10);
        const translateY = -currentDigit * digitHeightPx;

        return (
          <span key={`digit-${idx}`} style={digitContainerStyle}>
            <span style={{ ...stripStyleBase, transform: `translateY(${translateY}px)` }}>
              {Array.from({ length: 10 }).map((_, n) => (
                <span key={n} style={digitStyle}>{n}</span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
}

