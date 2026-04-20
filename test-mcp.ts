import { getBaziChart } from './src/lib/bazi-mcp-client';

async function test() {
  try {
    const chart = await getBaziChart('1990-01-01T12:00:00', 'male');
    console.log('Chart:', JSON.stringify(chart, null, 2));
  } catch (err) {
    console.error('Test failed:', err);
  }
}

test();
