import type { SVGProps } from "react";

export function VibeStreamIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 8.5V12c0 4.42 3.58 8 8 8s8-3.58 8-8V8.5" />
      <path d="M16 8.5v-2a4 4 0 1 0-8 0v2" />
      <path d="M4 13.5c.68.62 1.5.99 2.5 1" />
      <path d="M17.5 14.5c.99-.01 1.82-.38 2.5-1" />
      <path d="M8 19a3 3 0 0 1 3-3h2a3 3 0 0 1 3 3" />
    </svg>
  );
}
