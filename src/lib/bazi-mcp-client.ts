// ============================================================
// BaZi MCP Client — Calls cantian-ai/bazi-mcp
//
// The bazi-mcp server runs locally as a Node.js process.
// We call it via MCP protocol or, for simplicity in web context,
// we import the calculation functions directly.
//
// Installation: npx bazi-mcp (or run as child process)
// ============================================================

import { spawn } from 'child_process';

interface BaziMCPRequest {
  method: string;
  params: Record<string, unknown>;
}

interface BaziMCPResponse {
  result: unknown;
  error?: string;
}

/**
 * Call bazi-mcp via stdio MCP protocol.
 * The server accepts JSON-RPC style messages over stdin/stdout.
 */
export async function callBaziMCP(
  toolName: string,
  args: Record<string, unknown>
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const child = spawn('node', ['/root/bazi-mcp/dist/stdio.js'], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const request = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args,
      },
    });

    let output = '';

    child.stdout.on('data', (data: Buffer) => {
      output += data.toString();
    });

    child.stderr.on('data', (data: Buffer) => {
      console.error('[bazi-mcp stderr]:', data.toString());
    });

    child.on('close', (code) => {
      if (code !== 0) {
        console.error(`bazi-mcp process exited with code ${code}`);
      }
      try {
        const lines = output.split('\n').filter(l => l.trim());
        const lastLine = lines[lines.length - 1];
        if (!lastLine) {
            reject(new Error(`Empty response from bazi-mcp: ${output}`));
            return;
        }
        const parsed = JSON.parse(lastLine);
        resolve(parsed.result || parsed);
      } catch (e) {
        reject(new Error(`Failed to parse bazi-mcp response: ${output}`));
      }
    });

    child.stdin.write(request + '\n');
    child.stdin.end();
  });
}

/**
 * Alternative: HTTP wrapper for bazi-mcp.
 * If you run bazi-mcp as an HTTP server (via MCP-to-HTTP bridge),
 * use this instead.
 */
export async function callBaziMCPHttp(
  toolName: string,
  args: Record<string, unknown>
): Promise<unknown> {
  const response = await fetch(
    process.env.BAZI_MCP_URL || 'http://localhost:3001/mcp',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: { name: toolName, arguments: args },
      }),
    }
  );

  const data = await response.json();
  return data.result;
}

/**
 * Get full BaZi chart from birth data.
 * Returns the structured JSON from cantian-ai/bazi-mcp.
 */
export async function getBaziChart(
  birthDatetime: string, // ISO format: "1985-05-05T03:15:00"
  gender: 'male' | 'female',
): Promise<any> {
  const result = await callBaziMCP('getBaziDetail', {
    solarDatetime: birthDatetime,
    gender: gender === 'male' ? 1 : 0,
  });

  return result;
}
