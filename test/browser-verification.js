import { chromium } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

const ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity-ide/brain/3f2a91d3-a9a2-47ef-9f4b-1d236466fd94';

async function runBrowserVerification() {
  console.log('🚀 Launching Playwright browser verification...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  // Step 1: Navigate to game
  console.log('1. Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Step 2: Open Shop
  console.log('2. Opening Shop Modal...');
  await page.click('#start-shop-btn');
  await page.waitForTimeout(500);

  // Verify Featured Banner
  const featuredBanner = await page.$('.legendary-featured-banner');
  console.log('Featured Banner present:', !!featuredBanner);

  // Take screenshot of Shop Featured Tab
  const shopFeaturedPath = path.join(ARTIFACT_DIR, 'shop_legendary_featured.png');
  await page.screenshot({ path: shopFeaturedPath });
  console.log('Saved screenshot:', shopFeaturedPath);

  // Step 3: Switch to Characters Tab in Shop
  console.log('3. Switching to Characters / Runners Tab in Shop...');
  await page.click('#shop-tabs .arcade-tab-btn[data-cat="CHARACTERS"]');
  await page.waitForTimeout(500);

  const modiCard = await page.$('.legendary-character-card');
  console.log('Modi Legendary Card present:', !!modiCard);

  const priceText = await page.$eval('.legendary-character-card .char-price-value', el => el.textContent?.trim());
  console.log('Modi Card Price text:', priceText);

  // Take screenshot of Shop Characters Tab
  const shopCharsPath = path.join(ARTIFACT_DIR, 'shop_characters_tab.png');
  await page.screenshot({ path: shopCharsPath });
  console.log('Saved screenshot:', shopCharsPath);

  // Step 4: Click 3D Preview button
  console.log('4. Clicking 3D Preview button...');
  await page.click('.btn-view-3d[data-char="char_modi"]');
  await page.waitForTimeout(800);

  // Verify Character Showroom opened
  const charModal = await page.$('#character-select-modal');
  const isCharModalVisible = await charModal.evaluate(el => !el.classList.contains('hidden'));
  console.log('Showroom active:', isCharModalVisible);

  const charName = await page.$eval('#char-name', el => el.textContent?.trim());
  console.log('Selected Character in Showroom:', charName);

  const angleButtons = await page.$$('.view-angle-btn');
  console.log('Number of view angle buttons in Showroom:', angleButtons.length);

  // Cycle angle buttons
  for (const btn of angleButtons) {
    const label = await btn.textContent();
    console.log(`Clicking angle preset: ${label?.trim()}`);
    await btn.click();
    await page.waitForTimeout(200);
  }

  // Take screenshot of Showroom
  const showroomPath = path.join(ARTIFACT_DIR, 'showroom_modi_3d.png');
  await page.screenshot({ path: showroomPath });
  console.log('Saved screenshot:', showroomPath);

  // Step 5: Test Insufficient Coins Behavior
  console.log('5. Testing purchase attempt with insufficient coins (0 coins)...');
  await page.click('#char-close-btn');
  await page.waitForTimeout(500);

  // Click Shop button again
  await page.click('#start-shop-btn');
  await page.waitForTimeout(500);
  await page.click('#shop-tabs .arcade-tab-btn[data-cat="CHARACTERS"]');
  await page.waitForTimeout(300);

  // Click Buy with 0 coins
  await page.click('.btn-buy-char[data-char="char_modi"]');
  await page.waitForTimeout(500);

  // Step 6: Inject 150,000 Coins via localStorage and reload
  console.log('6. Injecting 150,000 coins into localStorage and reloading...');
  await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('metro_progression_v1') || '{}');
    state.totalCoins = 150000;
    state.unlockedCharacters = ['char_jax'];
    state.selectedCharacter = 'char_jax';
    state.unlockedOutfits = { char_jax: ['jax_classic'] };
    state.selectedOutfit = { char_jax: 'jax_classic' };
    localStorage.setItem('metro_progression_v1', JSON.stringify(state));
  });

  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Step 7: Purchase Narendra Modi with 100,000 Coins
  console.log('7. Purchasing Narendra Modi with 100,000 Coins...');
  await page.click('#start-shop-btn');
  await page.waitForTimeout(500);
  await page.click('#shop-tabs .arcade-tab-btn[data-cat="CHARACTERS"]');
  await page.waitForTimeout(300);

  // Verify wallet before purchase
  const coinsBefore = await page.evaluate(() => {
    return JSON.parse(localStorage.getItem('metro_progression_v1') || '{}').totalCoins;
  });
  console.log('Coins before purchase:', coinsBefore);

  await page.click('.btn-buy-char[data-char="char_modi"]');
  await page.waitForTimeout(600);

  // Verify wallet after purchase
  const coinsAfter = await page.evaluate(() => {
    return JSON.parse(localStorage.getItem('metro_progression_v1') || '{}').totalCoins;
  });
  console.log('Coins after purchase:', coinsAfter);

  const isUnlocked = await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('metro_progression_v1') || '{}');
    return state.unlockedCharacters.includes('char_modi');
  });
  console.log('Is char_modi permanently unlocked in storage:', isUnlocked);

  // Verify button state
  const buttonText = await page.$eval('.btn-buy-char[data-char="char_modi"]', el => el.textContent?.trim());
  console.log('Modi card button text after purchase:', buttonText);

  // Take screenshot of purchased state
  const shopPurchasedPath = path.join(ARTIFACT_DIR, 'shop_purchased_modi.png');
  await page.screenshot({ path: shopPurchasedPath });
  console.log('Saved screenshot:', shopPurchasedPath);

  // Step 8: Equip Narendra Modi and close shop
  console.log('8. Equipping Narendra Modi and closing shop...');
  if (buttonText.includes('EQUIP') && !buttonText.includes('EQUIPPED')) {
    await page.click('.btn-buy-char[data-char="char_modi"]');
    await page.waitForTimeout(300);
  }
  await page.click('#shop-close-btn');
  await page.waitForTimeout(500);

  // Verify equipped character in storage
  const activeChar = await page.evaluate(() => {
    return JSON.parse(localStorage.getItem('metro_progression_v1') || '{}').selectedCharacter;
  });
  console.log('Active equipped runner:', activeChar);

  // Step 9: Start run and verify gameplay
  console.log('9. Starting gameplay run...');
  const startBtn = await page.$('#start-btn');
  if (startBtn) {
    await startBtn.click();
  } else {
    await page.keyboard.press('Space');
  }
  await page.waitForTimeout(1000);

  // Perform jump and slide
  await page.keyboard.press('ArrowUp');
  await page.waitForTimeout(400);
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(400);

  // Take screenshot during gameplay
  const gameplayPath = path.join(ARTIFACT_DIR, 'gameplay_modi.png');
  await page.screenshot({ path: gameplayPath });
  console.log('Saved gameplay screenshot:', gameplayPath);

  await browser.close();
  console.log('🎉 Browser verification finished successfully!');
}

runBrowserVerification().catch(err => {
  console.error('❌ Browser verification error:', err);
  process.exit(1);
});
