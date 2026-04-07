import puppeteer from 'puppeteer'

const htmlFile = process.argv[2] || './TIEBREAK_REPORT.html'
const pdfFile = htmlFile.replace('.html', '.pdf')

;(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
  })

  const page = await browser.newPage()
  await page.goto(`file://${process.cwd()}/${htmlFile}`, {
    waitUntil: 'networkidle2',
  })

  await page.pdf({
    path: pdfFile,
    format: 'A4',
    margin: {
      top: '20px',
      right: '20px',
      bottom: '20px',
      left: '20px',
    },
    printBackground: true,
    scale: 1,
  })

  await browser.close()
  console.log(`✓ PDF generated: ${pdfFile}`)
})().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
