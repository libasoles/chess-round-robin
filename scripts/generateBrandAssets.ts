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

  // Find background color by sampling corners (usually background)
  // Sample a small border region to find the dominant color
  const cornerSamples: [number, number, number][] = []
  const sampleSize = Math.min(10, Math.floor(Math.max(width, height) * 0.1))

  for (let y = 0; y < sampleSize; y++) {
    for (let x = 0; x < sampleSize; x++) {
      const idx = (y * width + x) * channels
      cornerSamples.push([data[idx], data[idx + 1], data[idx + 2]])
    }
  }

  // Find average color of corner samples (likely the background)
  let avgR = 0,
    avgG = 0,
    avgB = 0
  for (const [r, g, b] of cornerSamples) {
    avgR += r
    avgG += g
    avgB += b
  }
  avgR /= cornerSamples.length
  avgG /= cornerSamples.length
  avgB /= cornerSamples.length

  // Remove background color with tolerance
  // Make similar colors progressively more transparent
  const tolerance = 50 // Color distance threshold
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]

    // Calculate color distance from background color
    const dist = Math.sqrt(
      (r - avgR) ** 2 + (g - avgG) ** 2 + (b - avgB) ** 2
    )

    // If close to background color, make transparent
    if (dist < tolerance) {
      if (channels === 4) {
        // Fade alpha based on distance: exact match = fully transparent
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
