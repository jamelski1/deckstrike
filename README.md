# DECKSTRIKE

**Neutralizing PowerPoint Since 2026.**

A CLI tool that generates military-themed infographic PNGs from structured JSON data. No frontend, no network calls, no database — just clean SVG rendering and PNG export.

## Install

```bash
npm install
```

## Build

```bash
npm run build
```

## Usage

```bash
npx ts-node src/cli.ts --input sample.json --out output.png --width 1920 --height 1080
```

Or use the shortcut:

```bash
npm run generate
```

### CLI Arguments

| Flag       | Required | Default      | Description              |
|------------|----------|--------------|--------------------------|
| `--input`  | Yes      | —            | Path to JSON data file   |
| `--out`    | No       | `output.png` | Output PNG file path     |
| `--width`  | No       | `1920`       | Canvas width in pixels   |
| `--height` | No       | `1080`       | Canvas height in pixels  |

## Input Format

See `sample.json` for the full schema. The JSON file should contain:

- `title` — Main infographic title
- `subtitle` — Subtitle text
- `classification` — Classification banner text
- `cards` — Array of 4 info cards (label, heading, body)
- `chart` — Line chart data (title + array of [x, y] points)
- `takeaways` — Array of bullet-point strings
- `footer` — Footer text

## Project Structure

```
src/
  cli.ts      — CLI entry point and argument parsing
  render.ts   — SVG layout engine (composes all zones)
  chart.ts    — Line chart SVG renderer
  text.ts     — Text measurement and wrapping utilities
  export.ts   — SVG → PNG conversion via resvg-js
```

## Tech Stack

- TypeScript
- Node.js
- [@resvg/resvg-js](https://github.com/nicolo-ribaudo/resvg-js) for SVG → PNG
