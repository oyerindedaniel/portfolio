import * as React from "react";

export function MailIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="30"
      height="30"
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g clip-path="url(#clip0_29_364)">
        <path
          d="M11 4H4C3.51875 4 3.125 4.39375 3.125 4.875V10.125C3.125 10.6062 3.51875 11 4 11H11C11.4812 11 11.875 10.6062 11.875 10.125V4.875C11.875 4.39375 11.4812 4 11 4ZM10.825 5.85938L7.96375 7.64875C7.67938 7.82812 7.32062 7.82812 7.03625 7.64875L4.175 5.85938C4.06563 5.78937 4 5.67125 4 5.54438C4 5.25125 4.31938 5.07625 4.56875 5.22938L7.5 7.0625L10.4313 5.22938C10.6806 5.07625 11 5.25125 11 5.54438C11 5.67125 10.9344 5.78937 10.825 5.85938Z"
          fill="currentColor"
        />
      </g>
      <defs>
        <clipPath id="clip0_29_364">
          <rect
            width="10.5"
            height="10.5"
            fill="white"
            transform="translate(2.25 2.25)"
          />
        </clipPath>
      </defs>
    </svg>
  );
}
