import React from 'react'

// react-native-svg may not have TS types installed; require at runtime
// @ts-ignore
const { Svg, Path } = require('react-native-svg')

const flattenStyle = (style: any) => {
    if (!style) return undefined
    if (Array.isArray(style)) return Object.assign({}, ...style)
    return style
}

export const PencilSquareIcon: React.FC<any> = (props) => {
    const { style, ...rest } = props || {}
    const flatStyle = flattenStyle(style)
    return (
        <Svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" style={flatStyle} {...rest}>
<Path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
</Svg>
    )
}

export const TrashIcon: React.FC<any> = (props) => {
    const { style, ...rest } = props || {}
    const flatStyle = flattenStyle(style)
    return (
        <Svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" style={flatStyle} {...rest}>
<Path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.067-2.09 1.02-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
</Svg>
    )
}


export const ArchiveBoxArrowDownIcon: React.FC<any> = (props) => {
    const { style, ...rest } = props || {}
    const flatStyle = flattenStyle(style)
    return (
        <Svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" style={flatStyle} {...rest}>
<Path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
<Path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10.5 11.25h3" />
</Svg>
    )
}

export const ArrowLeftIcon: React.FC<any> = (props) => {
    const { style, ...rest } = props || {}
    const flatStyle = flattenStyle(style)
    return (
        <Svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" style={flatStyle} {...rest}>
<Path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
</Svg>
    )
}

export const XMarkIcon: React.FC<any> = (props) => {
    const { style, ...rest } = props || {}
    const flatStyle = flattenStyle(style)
    return (
        <Svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" style={flatStyle} {...rest}>
<Path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
</Svg>
    )
}

export const PhotoIcon: React.FC<any> = (props) => {
    const { style, ...rest } = props || {}
    const flatStyle = flattenStyle(style)
    return (
        <Svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" style={flatStyle} {...rest}>
<Path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
</Svg>
    )
}

export const PaperAirplaneIcon: React.FC<any> = (props) => {
    const { style, ...rest } = props || {}
    const flatStyle = flattenStyle(style)
    return (
        <Svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" style={flatStyle} {...rest}>
<Path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
</Svg>
    )
}

export const ArrowLongRightIcon: React.FC<any> = (props) => {
    const { style, ...rest } = props || {}
    const flatStyle = flattenStyle(style)
    return (
        <Svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" style={flatStyle} {...rest}>
<Path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
</Svg>
    )
}

export const CalendarDaysIcon: React.FC<any> = (props) => {
    const { style, ...rest } = props || {}
    const flatStyle = flattenStyle(style)
    return (
        <Svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" style={flatStyle} {...rest}>
<Path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18M12 12.75h.008v.008H12v-.008z" />
</Svg>
    )
}

export const MapPinIcon: React.FC<any> = (props) => {
    const { style, ...rest } = props || {}
    const flatStyle = flattenStyle(style)
    return (
        <Svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" style={flatStyle} {...rest}>
<Path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
<Path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
</Svg>
    )
}

export const EyeIcon: React.FC<any> = (props) => {
    const { style, ...rest } = props || {}
    const flatStyle = flattenStyle(style)
    return (
        <Svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" style={flatStyle} {...rest}>
<Path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.964 7.322a1.043 1.043 0 010 .356C20.268 16.057 16.477 19 12 19c-4.477 0-8.268-2.943-9.964-7.322a1.043 1.043 0 010-.356z" />
<Path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
</Svg>
    )
}

export const CheckIcon: React.FC<any> = (props) => {
    const { style, ...rest } = props || {}
    const flatStyle = flattenStyle(style)
    return (
        <Svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" style={flatStyle} {...rest}>
<Path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
<Path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
</Svg>
    )
}

export const PhoneIcon = (props: any) => (
  <Svg 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    width={24} 
    height={24} 
    {...props}
  >
    <Path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" 
    />
  </Svg>
);
