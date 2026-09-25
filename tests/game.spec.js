const { test, expect } = require('@playwright/test');

test('Hoods smoke + Malmi world anchoring', async ({ page }) => {
  const errors=[];
  page.on('pageerror', e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4173/index.html');
  await expect(page.locator('canvas#game')).toBeVisible();
  await expect(page.locator('h1 small')).toContainText('BUILD 32');

  const result=await page.evaluate(() => {
    area='malmi'; p.x=26.5*T; p.y=10.5*T; mobs=[]; shots=[]; drops=[]; bursts=[];
    const sample=(gx,gy)=>{
      const cam=camera();
      return {cam, screen:{x:gx*T-cam.x,y:gy*T-cam.y},
        vertical:(gx>=14&&gx<=16)||(gx>=25&&gx<=27),
        horizontal:(gy>=5&&gy<=6)||(gy>=10&&gy<=11),
        lit:((gx*13+gy*7)|0)%5===0};
    };
    const a=sample(25,10);
    p.x-=96; p.y+=64;
    const b=sample(25,10);
    draw();
    return {a,b,player:{x:p.x,y:p.y},cam:camera()};
  });
  expect(result.a.vertical).toBe(result.b.vertical);
  expect(result.a.horizontal).toBe(result.b.horizontal);
  expect(result.a.lit).toBe(result.b.lit);
  expect(result.b.screen.x-result.a.screen.x).toBe(result.a.cam.x-result.b.cam.x);
  expect(result.b.screen.y-result.a.screen.y).toBe(result.a.cam.y-result.b.cam.y);
  expect(errors).toEqual([]);
});