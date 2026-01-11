/**
 * Test Vietmap Autocomplete/Place API để lấy tọa độ
 */

const API_KEY = 'd6a44263b00bd2ec885ca6378f374da800df69a83efae44c'

async function testAutocomplete(text) {
  console.log('\n' + '='.repeat(80))
  console.log(`Testing Autocomplete: "${text}"`)
  console.log('='.repeat(80))
  
  try {
    // Try Autocomplete API
    const url = `https://maps.vietmap.vn/api/autocomplete/v3?apikey=${API_KEY}&text=${encodeURIComponent(text)}`
    
    console.log('URL:', url)
    
    const response = await fetch(url)
    console.log('Status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Error:', errorText)
      return
    }
    
    const data = await response.json()
    console.log('Response:')
    console.log(JSON.stringify(data, null, 2))
    
  } catch (error) {
    console.error('❌ Exception:', error.message)
  }
}

async function testPlace(refId) {
  console.log('\n' + '='.repeat(80))
  console.log(`Testing Place Details: "${refId}"`)
  console.log('='.repeat(80))
  
  try {
    // Try Place API to get coordinates
    const url = `https://maps.vietmap.vn/api/place/v3?apikey=${API_KEY}&refid=${refId}`
    
    console.log('URL:', url)
    
    const response = await fetch(url)
    console.log('Status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Error:', errorText)
      return
    }
    
    const data = await response.json()
    console.log('Response:')
    console.log(JSON.stringify(data, null, 2))
    
  } catch (error) {
    console.error('❌ Exception:', error.message)
  }
}

async function runTests() {
  console.log('🔍 Testing Vietmap Autocomplete + Place APIs')
  
  // Test autocomplete first
  await testAutocomplete('Hà Nội')
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // Test place details with a known ref_id
  await testPlace('vm:CITY:11') // Hà Nội ref_id from previous test
  await new Promise(resolve => setTimeout(resolve, 500))
  
  await testPlace('vmg:POI:GGM1221I0G0T59RWF6NHZJL6FMS9PF6X22DN') // Hồ Gươm
  
  console.log('\n' + '='.repeat(80))
  console.log('✅ Tests completed')
  console.log('='.repeat(80))
}

runTests().catch(console.error)
