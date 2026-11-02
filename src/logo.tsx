import * as React from "react"

import { cn } from "./utils"

// The AccelOne logo from the brand guide (docs/accelone-brand-identity.html).
// The gold arc is fixed; the wordmark takes `currentColor`, so the default is the
// guide's two versions: black on light backgrounds, white on dark ones. On an
// always-dark surface (the sidebar, a dark card) pass `className="text-white"`.

const ARC_PATH =
  "M5313.98 160.543C5861.04 160.543 6273.64 292.879 6619 504C6399.73 244.935 5940.24 0.0078125 5319.25 0.0078125C4698.27 0.0078125 4293.24 235.122 4043 504C4388.36 292.879 4766.92 160.543 5313.98 160.543Z"

const A_PATH =
  "M656.624 1320.06H270.746L197.145 1499.09H0L370.37 664.133H560.418L932.102 1499.09H730.225L656.624 1320.06ZM595.904 1173.24L464.211 853.464L332.518 1173.24H596.167H595.904Z"

const WORDMARK_PATHS = [
  A_PATH,
  "M895.98 1081.35C895.98 829.699 1088.39 649.609 1347.05 649.609C1490.83 649.609 1610.7 702.157 1689.03 797.483L1565.48 912.086C1509.76 847.655 1439.57 814.383 1356.51 814.383C1200.9 814.383 1090.5 924.233 1090.5 1081.61C1090.5 1238.99 1200.9 1348.84 1356.51 1348.84C1439.57 1348.84 1509.76 1315.57 1565.48 1249.82L1689.03 1364.42C1610.7 1461.07 1490.83 1513.62 1346 1513.62C1088.39 1513.62 895.98 1333.53 895.98 1081.88V1081.35Z",
  "M1730.75 1081.35C1730.75 829.699 1923.16 649.609 2181.82 649.609C2325.6 649.609 2445.47 702.157 2523.8 797.483L2400.25 912.086C2344.53 847.655 2274.34 814.383 2191.28 814.383C2035.67 814.383 1925.27 924.233 1925.27 1081.61C1925.27 1238.99 2035.67 1348.84 2191.28 1348.84C2274.34 1348.84 2344.53 1315.57 2400.25 1249.82L2523.8 1364.42C2445.47 1461.07 2325.6 1513.62 2180.77 1513.62C1923.16 1513.62 1730.75 1333.53 1730.75 1081.88V1081.35Z",
  "M3230.33 1343.82V1498.83H2603.93V663.867H3231.9V818.871H2795.03V1000.28H3180.91V1150.53H2795.03V1343.82H3230.33Z",
  "M3392.11 664.133H3584.53V1341.71H4001.16V1499.09H3392.11V664.133Z",
  "M4042.74 1081.35C4042.74 833.132 4235.15 649.609 4497.48 649.609C4759.82 649.609 4952.23 832.075 4952.23 1081.35C4952.23 1330.62 4758.77 1513.09 4497.48 1513.09C4236.2 1513.09 4042.74 1329.3 4042.74 1081.35ZM4757.45 1081.35C4757.45 922.648 4645.74 814.119 4497.48 814.119C4349.23 814.119 4237.52 922.648 4237.52 1081.35C4237.52 1240.05 4349.23 1348.58 4497.48 1348.58C4645.74 1348.58 4757.45 1240.05 4757.45 1081.35Z",
  "M5831.36 664.133V1499.09H5673.38L5259.12 992.096V1499.09H5069.07V664.133H5228.1L5641.31 1171.13V664.133H5831.36Z",
  "M6617.91 1343.82V1498.83H5991.51V663.867H6619.48V818.871H6182.61V1000.28H6568.49V1150.53H6182.61V1343.82H6617.91Z",
]

const BRAND_GOLD = "#F9BF00"

type LogoProps = Omit<React.ComponentProps<"svg">, "children"> & {
  /** Accessible name. Pass an empty string when a visible label already names it. */
  title?: string
}

function LogoSvg({ title, viewBox, className, children, ...props }: LogoProps & {
  viewBox: string
  children: React.ReactNode
}) {
  const decorative = title === ""

  return (
    <svg
      viewBox={viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role={decorative ? undefined : "img"}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : title}
      className={cn("text-black dark:text-white", className)}
      {...props}
    >
      {children}
    </svg>
  )
}

/** Full logo: the ACCELONE wordmark under the gold arc. Size it by height (`h-8 w-auto`). */
export function AccelOneLogo({ title = "AccelOne", ...props }: LogoProps) {
  return (
    <LogoSvg viewBox="0 0 6619 1514" title={title} {...props}>
      <path d={ARC_PATH} fill={BRAND_GOLD} />
      {WORDMARK_PATHS.map((d) => (
        <path key={d.slice(0, 16)} d={d} fill="currentColor" />
      ))}
    </LogoSvg>
  )
}

/** Square mark (the favicon): the A under the gold arc, for tight spaces such as a collapsed sidebar. */
export function AccelOneMark({ title = "AccelOne", ...props }: LogoProps) {
  return (
    <LogoSvg viewBox="0 0 1100 1100" title={title} {...props}>
      <path d={ARC_PATH} fill={BRAND_GOLD} transform="translate(-1689 40) scale(0.42 0.6)" />
      <path d={A_PATH} fill="currentColor" transform="translate(84 -420)" />
    </LogoSvg>
  )
}
