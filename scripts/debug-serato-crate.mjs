#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { basename } from "node:path";

const paths = process.argv.slice(2);

if (paths.length === 0) {
  console.error("Usage: node scripts/debug-serato-crate.mjs <crate-file> [crate-file...]");
  process.exit(1);
}

function readTag(buffer, offset) {
  return buffer.subarray(offset, offset + 4).toString("ascii");
}

function decodeUtf16BE(buffer) {
  let result = "";
  for (let i = 0; i + 1 < buffer.length; i += 2) {
    const code = buffer.readUInt16BE(i);
    if (code === 0) break;
    result += String.fromCharCode(code);
  }
  return result;
}

function hexPreview(buffer, start, length = 160) {
  const safeStart = Math.max(0, start);
  const slice = buffer.subarray(safeStart, Math.min(buffer.length, safeStart + length));
  return Array.from(slice)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join(" ");
}

function classifyPath(value) {
  return {
    startsWithSlash: value.startsWith("/"),
    startsWithFileUrl: value.startsWith("file://"),
    containsPercentEncoding: /%[0-9A-Fa-f]{2}/.test(value),
    containsColonSeparator: value.includes(":"),
    looksMacAbsolute: value.startsWith("/Users/") || value.startsWith("/Volumes/"),
  };
}

function looksLikeTlv(buffer, start, end) {
  if (start + 8 > end) return false;
  const tag = readTag(buffer, start);
  if (!/^[A-Za-z0-9_ ]{4}$/.test(tag)) return false;
  const length = buffer.readUInt32BE(start + 4);
  return length >= 0 && start + 8 + length <= end;
}

function parseRecords(buffer, start = 0, end = buffer.length, depth = 0, out = [], all = []) {
  let offset = start;
  while (offset + 8 <= end) {
    const tag = readTag(buffer, offset);
    const length = buffer.readUInt32BE(offset + 4);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    if (length < 0 || dataEnd > end) break;

    const data = buffer.subarray(dataStart, dataEnd);
    const decoded = decodeUtf16BE(data);
    all.push({
      tag,
      offset,
      length,
      depth,
      decoded,
      rawHexAroundTag: hexPreview(buffer, offset, Math.min(length + 8, 220)),
    });

    if (tag === "pfil") {
      out.push({
        tag,
        offset,
        length,
        decoded,
        rawHexAroundTag: hexPreview(buffer, offset, Math.min(length + 8, 220)),
      });
    }

    if (looksLikeTlv(buffer, dataStart, dataEnd)) {
      parseRecords(buffer, dataStart, dataEnd, depth + 1, out, all);
    }

    offset = dataEnd;
  }
  return { pfilRecords: out, allRecords: all };
}

for (const cratePath of paths) {
  const buffer = readFileSync(cratePath);
  const { pfilRecords, allRecords } = parseRecords(buffer);
  console.log("\n===", basename(cratePath), "===");
  console.log("path:", cratePath);
  console.log("bytes:", buffer.length);
  console.log("top tags:", allRecords.filter((record) => record.depth === 0).map((record) => `${record.tag}:${record.length}`).join(", "));
  console.log("all tag counts:", JSON.stringify(allRecords.reduce((acc, record) => {
    acc[record.tag] = (acc[record.tag] ?? 0) + 1;
    return acc;
  }, {})));
  console.log("pfil records:", pfilRecords.length);
  pfilRecords.slice(0, 10).forEach((record, index) => {
    console.log(`\n[pfil ${index + 1}] offset=${record.offset} length=${record.length}`);
    console.log("decoded:", record.decoded);
    console.log("classification:", JSON.stringify(classifyPath(record.decoded)));
    console.log("raw hex:", record.rawHexAroundTag);
  });
  const decodedPathLike = allRecords.filter((record) => {
    const value = record.decoded;
    return value.includes("/") || value.startsWith("file://") || value.includes("%2F") || value.includes(":");
  });
  console.log("\npath-like decoded records:", decodedPathLike.length);
  decodedPathLike.slice(0, 20).forEach((record, index) => {
    console.log(`\n[path-like ${index + 1}] tag=${record.tag} depth=${record.depth} offset=${record.offset} length=${record.length}`);
    console.log("decoded:", record.decoded);
    console.log("classification:", JSON.stringify(classifyPath(record.decoded)));
    console.log("raw hex:", record.rawHexAroundTag);
  });
}
