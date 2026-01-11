import React from 'react'
// react-native-svg is provided by Expo; use require to avoid TS type errors if types are not installed
// @ts-ignore
const { Svg, Path } = require('react-native-svg')

const flattenStyle = (style: any) => {
  if (!style) return undefined
  if (Array.isArray(style)) return Object.assign({}, ...style)
  return style
}

export const BellIcon: React.FC<any> = (props) => {
  const { style, ...rest } = props || {}
  const flatStyle = flattenStyle(style)
  return (
      <Svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" {...rest} style={flatStyle}>
<Path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
        />
</Svg>
  )
}

export const Cog8ToothIcon: React.FC<any> = (props) => {
  const { style, ...rest } = props || {}
  const flatStyle = flattenStyle(style)
  return (
      <Svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" {...rest} style={flatStyle}>
<Path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.594 3.94c.09-.542.56-1.007 1.113-1.113l.448-.113c.542-.135 1.122.193 1.357.715l.205.45a.6.6 0 00.58.414l.56.042c.551.04 1.03.493 1.03 1.042v.458c0 .548-.356 1.04-.882 1.258l-.42.165a.6.6 0 00-.422.585l.042.562c.04.551-.407 1.038-1.042 1.038h-.458c-.548 0-1.04-.356-1.258-.882l-.165-.42a.6.6 0 00-.585-.422l-.562-.042a1.04 1.04 0 01-1.038-1.042v-.458c0-.548.356-1.04.882-1.258l.42-.165a.6.6 0 00.422-.585l-.042-.562a1.04 1.04 0 011.038-1.038h.458zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z"
        />
<Path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 21a9 9 0 100-18 9 9 0 000 18z"
        />
</Svg>
  )
}
/**
 * Icon vòng tròn đã được check (Solid) - Đã chuyển sang <svg>
 */
export const CheckCircleIcon: React.FC<any> = (props) => (
  <Svg viewBox="0 0 24 24" fill="currentColor" {...props}>
<Path
      fillRule="evenodd"
      d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
      clipRule="evenodd"
    />
</Svg>
)

/**
 * Icon vòng tròn rỗng (Outline) - Đã chuyển sang <svg>
 */
export const CircleIcon: React.FC<any> = (props) => (
  <Svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" {...props}>
<Path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
</Svg>
)