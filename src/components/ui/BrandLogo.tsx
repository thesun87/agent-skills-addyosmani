import Link from "next/link";

export interface BrandLogoProps {
  asHeading?: boolean;
  className?: string;
}

export function BrandLogo({ asHeading = false, className = "" }: BrandLogoProps) {
  const content = (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg
        className="h-10 w-auto"
        viewBox="0 0 520 200"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <g transform="translate(20 10)">
          <circle cx="90" cy="90" r="86" fill="#B8322A" />
          <circle
            cx="90"
            cy="90"
            r="76"
            fill="none"
            stroke="#FBF5EC"
            strokeWidth="2"
            opacity="0.6"
          />
          <path
            d="M90 22 C 104 40, 112 52, 108 68 C 106 78, 98 84, 90 86 C 80 84, 72 76, 73 65 C 74 56, 80 52, 82 44 C 86 52, 88 58, 86 64 C 92 58, 96 48, 90 22 Z"
            fill="#E8892B"
          />
          <path
            d="M90 52 C 97 62, 98 72, 90 80 C 84 76, 83 68, 90 52 Z"
            fill="#FBF5EC"
            opacity="0.85"
          />
          <path
            d="M52 92 H128 L120 140 C 118 150, 110 156, 100 156 H80 C 70 156, 62 150, 60 140 Z"
            fill="#FBF5EC"
          />
          <path
            d="M127 102 C 146 102, 146 130, 122 130"
            fill="none"
            stroke="#FBF5EC"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <rect x="46" y="86" width="88" height="9" rx="4.5" fill="#FBF5EC" />
          <path
            d="M60 112 H120"
            stroke="#B8322A"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.5"
          />
          <path d="M36 128 C 34 108, 48 96, 64 98 C 64 116, 52 128, 36 128 Z" fill="#4E7A47" />
          <path
            d="M38 126 C 46 116, 54 108, 62 100"
            fill="none"
            stroke="#FBF5EC"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </g>
        <g fontFamily="Lora, Georgia, serif" fill="#3A2620">
          <text x="214" y="104" fontSize="50" fontWeight="700" letterSpacing="1">
            TUẤN LINH
          </text>
        </g>
        <rect x="216" y="122" width="40" height="3" rx="1.5" fill="#E8892B" />
        <text
          x="266"
          y="132"
          fontFamily="'Be Vietnam Pro', system-ui, sans-serif"
          fontSize="18"
          fontWeight="600"
          letterSpacing="9"
          fill="#B8322A"
        >
          COFFEE
        </text>
      </svg>
      <span className="sr-only">Tuấn Linh Coffee</span>
    </div>
  );

  return (
    <Link href="/" className="inline-flex items-center">
      {asHeading ? (
        <h1 className="font-display text-text flex items-center font-bold">{content}</h1>
      ) : (
        content
      )}
    </Link>
  );
}
