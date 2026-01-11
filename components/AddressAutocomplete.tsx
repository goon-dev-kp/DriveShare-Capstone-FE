import React, { useEffect, useRef, useState } from 'react'
import { View, TextInput, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native'
import vietmapAutocompleteService from '@/services/vietmapAutocompleteService'

type Suggestion = any

const debounce = (fn: Function, wait = 300) => {
  let t: any = null
  return (...args: any[]) => {
    clearTimeout(t)
    t = setTimeout(() => fn(...args), wait)
  }
}

interface Props {
  value?: string
  onSelect: (s: Suggestion) => void
  placeholder?: string
  displayType?: number
  focus?: { lat: number; lng: number }
}

const AddressAutocomplete: React.FC<Props> = ({ value = '', onSelect, placeholder = 'Nhập địa chỉ...', displayType = 1, focus }) => {
  const [query, setQuery] = useState<string>(value)
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  useEffect(() => { setQuery(value) }, [value])

  const doSearch = async (text: string) => {
    if (!text || text.trim().length === 0) {
      setSuggestions([])
      return
    }
    setLoading(true)
    const res = await vietmapAutocompleteService.autocomplete({ text, display_type: displayType, focus })
    if (!mounted.current) return
    setSuggestions(res || [])
    setLoading(false)
  }

  const debounced = useRef(debounce(doSearch, 300)).current

  const onChange = (text: string) => {
    setQuery(text)
    debounced(text)
  }

  return (
    <View style={styles.container}>
      <TextInput
        value={query}
        onChangeText={onChange}
        placeholder={placeholder}
        style={styles.input}
      />
      {loading && <ActivityIndicator style={{ marginTop: 8 }} />}
      {suggestions.length > 0 && (
        <View style={styles.dropdown}>
          <ScrollView nestedScrollEnabled keyboardShouldPersistTaps='handled'>
            {suggestions.map((item, idx) => (
              <TouchableOpacity 
                key={item.ref_id ?? item.refId ?? idx} 
                style={styles.item} 
                onPress={() => { setQuery(item.display || item.name); setSuggestions([]); onSelect(item) }}
              >
                <Text style={styles.itemTitle}>{item.name || item.display}</Text>
                <Text style={styles.itemSub}>{item.display || item.address}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, backgroundColor: '#fff' },
  dropdown: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, marginTop: 8, maxHeight: 220 },
  item: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  itemTitle: { fontWeight: '600', color: '#111827' },
  itemSub: { color: '#6B7280', marginTop: 4 }
})

export default AddressAutocomplete
