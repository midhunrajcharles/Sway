const ROTATION = { "up-right": 0, right: 45, down: 135, up: -45 } as const;

export type ArrowDirection = keyof typeof ROTATION;

export function ArrowIcon({ direction = "up-right", size = 21 }: { direction?: ArrowDirection; size?: number }) {
  const deg = ROTATION[direction];
  return (
    <svg
      width={(10 / 21) * size}
      height={size}
      viewBox="0 0 10.0051 20.6718"
      fill="none"
      aria-hidden="true"
      style={deg ? { transform: `rotate(${deg}deg)`, overflow: "visible" } : undefined}
    >
      <path
        opacity="0.9"
        d="M0.98995 15.3384L0 14.3485L8.26278 6.08569L8.38157 6.57407L2.30988 6.70606L2.33628 5.33333L10.0051 5.34653V13.0021L8.63236 13.0285L8.77755 6.97005L9.25273 7.07564L0.98995 15.3384Z"
        fill="currentColor"
      />
    </svg>
  );
}
