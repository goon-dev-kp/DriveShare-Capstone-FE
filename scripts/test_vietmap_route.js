(async () => {
  // Read API key from environment to avoid committing secrets in source
  const vietmapAPIKey = process.env.VIETMAP_API_KEY || process.env.VIETMAP_API_KEY_LOCAL || null
  const ROUTE_URL = 'https://maps.vietmap.vn/api/route/v3'

  if (!vietmapAPIKey) {
    console.error('Missing VIETMAP_API_KEY environment variable. Set VIETMAP_API_KEY to run this script.')
    process.exit(1)
  }

  const start = [106.8311237, 10.8372192] // [lon, lat]
  const end = [105.85341, 21.03117]

  const formatPoint = (p) => `${p[1]},${p[0]}` // lat,lng
  const params = new URLSearchParams({ apikey: vietmapAPIKey, points_encoded: 'true', vehicle: 'car' })
  params.append('point', formatPoint(start))
  params.append('point', formatPoint(end))

  const url = `${ROUTE_URL}?${params.toString()}`
  console.log('Request URL:', url)

  try {
    const res = await fetch(url)
    if (!res.ok) {
      console.error('HTTP error', res.status)
      console.error(await res.text())
      process.exit(1)
    }
    const data = await res.json()
    if (data?.code !== 'OK' || !data?.paths?.[0]) {
      console.error('Bad response', JSON.stringify(data, null, 2))
      process.exit(1)
    }

    const path = data.paths[0]
    const geom = path.points
    const instructions = path.instructions || []
    console.log('instructions count:', instructions.length)

    // decode helper: try vietmap-api Polyline, then @mapbox/polyline
    const tryDecode = (enc, precision) => {
      try {
        const { Polyline } = require('@vietmap/vietmap-api')
        const pl = new Polyline()
        const raw = pl.decode(enc, precision)
        // raw is [[lat, lng], ...] ? vietmap decode returns [lat, lng] per utils; normalize to [lon, lat]
        return raw.map(pair => [pair[1], pair[0]])
      } catch (e) {
        try {
          const mapbox = require('@mapbox/polyline')
          const raw = mapbox.decode(enc, precision)
          // mapbox returns [[lat, lng], ...]
          return raw.map(pair => [pair[1], pair[0]])
        } catch (e2) {
          return []
        }
      }
    }

    let coords = tryDecode(geom, 5)
    if (!coords.length) coords = tryDecode(geom, 6)

    console.log('decoded coords length:', coords.length)
    console.log('sample coords (first 5):', coords.slice(0, 5))

    const mapped = (instructions || []).map(ins => {
      const idx = Array.isArray(ins.interval) && typeof ins.interval[0] === 'number' ? Math.max(0, Math.min(coords.length - 1, ins.interval[0])) : 0
      return { text: ins.text, interval: ins.interval, coordinate: coords[idx] }
    })

    console.log('mapped instructions (first 10):')
    console.log(mapped.slice(0, 10))

  } catch (err) {
    console.error('Exception:', err)
    process.exit(1)
  }
})()
