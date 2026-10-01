const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const target1 = 'Dosyanın içinden "cımbızla çekilip" davanın seyrini yüzde yüz değiştirebilecek veya davayı doğrudan kazandırabilecek hayati ayrıntıları ortaya çıkar.';
const replacement1 = target1 + '\n\nÖZEL TALİMAT (EN KRİTİK NOKTA VE STRATEJİK DETAYLAR):\n"Cımbız" (cimbizGameChangers) dizisinde, tespit ettiğin noktaları şu hiyerarşiyle sun:\n1. İlk kayıt: "EN KRİTİK NOKTA" başlığını taşısın ve TMK m. 1023 (iyiniyet) veya davayı kökten çözecek en ağır usul/esas hatasını içersin.\n2. Sonraki kayıtlar: "DAVA AKIŞINI LEHE ÇEVİRECEK STRATEJİK DETAYLAR" formatında, kökten yolsuz tescil, kesin hüküm yanılgısı (süre eksikliği), eski tarihli hava fotoğrafları/müktesep haklar ve bilirkişi çelişkileri gibi dosyadaki diğer gizli kalmış veya manipüle edilmiş detayları sıralasın.\nHer detaya, diğer arka plan ajanlarından (Şeytanın Avukatı, Usul Ajanı vb.) alınan yapay zeka içgörülerini ve tamamlayıcı eksik tespitlerini "ajanIcgorusleri" alanında ekle.';

const target2 = '      "katiKanunDayanagi": "string"\n    }\n  ],\n  "courtCrossExamQuestions"';
const replacement2 = '      "katiKanunDayanagi": "string",\n      "ajanIcgorusleri": "Usul ve Şeytanın Avukatı ajanlarından gelen eksik tamamlama ve strateji içgörüleri"\n    }\n  ],\n  "courtCrossExamQuestions"';

content = content.replace(target1, replacement1);
content = content.replace(target2, replacement2);

fs.writeFileSync('server.ts', content, 'utf8');
console.log('Done.');
