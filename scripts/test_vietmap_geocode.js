/**
 * Test script để kiểm tra Vietmap Geocoding API
 * Chạy: node scripts/test_vietmap_geocode.js
 */

const API_KEY = 'd6a44263b00bd2ec885ca6378f374da800df69a83efae44c'

// Danh sách địa chỉ để test
const testAddresses = [
  'Hà Nội',
  'Quận 1, Hồ Chí Minh',
  'Hồ Gươm, Hà Nội',
  '12 Đường Đá Bạc Phường Tùng Thiện,Thành Phố Hà Nội',
  'Phố Hàng Bạc, Hoàn Kiếm, Hà Nội',
  'Sân bay Nội Bài',
  '1 Võ Văn Ngân, Thủ Đức, TP.HCM'
]

async function testGeocoding(address) {
  console.log('\n' + '='.repeat(80))
  console.log(`Testing: "${address}"`)
  console.log('='.repeat(80))
  
  try {
    const encodedAddress = encodeURIComponent(address)
    const url = `https://maps.vietmap.vn/api/search/v3?apikey=${API_KEY}&text=${encodedAddress}`
    
    console.log('URL:', url)
    console.log('Encoded address:', encodedAddress)
    
    const response = await fetch(url)
    console.log('Status:', response.status, response.statusText)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ HTTP Error:', errorText)
      return
    }
    
    const data = await response.json()
    console.log('Response type:', typeof data)
    console.log('Is array:', Array.isArray(data))
    
    if (Array.isArray(data)) {
      console.log('Results count:', data.length)
      if (data.length > 0) {
        console.log('\n✅ First result:')
        console.log(JSON.stringify(data[0], null, 2))
        
        if (data.length > 1) {
          console.log(`\n... and ${data.length - 1} more results`)
        }
      } else {
        console.log('⚠️ Empty array - no results found')
      }
    } else {
      console.log('Full response:')
      console.log(JSON.stringify(data, null, 2))
    }
    
  } catch (error) {
    console.error('❌ Exception:', error.message)
    console.error(error)
  }
}

async function runTests() {
  console.log('🔍 Vietmap Geocoding API Test')
  console.log('API Key:', API_KEY.substring(0, 10) + '...')
  console.log('Total tests:', testAddresses.length)
  
  for (const address of testAddresses) {
    await testGeocoding(address)
    // Delay để tránh rate limiting
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  console.log('\n' + '='.repeat(80))
  console.log('✅ All tests completed')
  console.log('='.repeat(80))
}

runTests().catch(console.error)
