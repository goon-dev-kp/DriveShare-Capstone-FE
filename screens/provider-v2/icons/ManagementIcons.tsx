import React from 'react'

// @ts-ignore
const { Svg, Path } = require('react-native-svg')

const flattenStyle = (style: any) => {
  if (!style) return undefined
  if (Array.isArray(style)) return Object.assign({}, ...style)
  return style
}

export const CubeIcon: React.FC<any> = (props) => {
  const { style, ...rest } = props || {}
  const flatStyle = flattenStyle(style)
  return (
    <Svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" style={flatStyle} {...rest}>
<Path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
</Svg>
  )
}

export const ArchiveBoxIcon: React.FC<any> = (props) => {
  const { style, ...rest } = props || {}
  const flatStyle = flattenStyle(style)
  return (
    <Svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" style={flatStyle} {...rest}>
<Path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10.5 11.25h3" />
</Svg>
  )
}

export const PlusCircleIcon: React.FC<any> = (props) => {
  const { style, ...rest } = props || {}
  const flatStyle = flattenStyle(style)
  return (
    <Svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" style={flatStyle} {...rest}>
<Path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
</Svg>
  )
}
