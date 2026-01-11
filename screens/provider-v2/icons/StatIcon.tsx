
import React from 'react'

// react-native-svg may not have TS types installed; require at runtime
// @ts-ignore
const { Svg, Path } = require('react-native-svg')

const flattenStyle = (style: any) => {
  if (!style) return undefined
  if (Array.isArray(style)) return Object.assign({}, ...style)
  return style
}

export const TruckIcon: React.FC<any> = (props) => {
  const { style, ...rest } = props || {}
  const flatStyle = flattenStyle(style)
  return (
    <Svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" style={flatStyle} {...rest}>
<Path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125V14.25m-17.25 4.5v-9m17.25 9v-9m-17.25-9h9.563c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125h-9.563a1.125 1.125 0 01-1.125-1.125v-1.5c0-.621.504-1.125 1.125-1.125z" />
</Svg>
  )
}

export const CurrencyDollarIcon: React.FC<any> = (props) => {
  const { style, ...rest } = props || {}
  const flatStyle = flattenStyle(style)
  return (
    <Svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" style={flatStyle} {...rest}>
<Path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
</Svg>
  )
}

export const PackageIcon: React.FC<any> = (props) => {
  const { style, ...rest } = props || {}
  const flatStyle = flattenStyle(style)
  return (
    <Svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" style={flatStyle} {...rest}>
<Path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10.5 11.25h3M12 15V5.25m-6.75 6V5.25m13.5 6V5.25" />
</Svg>
  )
}

export const StarIcon: React.FC<any> = (props) => {
  const { style, ...rest } = props || {}
  const flatStyle = flattenStyle(style)
  return (
    <Svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" style={flatStyle} {...rest}>
<Path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
</Svg>
  )
}