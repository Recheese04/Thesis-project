/**
 * Avatar — shows profile picture or coloured initials fallback.
 *
 * Props:
 *  src     – image URL (string | null | undefined)
 *  name    – full name used to derive initials + hue
 *  size    – px number (default 40)
 *  className – extra CSS classes on the wrapper
 */
export default function Avatar({ src, name = '', size = 40, className = '' }) {
    // Derive initials (up to 2 chars)
    const initials = name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join('');

    // Deterministic hue from name
    const hue =
        name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 360;

    const style = {
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.25),
        flexShrink: 0,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: Math.round(size * 0.35),
        fontWeight: 700,
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        userSelect: 'none',
        background: src
            ? 'transparent'
            : `hsl(${hue}, 55%, 52%)`,
        color: 'white',
    };

    return (
        <div style={style} className={className}>
            {src ? (
                <img
                    src={src}
                    alt={name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                        // If image fails to load, hide it and show initials
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement.style.background = `hsl(${hue}, 55%, 52%)`;
                        e.currentTarget.parentElement.textContent = initials;
                    }}
                />
            ) : (
                initials || '?'
            )}
        </div>
    );
}
