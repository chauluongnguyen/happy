#!/usr/bin/env node
/* eslint-disable */
const fs = require("fs/promises");
const path = require("path");
const qrcode = require("qrcode");
const sharp = require("sharp");

const url = process.argv[2];
if (!url) {
  console.error("");
  console.error("Cách dùng:");
  console.error("  npm run generate-card -- https://your-domain.vercel.app/birthday");
  console.error("");
  process.exit(1);
}

require("dotenv").config?.({ path: path.join(process.cwd(), ".env.local") });
const RECIPIENT = "Hiếu Phạm" || "love";
const SENDER = "Bảo Châu" || "love";
const PHOTO_PATH = process.env.PHOTO_PATH || path.join(process.cwd(), "hinhanh.jpg");

// Thẻ chuẩn ID-1 (giống thẻ ngân hàng): 85.6 × 53.98 mm, dạng dọc.
// In ở 600 DPI → 53.98mm = 1275px, 85.6mm = 2022px.
const DPI = 600;
const W = 1276; // ≈ 54.0 mm @ 600dpi
const H = 2022; // ≈ 85.6 mm @ 600dpi

// IG-style photo box on front
const PHOTO_X = 60;
const PHOTO_Y = 280;
const PHOTO_W = W - 120;   // 1156
const PHOTO_H = 1380;       // ~ 4:5-ish portrait

function escapeXml(s) {
  return String(s).replace(/[<>&"']/g, (c) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    '"': "&quot;",
    "'": "&apos;",
  }[c]));
}

// Heart bounded roughly -55..55 × -55..50, point at (0, 50), dip at (0, -28)
function heartPath({ fill = "none", stroke = "none", strokeWidth = 0, opacity = 1 } = {}) {
  return `<path d="M 0,50 C -25,30 -55,5 -55,-25 C -55,-50 -28,-58 -8,-42 C -3,-35 0,-32 0,-28 C 0,-32 3,-35 8,-42 C 28,-58 55,-50 55,-25 C 55,5 25,30 0,50 Z" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round" opacity="${opacity}"/>`;
}

// Outlined IG-style heart icon (separate path so it has its own bounding box)
function igHeartIcon(cx, cy, size, color) {
  const s = size / 110;
  return `<g transform="translate(${cx} ${cy}) scale(${s})">${heartPath({ fill: "none", stroke: color, strokeWidth: 6 })}</g>`;
}

// Speech bubble icon (comment)
function igCommentIcon(cx, cy, size, color) {
  const r = size / 2;
  const tx = cx - r * 0.55;
  const ty = cy + r * 0.9;
  return `
    <g fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="${cx}" cy="${cy - 2}" r="${r}"/>
      <path d="M ${tx} ${ty - r * 0.4} L ${tx - r * 0.25} ${ty} L ${tx + r * 0.2} ${ty - r * 0.15}"/>
    </g>`;
}

// Paper plane (share) icon
function igShareIcon(cx, cy, size, color) {
  const r = size / 2;
  return `
    <g fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" transform="translate(${cx - r} ${cy - r})">
      <path d="M 4 ${r} L ${size - 4} 4 L ${size * 0.55} ${size - 4} L ${size * 0.42} ${size * 0.58} Z"/>
      <line x1="${size - 4}" y1="4" x2="${size * 0.42}" y2="${size * 0.58}"/>
    </g>`;
}

// Bookmark icon
function igBookmarkIcon(cx, cy, size, color) {
  const w = size * 0.7;
  const h = size;
  return `<path d="M ${cx - w/2} ${cy - h/2} L ${cx + w/2} ${cy - h/2} L ${cx + w/2} ${cy + h/2} L ${cx} ${cy + h*0.18} L ${cx - w/2} ${cy + h/2} Z"
          fill="none" stroke="${color}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>`;
}

// NFC waves icon (top-right of back)
function nfcIcon(cx, cy, size, color) {
  const r = size / 2;
  return `
    <g fill="none" stroke="${color}" stroke-width="${r * 0.18}" stroke-linecap="round" transform="translate(${cx} ${cy})">
      <path d="M ${-r * 0.55} ${-r * 0.55} A ${r * 0.78} ${r * 0.78} 0 0 1 ${-r * 0.55} ${r * 0.55}"/>
      <path d="M ${-r * 0.15} ${-r * 0.8} A ${r * 1.13} ${r * 1.13} 0 0 1 ${-r * 0.15} ${r * 0.8}"/>
      <path d="M ${r * 0.25} ${-r * 1.05} A ${r * 1.48} ${r * 1.48} 0 0 1 ${r * 0.25} ${r * 1.05}"/>
    </g>`;
}

