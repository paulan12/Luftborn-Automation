import fs from 'node:fs';
import path from 'node:path';

const TEST_DATA_DIR = path.resolve(__dirname, '../../test-data');

export interface SearchFilter {
  group: string;
  value: string;
}

export interface SearchScenario {
  name: string;
  searchTerm: string;
  minimumExpectedResults: number;
  filter: SearchFilter;
}

export interface EbaySearchData {
  baseUrl: string;
  shippingDestination: { country: string; postalCode: string };
  homePage: {
    expectedTitle: string;
    expectedUrlPattern: string;
  };
  scenarios: SearchScenario[];
}

/** Reads and parses a JSON file from the test-data folder. */
export function readJson<T>(fileName: string): T {
  const filePath = path.join(TEST_DATA_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Test data file not found: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
}
