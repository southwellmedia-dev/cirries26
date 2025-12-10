interface Logo {
  name: string;
  src: string;
  href?: string;
}

interface LogoMarqueeProps {
  logos: Logo[];
  speed?: number;
}

export default function LogoMarquee({
  logos,
  speed = 35
}: LogoMarqueeProps) {
  // Duplicate logos for seamless loop
  const duplicatedLogos = [...logos, ...logos, ...logos];

  return (
    <div className="logo-marquee">
      {/* Left fade gradient */}
      <div className="logo-marquee__fade logo-marquee__fade--left" aria-hidden="true" />

      {/* Right fade gradient */}
      <div className="logo-marquee__fade logo-marquee__fade--right" aria-hidden="true" />

      {/* Scrolling track */}
      <div
        className="logo-marquee__track"
        style={{ animationDuration: `${speed}s` }}
      >
        {duplicatedLogos.map((logo, index) => (
          <div key={`${logo.name}-${index}`} className="logo-marquee__item">
            {logo.href ? (
              <a
                href={logo.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={logo.name}
              >
                <img
                  src={logo.src}
                  alt={logo.name}
                  loading="lazy"
                  decoding="async"
                />
              </a>
            ) : (
              <img
                src={logo.src}
                alt={logo.name}
                loading="lazy"
                decoding="async"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