function makeFrontSvg() {
  const caption = `${escapeXml(SENDER)} <tspan fill="#ed2b53">❤</tspan> ${escapeXml(RECIPIENT)}`;
  // Avatar position (top header)
  const avX = 90;
  const avY = 140;
  const avR = 42;
  const moreX = W - 90;
  const moreY = avY;

  // Action icons row position
  const actionY = PHOTO_Y + PHOTO_H + 70;
  const captionY = actionY + 100;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="igGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f58529"/>
      <stop offset="0.5" stop-color="#dd2a7b"/>
      <stop offset="1" stop-color="#8134af"/>
    </linearGradient>
  </defs>

  <!-- card background -->
  <rect width="${W}" height="${H}" rx="48" ry="48" fill="#ffffff"/>
  <rect x="2" y="2" width="${W-4}" height="${H-4}" rx="46" ry="46" fill="none" stroke="#eee0e7" stroke-width="3"/>

  <!-- IG-style header: avatar + username + more -->
  <circle cx="${avX}" cy="${avY}" r="${avR + 4}" fill="url(#igGrad)"/>
  <circle cx="${avX}" cy="${avY}" r="${avR}" fill="#ffffff"/>
  <circle cx="${avX}" cy="${avY}" r="${avR - 6}" fill="#ffe1ec"/>
  <text x="${avX}" y="${avY + 18}" text-anchor="middle" font-family="Georgia, serif"
        font-size="40" font-weight="700" fill="#ed2b53">B</text>

  <text x="${avX + avR + 26}" y="${avY + 14}" font-family="-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif"
        font-size="40" font-weight="700" fill="#262626">baochau.love</text>
  <text x="${avX + avR + 26}" y="${avY + 56}" font-family="-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif"
        font-size="28" fill="#8e8e8e">18/06/2026 · Thành Phố Hồ Chí Minh</text>

  <!-- 3-dot menu -->
  <g fill="#262626">
    <circle cx="${moreX}" cy="${moreY}" r="5"/>
    <circle cx="${moreX - 22}" cy="${moreY}" r="5"/>
    <circle cx="${moreX + 22}" cy="${moreY}" r="5"/>
  </g>

  <!-- photo backdrop (covered by composited photo) -->
  <rect x="${PHOTO_X}" y="${PHOTO_Y}" width="${PHOTO_W}" height="${PHOTO_H}" fill="#f3d4e0" rx="6" ry="6"/>

  <!-- action icons -->
  ${igHeartIcon(110, actionY, 60, "#ed2b53")}
  ${igCommentIcon(220, actionY, 60, "#262626")}
  ${igShareIcon(330, actionY, 60, "#262626")}
  ${igBookmarkIcon(W - 110, actionY, 60, "#262626")}

  <!-- likes line -->
  <text x="80" y="${actionY + 95}" font-family="-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif"
        font-size="34" font-weight="700" fill="#262626">đã được Hiếu Phạm và 999 người khác thích</text>

  <!-- caption -->
  <text x="80" y="${captionY + 90}" font-family="-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif"
        font-size="42" font-weight="700" fill="#262626">${caption}</text>

  <text x="80" y="${captionY + 150}" font-family="-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif"
        font-size="30" fill="#8e8e8e">Xem tất cả 1 bình luận · happy birthday anh ✿</text>
</svg>`;
}

function makeBackSvg(qrDataUri) {
  // Heart center & QR center
  const cx = W / 2;
  const cy = H / 2 + 30;

  const heartScale = 9;
  // QR sized to fit inside heart's bulge
  const qrSize = 680;
  const qrX = Math.round(cx - qrSize / 2);
  const qrY = Math.round(cy - qrSize / 2);

  // "love · love · love" loop — laid out as individually-rotated text elements
  // (textPath isn't reliably rendered by sharp's librsvg)
  const loveRadius = 600;
  const loveCount = 22;
  const loveItems = [];
  for (let i = 0; i < loveCount; i++) {
    const angle = (i / loveCount) * 360 - 90; // start at top
    loveItems.push(
      `<g transform="rotate(${angle}) translate(0 ${-loveRadius})">
        <text text-anchor="middle" y="0" font-family="Georgia, serif" font-style="italic"
              font-size="36" fill="#ff5a3a">love</text>
      </g>`
    );
    // small dot separator between words, half-step rotated
    const dotAngle = ((i + 0.5) / loveCount) * 360 - 90;
    loveItems.push(
      `<g transform="rotate(${dotAngle}) translate(0 ${-loveRadius + 4})">
        <circle cx="0" cy="-12" r="3.5" fill="#ff5a3a"/>
      </g>`
    );
  }
  const loveLoop = loveItems.join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="heartFill" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#ff8a5a"/>
      <stop offset="100%" stop-color="#ff3a1f"/>
    </radialGradient>
  </defs>

  <!-- card background -->
  <rect width="${W}" height="${H}" rx="48" ry="48" fill="#ffffff"/>
  <rect x="2" y="2" width="${W-4}" height="${H-4}" rx="46" ry="46" fill="none" stroke="#eee0e7" stroke-width="3"/>

  <!-- NFC icon (top right) -->
  ${nfcIcon(W - 130, 130, 70, "#ff5a3a")}

  <!-- love love love loop around heart (rotated text elements, not textPath) -->
  <g transform="translate(${cx} ${cy})">
    ${loveLoop}
  </g>

  <!-- big heart wrapping the QR -->
  <g transform="translate(${cx} ${cy}) scale(${heartScale})">
    ${heartPath({ fill: "url(#heartFill)" })}
  </g>
  <g transform="translate(${cx} ${cy}) scale(${heartScale})">
    ${heartPath({ fill: "none", stroke: "#ffffff", strokeWidth: 0.9, opacity: 0.7 })}
  </g>

  <!-- QR with white background card -->
  <rect x="${qrX - 28}" y="${qrY - 28}" width="${qrSize + 56}" height="${qrSize + 56}"
        rx="20" ry="20" fill="#ffffff"/>
  <image x="${qrX}" y="${qrY}" width="${qrSize}" height="${qrSize}" href="${qrDataUri}"/>

  <!-- "I" top-left, drawn AFTER heart so it sits on top -->
  <text x="200" y="490" text-anchor="middle"
        font-family="Georgia, 'Times New Roman', serif" font-size="180" font-weight="900"
        fill="#ff5a3a" font-style="italic">I</text>

  <!-- "You" bottom-right, clearly below the heart's point -->
  <text x="${W - 230}" y="${H - 270}" text-anchor="middle"
        font-family="Georgia, 'Times New Roman', serif" font-size="180" font-weight="900"
        fill="#ff5a3a" font-style="italic">You</text>

  <!-- small caption at bottom -->
  <text x="${cx}" y="${H - 90}" text-anchor="middle"
        font-family="Georgia, serif" font-style="italic" font-size="32" fill="#9a4a3a">
    quét QR để mở quà bí mật
  </text>
</svg>`;
}

