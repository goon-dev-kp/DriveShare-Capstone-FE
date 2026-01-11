import { Platform } from 'react-native'
import React from 'react'

let Picker: any
if (Platform.OS === 'web') {
  Picker = require('./DatePicker.web').default
} else {
  Picker = require('./DatePicker.native').default
}

export default Picker as React.ComponentType<any>
