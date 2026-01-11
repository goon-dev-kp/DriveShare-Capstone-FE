declare module 'expo-modules-core' {
  // Minimal shim for EventSubscription used by some Expo packages
  export type EventSubscription = {
    remove?: () => void
  } | any
  export const UnavailabilityError: any
  export const uuid: any

  // Additional shims used by legacy Expo packages
  export function requireOptionalNativeModule(name: string): any
  export class NativeModule<T = any> {
    constructor(...args: any[])
  }
  export const NativeModules: { [key: string]: any }
}
