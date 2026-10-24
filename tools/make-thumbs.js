// สร้างภาพย่อ WebP ของการ์ดทุกใบ: images/<เด็ค>/<n>.png → images/thumbs/<เด็ค>/<n>.webp (กว้าง 240px)
// ใช้ Playwright ที่มีอยู่แล้ว (ไม่เพิ่ม dependency) · รัน: node tools/make-thumbs.js
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'images');
const OUT = path.join(SRC, 'thumbs');
const WIDTH = 240;
const QUALITY = 0.8;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  let count = 0, bytes = 0;
  for (const deck of fs.readdirSync(SRC)) {
    const dir = path.join(SRC, deck);
    if (deck === 'thumbs' || !fs.statSync(dir).isDirectory()) continue;
    fs.mkdirSync(path.join(OUT, deck), { recursive: true });
    for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.png'))) {
      const dataUrl = 'data:image/png;base64,' + fs.readFileSync(path.join(dir, file)).toString('base64');
      const webp = await page.evaluate(async ([src, w, q]) => {
        const img = new Image(); img.src = src; await img.decode();
        const c = document.createElement('canvas');
        c.width = w; c.height = Math.round(img.naturalHeight * w / img.naturalWidth);
        const g = c.getContext('2d'); g.imageSmoothingQuality = 'high';
        g.drawImage(img, 0, 0, c.width, c.height);
        return c.toDataURL('image/webp', q);
      }, [dataUrl, WIDTH, QUALITY]);
      const buf = Buffer.from(webp.split(',')[1], 'base64');
      fs.writeFileSync(path.join(OUT, deck, file.replace(/\.png$/, '.webp')), buf);
      count++; bytes += buf.length;
    }
  }
  await browser.close();
  console.log(`thumbs: ${count} files, ${(bytes / 1024).toFixed(0)} KB`);
})();