async function main() {
  console.log("→ Tạo QR cho:", url);
  const qrPng = await qrcode.toBuffer(url, {
    type: "png",
    errorCorrectionLevel: "H",
    margin: 1,
    width: 900,
    color: { dark: "#3a0e22", light: "#ffffff" },
  });
  const qrUri = `data:image/png;base64,${qrPng.toString("base64")}`;

  const outDir = path.join(process.cwd(), "card-output");
  await fs.mkdir(outDir, { recursive: true });

  console.log("→ Render mặt trước (IG-style)…");
  const frontSvg = makeFrontSvg();
  await fs.writeFile(path.join(outDir, "card-front.svg"), frontSvg);
  const frontBg = await sharp(Buffer.from(frontSvg)).png().toBuffer();

  let photoLayer;
  try {
    const photoFit = await sharp(PHOTO_PATH)
      .resize(PHOTO_W, PHOTO_H, { fit: "cover", position: "center" })
      .png()
      .toBuffer();
    const mask = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${PHOTO_W}" height="${PHOTO_H}"><rect width="${PHOTO_W}" height="${PHOTO_H}" rx="6" ry="6" fill="#fff"/></svg>`
    );
    photoLayer = await sharp(photoFit)
      .composite([{ input: mask, blend: "dest-in" }])
      .png()
      .toBuffer();
  } catch (err) {
    console.warn(`   ⚠ Không đọc được ảnh ${PHOTO_PATH}: ${err.message}`);
  }

  const frontPng = photoLayer
    ? await sharp(frontBg)
        .composite([{ input: photoLayer, left: PHOTO_X, top: PHOTO_Y }])
        .withMetadata({ density: DPI })
        .png()
        .toBuffer()
    : await sharp(frontBg).withMetadata({ density: DPI }).png().toBuffer();
  await fs.writeFile(path.join(outDir, "card-front.png"), frontPng);

  console.log("→ Render mặt sau (I ❤ You + QR)…");
  const backSvg = makeBackSvg(qrUri);
  await fs.writeFile(path.join(outDir, "card-back.svg"), backSvg);
  const backPng = await sharp(Buffer.from(backSvg))
    .withMetadata({ density: DPI })
    .png()
    .toBuffer();
  await fs.writeFile(path.join(outDir, "card-back.png"), backPng);

  console.log("→ Ghép 2 mặt cạnh nhau để in…");
  const combined = await sharp({
    create: {
      width: W * 2 + 40,
      height: H,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .composite([
      { input: frontPng, left: 0, top: 0 },
      { input: backPng, left: W + 40, top: 0 },
    ])
    .withMetadata({ density: DPI })
    .png()
    .toBuffer();
  await fs.writeFile(path.join(outDir, "card-combined.png"), combined);

  console.log("");
  console.log(`✅ Đã xuất thiệp chuẩn thẻ ID-1 (54 × 85.6 mm, ${DPI} DPI) vào card-output/`);
  console.log("   • card-front.png      — IG-style post với ảnh hai bạn");
  console.log("   • card-back.png       — I ❤ You + QR trong tim");
  console.log("   • card-combined.png   — 2 mặt cạnh nhau, tiện in cùng 1 tờ");
  console.log("");
  console.log("QR trỏ về: " + url);
}

main().catch((err) => {
  console.error("\n❌ Lỗi:", err.stack || err.message || err);
  process.exit(1);
});
