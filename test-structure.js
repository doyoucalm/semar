const { getBaziChart } = require('./src/lib/bazi-mcp-client');

async function test() {
  try {
    const result = await getBaziChart('1990-01-01T12:00:00', 'male');
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error(err);
  }
}

test();
