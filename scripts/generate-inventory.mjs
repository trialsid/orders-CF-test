import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'csv-parse/sync';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const CSV_FILE = path.join(projectRoot, 'proposed-280-SKUs.csv');
const OUTPUT_FILE = path.join(projectRoot, 'functions', '_inventory-data.json');

const HEADERS = {
  itemCode: 'Item Code',
  productName: 'Product Name',
  departmentName: 'Department Name',
  categoryName: 'Category Name',
  avgSellingPrice: 'Avg Selling Price (₹)',
  avgMrp: 'Avg MRP (₹)',
};

const roundHalf = (value) => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.round(value * 2) / 2;
};

const parseNumber = (value) => {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.replace(/,/g, '').trim();
    if (!normalized) {
      return NaN;
    }
    return Number(normalized);
  }
  return NaN;
};

const createDescription = (department, category) => {
  const parts = [department, category].filter(Boolean);
  if (parts.length === 0) {
    return 'Popular store pick';
  }
  return parts.join(' • ');
};

async function generateInventory() {
  const csvContent = await fs.readFile(CSV_FILE, 'utf8');
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  const items = records
    .map((record) => {
      const id = String(record[HEADERS.itemCode] ?? '').trim();
      if (!id) {
        return null;
      }
      const name = String(record[HEADERS.productName] ?? '').trim();
      const department = String(record[HEADERS.departmentName] ?? '').trim();
      const category = String(record[HEADERS.categoryName] ?? '').trim();
      const sellingPrice = parseNumber(record[HEADERS.avgSellingPrice]);
      const mrpValue = parseNumber(record[HEADERS.avgMrp]);

      const roundedPrice = Number.isFinite(sellingPrice) ? roundHalf(sellingPrice) : 0;
      const roundedMrp = Number.isFinite(mrpValue) ? Math.round(mrpValue) : 0;

      return {
        id,
        name,
        description: createDescription(department, category),
        department,
        category,
        price: Number(roundedPrice.toFixed(2)),
        mrp: roundedMrp,
        rawSellingPrice: Number.isFinite(sellingPrice) ? Number(sellingPrice.toFixed(2)) : 0,
      };
    })
    .filter(Boolean);

  await fs.writeFile(OUTPUT_FILE, JSON.stringify(items, null, 2));
  console.log(`Wrote ${items.length} products to ${path.relative(projectRoot, OUTPUT_FILE)}`);
}

generateInventory().catch((error) => {
  console.error('Failed to generate inventory', error);
  process.exitCode = 1;
});
