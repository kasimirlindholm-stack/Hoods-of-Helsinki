const { test, expect } = require('@playwright/test');

test('Build 33 Malmi zones render and stay world-anchored', async ({ page }) => {
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4173/index.html');
  await expect(page.locator('canvas#game')).toBeVisible();
  await expect(page.locator('h1 small')).toContainText('BUILD 33');
  const r=await page.evaluate(()=>{
    area='malmi'; mobs=[]; shots=[]; drops=[]; bursts=[];
    p.x=4.5*T;p.y=10.5*T; const yla=malmiZone(); draw();
    const ylaPixel=[...g.getImageData(12*T,7*T,1,1).data];
    p.x=30*T;p.y=10*T; const ala=malmiZone(); draw();
    const hard=(()=>{let old=Math.random;Math.random=()=>0;spawnMob();Math.random=old;let m=mobs[mobs.length-1];return m?{hp:m.max,dmg:m.dmg}:null})();
    const fixed={gx:20,gy:10}; const a=camera(); const sx1=fixed.gx*T-a.x,sy1=fixed.gy*T-a.y;
    p.x-=64;p.y+=32; const b=camera(); const sx2=fixed.gx*T-b.x,sy2=fixed.gy*T-b.y; draw();
    return {yla,ala,hard,delta:[sx2-sx1,sy2-sy1],expected:[a.x-b.x,a.y-b.y],ylaPixel};
  });
  expect(r.yla).toBe('yla'); expect(r.ala).toBe('ala');
  expect(r.hard.hp).toBe(24); expect(r.hard.dmg).toBe(6);
  expect(r.delta).toEqual(r.expected);
  expect(errors).toEqual([]);
});