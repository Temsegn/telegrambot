const fs = require('fs');

const replaces = [
  { file: 'bot/src/index.ts', replaces: [
      { from: /const BOT_TOKEN.*/g, to: '' },
      { from: /const BACKEND_URL.*/g, to: '' },
      { from: /const CHANNEL_ID.*/g, to: '' },
      { from: /const MINI_APP_URL.*/g, to: '' },
      { from: /\/\/ ── Hard.*?\n/g, to: '' },
      { from: /BOT_TOKEN/g, to: "'8878260053:AAFnUgkU_hjJRedU2SJq_a81proq7gwvB0U'" },
      { from: /BACKEND_URL/g, to: "'https://telegrambot-backend-37gb.onrender.com'" },
      { from: /CHANNEL_ID/g, to: "'@userdejendejen'" },
      { from: /MINI_APP_URL/g, to: "'https://telegrambot-1-b7u3.onrender.com'" }
  ]},
  { file: 'mini-app/src/App.tsx', replaces: [
      { from: /const BACKEND_URL.*/g, to: '' },
      { from: /const BOT_USERNAME.*/g, to: '' },
      { from: /BACKEND_URL/g, to: "'https://telegrambot-backend-37gb.onrender.com'" },
      { from: /BOT_USERNAME/g, to: "'userdejenbot'" }
  ]},
  { file: 'admin-dashboard/app/page.tsx', replaces: [
      { from: /const BACKEND_URL.*/g, to: '' },
      { from: /BACKEND_URL/g, to: "'https://telegrambot-backend-37gb.onrender.com'" }
  ]},
  { file: 'backend/src/main.ts', replaces: [
      { from: /process\.env\.ALLOWED_ORIGINS/g, to: "'https://telegrambot-1-b7u3.onrender.com,https://telegrambot-dppa.onrender.com,https://dejenrewards-miniapp.onrender.com,https://dejenrewards-admin.onrender.com'" },
      { from: /process\.env\.PORT\s*\|\|\s*4000/g, to: "10000" }
  ]}
];

for (const req of replaces) {
  let content = fs.readFileSync(req.file, 'utf-8');
  for (const r of req.replaces) {
    content = content.replace(r.from, r.to);
  }
  fs.writeFileSync(req.file, content);
}
console.log("Done");
