#!/usr/bin/env node
// Runs Lighthouse on a URL, saves both HTML and JSON reports, and exits with code 1
// if any category score falls below the defined strict thresholds.

import { execSync } from 'child_process';
import { readFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// Define the minimum allowed scores (0.0 to 1.0)
const IS_CI = process.env.CI === 'true';

const baseTarget = process.env.LIGHTHOUSE_TARGET;
const preset = process.env.LIGHTHOUSE_PRESET || 'desktop';
const reportPath = join('lighthouse-reports', preset);

const THRESHOLDS = {
  // Lower threshold in CI to account for unstable virtualized CPU/Network
  performance: (IS_CI && preset === 'mobile') ? 0.70 : 0.80,
  accessibility: 0.90,
  'best-practices': 0.90,
  seo: 0.90,
};

const urls = [
  { url: `${baseTarget}/`, name: 'index' },
  { url: `${baseTarget}/music/`, name: 'music' },
  { url: `${baseTarget}/news/`, name: 'news' },
  { url: `${baseTarget}/shows/`, name: 'shows' },
  { url: `${baseTarget}/video/`, name: 'video' },
  { url: `${baseTarget}/about/`, name: 'about' },
  { url: `${baseTarget}/contact/`, name: 'contact' },
];

// Ensure output directory exists
mkdirSync(reportPath, { recursive: true });

let globalFailed = false;

for (const { url, name } of urls) {
  const jsonPath = join(reportPath, `${name}.report.json`);
  const MAX_RETRIES = 3;
  let attempts = 0;
  let success = false;

  while (attempts < MAX_RETRIES && !success) {
    attempts++;
    console.log(`\n🔍 Auditing [${preset}] (Attempt ${attempts}/${MAX_RETRIES}): ${url}`);

    try {
      // Generate both files simultaneously
      execSync(
        `npx lighthouse ${url} ` +
        `--output json --output html ` +
        `--output-path ${join(reportPath, name)} ` +
        (preset !== 'mobile' ? `--preset=${preset} ` : '') +
        `--quiet ` +
        `--chrome-flags="--headless --no-sandbox --disable-dev-shm-usage"`,
        { stdio: 'inherit' }
      );

      const reportRaw = readFileSync(jsonPath, 'utf8');
      const report = JSON.parse(reportRaw);
      const categories = report.categories;

      console.log(`\n📊 Scores for ${url}:`);

      let pageFailed = false;
      
      // Page-specific overrides for external constraints (like Songkick third-party cookies)
      const pageThresholds = { ...THRESHOLDS };
      if (name === 'shows') {
        pageThresholds['best-practices'] = 0.75;
      }

      for (const [key, threshold] of Object.entries(pageThresholds)) {
        const category = categories[key];
        if (!category) continue;

        const score = category.score;
        const pct = Math.round(score * 100);
        const min = Math.round(threshold * 100);
        const pass = score >= threshold;
        const icon = pass ? '✅' : '❌';

        console.log(`  ${icon} ${category.title}: ${pct} (min: ${min})`);

        if (!pass) pageFailed = true;
      }

      if (!pageFailed) {
        console.log(`\n✅ ${url} passed all thresholds on attempt ${attempts}.`);
        success = true;
      } else {
        console.warn(`\n⚠️ ${url} failed thresholds on attempt ${attempts}.`);
      }
    } catch (error) {
      console.error(`Attempt ${attempts} failed for ${url}. Error: ${error.message}`);
    }
  }

  if (!success) {
    console.error(`\n❌ ${url} failed after ${MAX_RETRIES} attempts.`);
    globalFailed = true;
  }
}

if (globalFailed) {
  console.log('\n💥 Lighthouse audit failed after retries. Fix the issues above or adjust scripts/lighthouse-check.mjs.');
  process.exit(1);
}

console.log('\n🎉 All pages passed the strict Lighthouse audit.');
