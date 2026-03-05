const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5173');
  await new Promise(r => setTimeout(r, 2000));
  
  const inlineHtml = await page.evaluate(() => {
     const wrap = document.querySelector('#inline-mount-point');
     return wrap ? wrap.outerHTML : 'NOT FOUND';
  });
  console.log("INLINE HTML:", inlineHtml);
  
  await browser.close();
})();
