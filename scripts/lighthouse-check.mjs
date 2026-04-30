#!/usr/bin/env node
// Runs Lighthouse on a URL, saves both HTML and JSON reports, and exits with code 1
// if any category score falls below the defined strict thresholds.

import { execSync } from 'child_process';
import { readFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// Define the minimum allowed scores (0.0 to 1.0)
const THRESHOLDS = {
  performance: 0.85,
  accessibility: 0.90,
  'best-practices': 0.90,
  seo: 0.90,
};

const baseTarget = process.env.LIGHTHOUSE_TARGET;

const reportPath = 'lighthouse-reports'

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

  console.log(`\n🔍 Auditing: ${url}`);

  try {
    // Generate both files simultaneously
    execSync(
      `npx lighthouse ${url} ` +
      `--output json --output html ` +
      `--output-path ${reportPath}/${name} ` +
      `--preset=desktop ` +
      `--chrome-flags="--headless --no-sandbox --disable-dev-shm-usage"`,
      { stdio: 'inherit' }
    );
  } catch (error) {
    console.warn(`Lighthouse execution threw a warning/error, checking generated report anyway...`);
  }

  try {
    const reportRaw = readFileSync(jsonPath, 'utf8');
    const report = JSON.parse(reportRaw);
    const categories = report.categories;

    console.log(`\n📊 Scores for ${url}:`);

    let pageFailed = false;

    for (const [key, threshold] of Object.entries(THRESHOLDS)) {
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

    if (pageFailed) {
      console.log(`\n❌ ${url} did not meet strict thresholds.`);
      globalFailed = true;
    } else {
      console.log(`\n✅ ${url} passed all strict thresholds.`);
    }
  } catch (error) {
    console.error(`Failed to parse report for ${url}. Error: ${error.message}`);
    globalFailed = true;
  }
}

if (globalFailed) {
  console.log('\n💥 Lighthouse audit failed. Fix the issues above or adjust scripts/lighthouse-check.mjs.');
  process.exit(1);
}

console.log('\n🎉 All pages passed the strict Lighthouse audit.');
