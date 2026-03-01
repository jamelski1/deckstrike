/**
 * cli.ts — DECKSTRIKE command-line entry point.
 *
 * Usage:
 *   npx ts-node src/cli.ts --input sample.json --out output.png --width 1920 --height 1080
 *
 * Reads a JSON data file, renders an SVG infographic, converts to PNG,
 * and writes the result to disk.
 */

import * as fs from 'fs';
import * as path from 'path';
import { renderSvg, InfographicData } from './render';
import { svgToPng } from './export';

// ─── Default Dimensions ────────────────────────────────────────────────────────
const DEFAULT_WIDTH = 1920;
const DEFAULT_HEIGHT = 1080;

// ─── Argument Parsing ──────────────────────────────────────────────────────────

interface CliArgs {
  input: string;
  out: string;
  width: number;
  height: number;
}

function parseArgs(argv: string[]): CliArgs {
  const args: Partial<CliArgs> = {};

  for (let i = 2; i < argv.length; i++) {
    switch (argv[i]) {
      case '--input':
        args.input = argv[++i];
        break;
      case '--out':
        args.out = argv[++i];
        break;
      case '--width':
        args.width = parseInt(argv[++i], 10);
        break;
      case '--height':
        args.height = parseInt(argv[++i], 10);
        break;
      default:
        console.error(`Unknown argument: ${argv[i]}`);
        process.exit(1);
    }
  }

  if (!args.input) {
    console.error('Error: --input is required');
    console.error('Usage: npx ts-node src/cli.ts --input <file.json> --out <output.png> [--width N] [--height N]');
    process.exit(1);
  }

  return {
    input: args.input,
    out: args.out || 'output.png',
    width: args.width || DEFAULT_WIDTH,
    height: args.height || DEFAULT_HEIGHT,
  };
}

// ─── Main ──────────────────────────────────────────────────────────────────────

function main(): void {
  const args = parseArgs(process.argv);

  // 1. Read JSON input
  const inputPath = path.resolve(args.input);
  if (!fs.existsSync(inputPath)) {
    console.error(`Error: Input file not found: ${inputPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(inputPath, 'utf-8');
  const data: InfographicData = JSON.parse(raw);

  console.log(`DECKSTRIKE — Neutralizing PowerPoint Since 2026.`);
  console.log(`Input:  ${inputPath}`);
  console.log(`Output: ${path.resolve(args.out)}`);
  console.log(`Size:   ${args.width}×${args.height}`);
  console.log('');

  // 2. Generate SVG
  console.log('[1/3] Rendering SVG...');
  const svg = renderSvg(data, args.width, args.height);

  // 2a. Also save the SVG for standalone viewing
  const svgPath = args.out.replace(/\.png$/i, '.svg');
  fs.writeFileSync(svgPath, svg, 'utf-8');
  console.log(`      SVG saved: ${svgPath}`);

  // 3. Convert SVG → PNG
  console.log('[2/3] Converting to PNG...');
  const png = svgToPng(svg, { width: args.width, height: args.height });

  // 4. Write PNG to disk
  console.log('[3/3] Writing file...');
  const outPath = path.resolve(args.out);
  fs.writeFileSync(outPath, png);

  const sizeKb = (png.length / 1024).toFixed(1);
  console.log('');
  console.log(`Done. ${sizeKb} KB written to ${outPath}`);
  console.log('Target neutralized.');
}

main();
