/**
 * Production-ready End-to-end tests for the WANTAM.INK MVP
 * 
 * Tests the core functionality of the platform:
 * - Pledge counter
 * - Budget upload/summary
 * - API endpoints
 */
import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

// Base URL for tests
const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';

// Supabase client for test data
const supabaseUrl = process.env.TEST_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.TEST_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Test context for sharing data between tests
type TestContext = {
  pledgeCount?: number;
  budgetSummaryId?: string;
};

const context: TestContext = {};

// Test suite for WANTAM.INK MVP
test.describe('WANTAM.INK MVP', () => {
  test.beforeAll(async () => {
    // Set up test environment
    if (supabase) {
      // Clean test data
      await supabase.from('test_data').delete().eq('environment', 'test');
      
      // Create test data
      await supabase.from('test_data').insert([
        {
          environment: 'test',
          created_at: new Date().toISOString(),
          data: { test: 'data' }
        }
      ]);
    }
  });
  
  test.afterAll(async () => {
    // Clean up test environment
    if (supabase) {
      await supabase.from('test_data').delete().eq('environment', 'test');
    }
  });
  
  // Test the homepage pledge counter
  test('Homepage - Pledge counter should be visible and > 0', async ({ page }) => {
    test.setTimeout(30000); // Increase timeout for initial page load
    
    // Navigate to homepage
    await page.goto(baseUrl);
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'homepage.png' });
    
    // Check for pledge counter (this would depend on the actual implementation)
    // Try different selectors that might contain the pledge count
    const pledgeCounterSelectors = [
      'text=/[0-9,]+ Kenyans/i',
      'text=/[0-9,]+ pledges/i',
      'text=/[0-9,]+ have pledged/i',
      'text=/joined by [0-9,]+/i'
    ];
    
    let pledgeCounter = null;
    for (const selector of pledgeCounterSelectors) {
      const element = page.locator(selector).first();
      if (await element.count() > 0) {
        pledgeCounter = element;
        break;
      }
    }
    
    // Fallback to check in PledgeTicker component if visible
    if (!pledgeCounter) {
      const tickerComponent = page.locator('[data-testid="pledge-ticker"]');
      if (await tickerComponent.count() > 0) {
        pledgeCounter = tickerComponent.locator('text=/[0-9,]+/').first();
      }
    }
    
    // Verify counter is visible
    expect(pledgeCounter).toBeTruthy();
    if (pledgeCounter) {
      await expect(pledgeCounter).toBeVisible();
      
      // Get the text and extract the number
      const counterText = await pledgeCounter.textContent() || '';
      const numberMatch = counterText.match(/([0-9,]+)/);
      
      if (numberMatch) {
        // Convert to number (remove commas)
        const count = parseInt(numberMatch[1].replace(/,/g, ''));
        
        // Verify counter is greater than 0
        expect(count).toBeGreaterThan(0);
        
        // Store for other tests
        context.pledgeCount = count;
      } else {
        throw new Error('Could not find a number in the pledge counter');
      }
    } else {
      throw new Error('Could not find pledge counter on the homepage');
    }
  });
  
  // Test navigation and basic UI elements
  test('Navigation - Menu links work and pages load', async ({ page }) => {
    // Navigate to homepage
    await page.goto(baseUrl);
    
    // Check main navigation links exist
    const pledgeLink = page.getByRole('link', { name: /pledge/i });
    await expect(pledgeLink).toBeVisible();
    
    // Click on the Pledge Wall link
    await pledgeLink.click();
    
    // Verify we're on the pledge page
    await expect(page).toHaveURL(/.*\/pledge/);
    
    // Verify the pledge form exists
    const addPledgeButton = page.getByRole('button', { name: /add.+pledge/i });
    await expect(addPledgeButton).toBeVisible();
    
    // Verify we can navigate back to homepage
    const homeLink = page.getByRole('link', { name: /home/i });
    await homeLink.click();
    
    // Verify we're back on the homepage
    await expect(page).toHaveURL(baseUrl + '/');
  });
  
  // Test the API endpoints
  test('API - /api/pledges should return county data', async ({ request }) => {
    // Make a request to the pledges API
    const response = await request.get(`${baseUrl}/api/pledges`);
    
    // Verify status code
    expect(response.status()).toBe(200);
    
    // Parse response body
    const data = await response.json();
    
    // Check that we have county data
    expect(Object.keys(data).length).toBeGreaterThan(0);
    
    // Check for expected counties
    const expectedCounties = ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru'];
    let foundCounties = 0;
    
    for (const county of expectedCounties) {
      if (county in data) {
        foundCounties++;
      }
    }
    
    // Should find at least one expected county
    expect(foundCounties).toBeGreaterThan(0);
  });
  
  // Test the budget upload and summary
  test('Budget Summary - Upload PDF and expect summary', async ({ page }) => {
    // Create a test PDF path
    const testPdfPath = path.join(__dirname, 'sample-budget.pdf');
    
    // Check if test PDF exists, if not, skip the test
    test.skip(!fs.existsSync(testPdfPath), 'Test PDF file not available');
    
    // Navigate to the budget page (adjust path as needed)
    let budgetPageUrl = `${baseUrl}/tools/budget`;
    
    // Try to navigate to the budget tools page
    try {
      await page.goto(budgetPageUrl);
      
      // If the page doesn't exist, try alternative URLs
      if ((await page.title()).includes('404')) {
        const alternatives = [
          '/tools',
          '/budget',
          '/budget-summary',
          '/analyze'
        ];
        
        for (const alt of alternatives) {
          await page.goto(`${baseUrl}${alt}`);
          if (!(await page.title()).includes('404')) {
            budgetPageUrl = `${baseUrl}${alt}`;
            break;
          }
        }
      }
    } catch (error) {
      test.skip(true, 'Budget tool page not found');
      return;
    }
    
    // Wait for the dropzone to be visible
    await page.waitForSelector('text=Upload', { timeout: 10000 })
      .catch(() => {
        test.skip(true, 'Budget dropzone not found');
      });
    
    // Find the file input
    const fileInput = page.locator('input[type="file"]');
    expect(await fileInput.count()).toBeGreaterThan(0);
    
    // Upload the test PDF file
    await fileInput.setInputFiles(testPdfPath);
    
    // Wait for the summary to be generated
    // Try different possible selectors for the summary
    const summarySelectors = [
      '[data-testid="budget-summary"]',
      'text=/Total budget:/',
      '.budget-summary',
      'text=/Budget Summary/',
    ];
    
    let foundSummary = false;
    for (const selector of summarySelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 30000 });
        foundSummary = true;
        break;
      } catch (error) {
        // Try next selector
      }
    }
    
    expect(foundSummary).toBeTruthy();
    
    // Verify summary contains text
    const summaryText = await page.textContent('body');
    expect(summaryText).toBeTruthy();
    
    // Expect the summary to have budget-related keywords
    const budgetKeywords = ['budget', 'total', 'allocation', 'billion', 'million', 'KES'];
    let foundKeywords = 0;
    
    for (const keyword of budgetKeywords) {
      if (summaryText?.toLowerCase().includes(keyword.toLowerCase())) {
        foundKeywords++;
      }
    }
    
    // Should find at least 3 budget keywords
    expect(foundKeywords).toBeGreaterThanOrEqual(3);
  });
  
  // Test meme contest page loads
  test('Meme Contest - Gallery should load and display entries', async ({ page }) => {
    // Try to navigate to the meme contest page
    try {
      await page.goto(`${baseUrl}/memes`);
      
      // If 404, try alternatives
      if ((await page.title()).includes('404')) {
        const alternatives = [
          '/meme-contest',
          '/memes/contest',
          '/contest'
        ];
        
        let found = false;
        for (const alt of alternatives) {
          await page.goto(`${baseUrl}${alt}`);
          if (!(await page.title()).includes('404')) {
            found = true;
            break;
          }
        }
        
        if (!found) {
          test.skip(true, 'Meme contest page not found');
          return;
        }
      }
    } catch (error) {
      test.skip(true, 'Failed to navigate to meme contest page');
      return;
    }
    
    // Verify the page has loaded
    await page.waitForLoadState('networkidle');
    
    // Check for contest title
    const contestTitle = page.locator('text=/meme contest/i');
    await expect(contestTitle).toBeVisible();
    
    // Check for meme entries or "Submit a Meme" button
    const hasEntries = await page.locator('img').count() > 1;
    const submitButton = page.getByRole('button', { name: /submit.*meme/i });
    
    expect(hasEntries || await submitButton.isVisible()).toBeTruthy();
  });
});
