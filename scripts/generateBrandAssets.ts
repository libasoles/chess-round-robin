import sharp from 'sharp'
// @ts-ignore - no types available for to-ico
import toIco from 'to-ico'
import path from 'path'
import { mkdirSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.join(__dirname, '..')

const source = path.join(projectRoot, 'public', 'tucuchess', 'logo.png')
const outputDir = path.join(projectRoot, 'public', 'brand', 'tucuchess')

// Ensure output directory exists
mkdirSync(outputDir, { recursive: true })

console.log(`Generating brand assets from ${source} to ${outputDir}...`)

async function removeWhiteBackground(inputBuffer: Buffer): Promise<Buffer> {
  const { data, info } = await sharp(inputBuffer)
    .raw()
    .toBuffer({ resolveWithObject: true })

  const channels = info.channels
  const width = info.width
  const height = info.height

  // Find background color by analyzing border pixels
  // Sample from all edges to find the most common color
  const borderSamples: [number, number, number][] = []

  // Sample top and bottom edges
  for (let x = 0; x < width; x++) {
    // Top edge
    let idx = x * channels
    borderSamples.push([data[idx], data[idx + 1], data[idx + 2]])
    // Bottom edge
    idx = ((height - 1) * width + x) * channels
    borderSamples.push([data[idx], data[idx + 1], data[idx + 2]])
  }

  // Sample left and right edges
  for (let y = 0; y < height; y++) {
    // Left edge
    let idx = y * width * channels
    borderSamples.push([data[idx], data[idx + 1], data[idx + 2]])
    // Right edge
    idx = (y * width + (width - 1)) * channels
    borderSamples.push([data[idx], data[idx + 1], data[idx + 2]])
  }

  // Find the most common color among border samples
  // Group by color and find the most frequent one
  const colorFreq = new Map<string, number>()
  for (const [r, g, b] of borderSamples) {
    const key = `${r},${g},${b}`
    colorFreq.set(key, (colorFreq.get(key) ?? 0) + 1)
  }

  let bgColor = [128, 128, 128] // Default fallback
  let maxFreq = 0
  for (const [key, freq] of colorFreq) {
    if (freq > maxFreq) {
      maxFreq = freq
      const [r, g, b] = key.split(',').map(Number)
      bgColor = [r, g, b]
    }
  }

  const [bgR, bgG, bgB] = bgColor

  // Remove background color with aggressive tolerance
  // Use lower threshold to catch more colors similar to background
  const tolerance = 25 // Lower threshold for more aggressive removal
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]

    // Calculate color distance from background color
    const dist = Math.sqrt(
      (r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2
    )

    // If similar to background color, make transparent
    if (dist < tolerance) {
      if (channels === 4) {
        // Fade alpha based on distance
        const alpha = Math.floor((dist / tolerance) * 255)
        data[i + 3] = alpha
      }
    }
  }

  return sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels,
    },
  })
    .png()
    .toBuffer()
}

async function generate() {
  try {
    // Read source image
    const sourceBuffer = await sharp(source).toBuffer()

    // Remove background first (before resizing)
    const noBackgroundBuffer = await removeWhiteBackground(sourceBuffer)

    // Generate header logo (512×512, transparent background, fit: contain to preserve aspect)
    const logoBuffer = await sharp(noBackgroundBuffer)
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      })
      .png()
      .toBuffer()

    // Generate empty state image (627×913 to match default empty.png aspect ratio)
    const emptyBuffer = await sharp(noBackgroundBuffer)
      .resize(400, 400, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      })
      .png()
      .toBuffer()

    // Generate PWA 512×512 (white background, no transparency)
    const pwa512Buffer = await sharp(noBackgroundBuffer)
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .png()
      .toBuffer()

    // Generate PWA 192×192 (white background)
    const pwa192Buffer = await sharp(noBackgroundBuffer)
      .resize(192, 192, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .png()
      .toBuffer()

    // Generate favicon 32×32 (white background)
    const faviconBuffer = await sharp(noBackgroundBuffer)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .png()
      .toBuffer()

    // Write files
    await Promise.all([
      sharp(logoBuffer)
        .toFile(path.join(outputDir, 'logo.png')),
      sharp(emptyBuffer)
        .toFile(path.join(outputDir, 'empty.png')),
      sharp(pwa512Buffer)
        .toFile(path.join(outputDir, 'pwa-512x512.png')),
      sharp(pwa192Buffer)
        .toFile(path.join(outputDir, 'pwa-192x192.png')),
      sharp(faviconBuffer)
        .toFile(path.join(outputDir, 'favicon.png')),
    ])

    // Generate favicon.ico from favicon.png
    const icoBuffer = await toIco([faviconBuffer])
    writeFileSync(path.join(outputDir, 'favicon.ico'), icoBuffer)

    console.log('✓ Assets generated successfully:')
    console.log(`  - ${path.join(outputDir, 'logo.png')} (header logo, transparent bg)`)
    console.log(`  - ${path.join(outputDir, 'empty.png')} (empty state, transparent bg)`)
    console.log(`  - ${path.join(outputDir, 'pwa-512x512.png')}`)
    console.log(`  - ${path.join(outputDir, 'pwa-192x192.png')}`)
    console.log(`  - ${path.join(outputDir, 'favicon.png')}`)
    console.log(`  - ${path.join(outputDir, 'favicon.ico')}`)
  } catch (err) {
    console.error('Error generating assets:', err)
    process.exit(1)
  }
}

generate()
