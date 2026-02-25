import puppeteer from 'puppeteer-core';

/**
 * Render an HTML string to a PDF Buffer using Puppeteer.
 * Requires PUPPETEER_EXECUTABLE_PATH env var (set in Docker to /usr/bin/chromium-browser).
 * Format: A3 landscape, printBackground enabled.
 */
export async function htmlToPdfBuffer(html: string): Promise<Buffer> {
  const executablePath =
    process.env.PUPPETEER_EXECUTABLE_PATH ?? '/usr/bin/chromium-browser';

  const browser = await puppeteer.launch({
    executablePath,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({
      format: 'A3',
      landscape: true,
      printBackground: true,
      margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
