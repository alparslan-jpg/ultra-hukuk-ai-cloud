async function runFeatureTests() {
  const BASE_URL = 'http://127.0.0.1:3000';
  const results: { name: string; status: 'PASS' | 'FAIL'; detail?: string }[] = [];

  const logTest = (name: string, ok: boolean, detail?: string) => {
    results.push({ name, status: ok ? 'PASS' : 'FAIL', detail });
    console.log(`${ok ? '✅ [PASS]' : '❌ [FAIL]'} ${name}${detail ? ` - ${detail}` : ''}`);
  };

  try {
    // 1. Static Pages
    console.log('\n--- 1. STATİK VE UI SAYFALARI KONTROLÜ ---');
    const indexRes = await fetch(`${BASE_URL}/`);
    logTest('Ana Sayfa (Vite SPA) Erişilebilirliği (/)', indexRes.status === 200, `HTTP ${indexRes.status}`);

    const adminHtmlRes = await fetch(`${BASE_URL}/admin.html`);
    logTest('Klasik Adminatör HTML Sayfası (/admin.html)', adminHtmlRes.status === 200, `HTTP ${adminHtmlRes.status}`);

    const loginHtmlRes = await fetch(`${BASE_URL}/login.html`);
    logTest('Giriş Sayfası (/login.html)', loginHtmlRes.status === 200, `HTTP ${loginHtmlRes.status}`);

    // 2. Admin Authentication
    console.log('\n--- 2. YÖNETİCİ KİMLİK DOĞRULAMA (ADMIN AUTH) ---');
    const failLoginRes = await fetch(`${BASE_URL}/api/adminauth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'YanlisKullanici', password: 'wrong' }),
    });
    const failLoginData = await failLoginRes.json();
    logTest('Hatalı Giriş Reddetme Kontrolü', failLoginRes.status === 401 && !failLoginData.success, failLoginData.message);

    const loginRes = await fetch(`${BASE_URL}/api/adminauth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'Alparslan', password: 'Alp.wolf58', deviceId: 'test-device-uuid-1' }),
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    logTest('Adminatör Süper Yönetici Girişi (Alparslan)', loginRes.status === 200 && !!token, `Rol: ${loginData.role}`);

    const authHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

    const meRes = await fetch(`${BASE_URL}/api/adminauth/me`, { headers: authHeaders });
    const meData = await meRes.json();
    logTest('Admin Oturum Doğrulama (/api/adminauth/me)', meRes.status === 200 && meData.username === 'Alparslan', `Cihaz Kilitli: ${meData.isDeviceLocked}`);

    // 3. User & License Management
    console.log('\n--- 3. AVUKAT LİSANSLAMA VE DONANIM KİLİDİ (HWID) ---');
    const usersRes = await fetch(`${BASE_URL}/api/admin/users`, { headers: authHeaders });
    const usersData = await usersRes.json();
    logTest('Kayıtlı Avukatlar Listesi', usersRes.status === 200 && Array.isArray(usersData) && usersData.length > 0, `${usersData.length} avukat yüklendi`);

    const targetUser = usersData[0];
    const prevDays = targetUser.daysRemaining;

    const extendRes = await fetch(`${BASE_URL}/api/admin/extend-subscription`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ userId: targetUser.id, extraDays: 30 }),
    });
    const extendData = await extendRes.json();
    logTest('Abonelik Süresi Uzatma (+30 Gün)', extendRes.status === 200 && extendData.success, `Önceki: ${prevDays}G -> Yeni: ${extendData.daysRemaining}G`);

    const resetHwRes = await fetch(`${BASE_URL}/api/admin/reset-hardware`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ userId: targetUser.id }),
    });
    const resetHwData = await resetHwRes.json();
    logTest('Donanım Kilidi (HWID) Sıfırlama', resetHwRes.status === 200 && resetHwData.success, resetHwData.message);

    // 4. Telemetry & Billing
    console.log('\n--- 4. SİSTEM TELEMETRİSİ VE GEMİNİ KULLANIM TAKİBİ ---');
    const telemRes = await fetch(`${BASE_URL}/api/admin/system-telemetry`, { headers: authHeaders });
    const telemData = await telemRes.json();
    logTest('Sistem Telemetrisi (Şifreli Dava & Lisanslar)', telemRes.status === 200 && telemData.totalUsers > 0, `Aktif Lisans: ${telemData.activeLawyerLicenses}`);

    const geminiRes = await fetch(`${BASE_URL}/api/admin/gemini-usage`, { headers: authHeaders });
    const geminiData = await geminiRes.json();
    logTest('Gemini Kullanım & Aylık Maliyet Raporu', geminiRes.status === 200 && geminiData.monthlyBudgetUsd === 50, `Tahmini Harcama: $${geminiData.estimatedTotalCostUsd}`);

    const agentsRes = await fetch(`${BASE_URL}/api/admin/agent-status`, { headers: authHeaders });
    const agentsData = await agentsRes.json();
    logTest('18 Hukuk Ajanı Canlılık Durumu', agentsRes.status === 200 && agentsData.agents?.length === 18, `Toplam ${agentsData.agents?.length} ajan aktif`);

    // Unthrottled WebApi Admin-Health endpoint test
    const adminHealthRes = await fetch(`${BASE_URL}/api/admin-health`);
    const adminHealthData = await adminHealthRes.json();
    logTest(
      'WebApi admin-health Canlı Sağlık Endpointi (429 Rate-Limit Korumalı)',
      adminHealthRes.status === 200 && adminHealthData.status === 'Healthy' && adminHealthData.activeAgentsCount === 18,
      `Durum: ${adminHealthData.status} | 18/${adminHealthData.totalAgentsCount} Ajan Aktif | RateLimit: Muaf`
    );

    const flagsRes = await fetch(`${BASE_URL}/api/admin/feature-flags`, { headers: authHeaders });
    const flagsData = await flagsRes.json();
    logTest('Uygulama Özellik Matrisi', flagsRes.status === 200 && flagsData.features?.length > 0, `${flagsData.features?.length} özellik denetlendi`);

    // 5. Whitelist Management
    console.log('\n--- 5. BEYAZ LİSTE YÖNETİMİ ---');
    const newSicil = `TEST-${Date.now().toString().slice(-4)}`;
    const addWlRes = await fetch(`${BASE_URL}/api/admin/whitelist`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        tcKimlikNo: '12345678901',
        sicilNo: newSicil,
        baroAdi: 'Ankara Barosu',
        fullName: 'Av. Test Kullanıcısı',
        email: 'test@baro.av.tr',
      }),
    });
    const addWlData = await addWlRes.json();
    logTest('Beyaz Listeye Yeni Avukat Ekleme', addWlRes.status === 200 && addWlData.success, `Sicil: ${newSicil}`);

    const wlListRes = await fetch(`${BASE_URL}/api/admin/whitelist`, { headers: authHeaders });
    const wlListData = await wlListRes.json();
    const addedEntry = wlListData.find((w: any) => w.sicilNo === newSicil);
    logTest('Beyaz Liste Sorgulama', !!addedEntry, `Bulunan kayıt: ${addedEntry?.fullName}`);

    if (addedEntry) {
      const delWlRes = await fetch(`${BASE_URL}/api/admin/whitelist/${addedEntry.id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      const delWlData = await delWlRes.json();
      logTest('Beyaz Liste Kaydı Silme', delWlRes.status === 200 && delWlData.success, delWlData.message);
    }

    // 6. KVKK 72-Hour Breach & Audit Log
    console.log('\n--- 6. KVKK 72 SAAT İHLAL TAKİBİ VE DENETİM İZİ ---');
    const createBreachRes = await fetch(`${BASE_URL}/api/admin/data-breach-incidents`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        description: 'Test amaçlı güvenlik taraması gerçekleştirildi.',
        severity: 'Düşük',
      }),
    });
    const createBreachData = await createBreachRes.json();
    logTest('KVKK Veri İhlali Olayı Kaydetme', createBreachRes.status === 200 && createBreachData.success, createBreachData.message);

    const breachListRes = await fetch(`${BASE_URL}/api/admin/data-breach-incidents`, { headers: authHeaders });
    const breachListData = await breachListRes.json();
    const latestBreach = breachListData.data?.[0];
    logTest('KVKK İhlal Olayları Listeleme', breachListRes.status === 200 && breachListData.data?.length > 0, `Olay ID: ${latestBreach?.id}`);

    if (latestBreach && !latestBreach.kvkkReportedAt) {
      const markRes = await fetch(`${BASE_URL}/api/admin/data-breach-incidents/${latestBreach.id}/mark-reported`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ notes: 'Test tamamlandı' }),
      });
      const markData = await markRes.json();
      logTest('KVKK İhlal Olayını Bildirildi Olarak İşaretleme', markRes.status === 200 && markData.success, markData.message);
    }

    const auditRes = await fetch(`${BASE_URL}/api/admin/audit-log`, { headers: authHeaders });
    const auditData = await auditRes.json();
    logTest('Sistem Denetim İzi (Audit Log) Takibi', auditRes.status === 200 && Array.isArray(auditData) && auditData.length > 0, `Son işlem: ${auditData[0]?.action}`);

    // 7. Lawyer Login Handshake
    console.log('\n--- 7. AVUKAT GİRİŞ EL SIKIŞMASI (HANDSHAKE) ---');
    const lawyerHandshakeRes = await fetch(`${BASE_URL}/api/auth/login-handshake`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sicilNo: '34821',
        hardwareId: 'TEST-HWID-DEVICE-1',
      }),
    });
    const lawyerHandshakeData = await lawyerHandshakeRes.json();
    logTest('Avukat Sicil & HWID El Sıkışması', lawyerHandshakeRes.status === 200 && lawyerHandshakeData.success, `Avukat: ${lawyerHandshakeData.user?.fullName}`);

    // 8. AI Legal Orchestration
    console.log('\n--- 8. HUKUKİ YAPAY ZEKA VE AJAN TESTLERİ ---');

    // Complete Analysis
    const caseAnalysisRes = await fetch(`${BASE_URL}/api/ai/complete-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        davaOzeti: 'Müvekkil şirket ticari mal satışı gerçekleştirmiş, fatura tebliğ edilmiş ancak 250.000 TL bedel ödenmemiştir.',
        clientClaims: ['Mal eksiksiz teslim edilmiştir', 'Faturaya 8 gün içinde itiraz edilmemiştir'],
        kanitListesi: ['İrsaliyeli fatura', 'Cari hesap ekstresi', 'Banka kayıtları'],
        muvekkilTarafSifati: 'Davacı',
        lawyerSicilNo: '34821',
      }),
    });
    const caseAnalysisData = await caseAnalysisRes.json();
    logTest(
      'Çok Ajanlı Dava Analizi (13 Ajan)',
      caseAnalysisRes.status === 200 &&
        caseAnalysisData.success &&
        caseAnalysisData.kazanmaIhtimali > 0 &&
        caseAnalysisData.leheUnsurlar?.length > 0,
      `Dava Türü: ${caseAnalysisData.davaTuru} | Kazanma: %${caseAnalysisData.kazanmaIhtimali}`
    );

    // Devil's Advocate
    const devilsRes = await fetch(`${BASE_URL}/api/ai/devils-advocate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        caseSummary: 'Kıdem tazminatı ve fazla çalışma alacağı davası',
        clientClaims: 'Haftalık 60 saat çalışma iddiası',
        evidenceList: 'Tanık beyanları',
        lawyerSicilNo: '34821',
      }),
    });
    const devilsData = await devilsRes.json();
    logTest(
      'Şeytanın Avukatı (Harp Odası Analizi)',
      devilsRes.status === 200 &&
        devilsData.success &&
        devilsData.davaciTeziZayifliklari?.length > 0 &&
        devilsData.davaliTeziZayifliklari?.length > 0,
      `Davacı Tezi Açıkları: ${devilsData.davaciTeziZayifliklari?.length} adet`
    );

    // UYAP Petition Generator
    const petitionRes = await fetch(`${BASE_URL}/api/ai/petition-draft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        court: 'İstanbul 11. Asliye Ticaret Mahkemesi',
        client: 'Güneş İnşaat Malzemeleri Ltd. Şti.',
        opponent: 'Yıldız Mimarlık A.Ş.',
        subject: 'Cari hesap ve fatura alacağının tahsili talebidir',
        caseNo: '2026/304 Esas',
        details: 'Faturalar tebliğ edilmiş, borçlu süresinde itiraz etmemiştir.',
        lawyerName: 'Av. Mehmet Akif Kaya',
        lawyerSicilNo: '34821',
      }),
    });
    const petitionData = await petitionRes.json();
    const hasLegalSections =
      petitionData.petitionText?.includes('HUKUKİ SEBEPLER') &&
      petitionData.petitionText?.includes('NETİCE VE TALEP');
    logTest('UYAP Dilekçe Taslak Üretimi', petitionRes.status === 200 && hasLegalSections, 'Dilekçe resmi UYAP şablonuna uygun üretildi');

    // Precedent Search
    const precedentRes = await fetch(`${BASE_URL}/api/ai/precedent-search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'faturaya süresinde itiraz edilmemesi tebliğ kesinleşme',
        lawyerSicilNo: '34821',
      }),
    });
    const precedentData = await precedentRes.json();
    logTest(
      'Yargıtay / Danıştay Emsal Karar Arama',
      precedentRes.status === 200 && precedentData.precedents?.length > 0,
      `${precedentData.precedents?.length} adet emsal karar getirildi`
    );

    // Document OCR
    const ocrRes = await fetch(`${BASE_URL}/api/ai/document-ocr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: 'dava_dilekcesi_ek1.pdf',
        lawyerSicilNo: '34821',
      }),
    });
    const ocrData = await ocrRes.json();
    logTest(
      'Görsel Evrak OCR ve Hukuki Alan Ayrıştırma',
      ocrRes.status === 200 && !!ocrData.tespitEdilenAlanlar?.esasNo,
      `Esas No: ${ocrData.tespitEdilenAlanlar?.esasNo}`
    );

    // Temporal Law & Interest Calculator
    const temporalRes = await fetch(`${BASE_URL}/api/ai/temporal-calculator`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventDate: '2023-01-01',
        claimType: 'genel',
        principalAmount: 200000,
        isCommercial: true,
        lawyerSicilNo: '34821',
      }),
    });
    const temporalData = await temporalRes.json();
    logTest(
      'Zamanaşımı ve 3095 s.K. Faiz Hesaplama Motoru',
      temporalRes.status === 200 && temporalData.toplamTalep > 200000 && !temporalData.isExpired,
      `Hesaplanan Faiz: ${temporalData.hesaplananFaiz} TL | Durum: ${temporalData.zamanAsimiDurumu}`
    );

    // Procedural Audit (LawArticleValidator)
    const procRes = await fetch(`${BASE_URL}/api/ai/procedural-audit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        court: 'İstanbul Asliye Ticaret Mahkemesi',
        isCommercial: true,
        hasMediationReport: true,
        hasPowerOfAttorney: true,
        claimAmount: '200.000 TL',
        claimsSummary: 'Faturaya itiraz edilmemesi ve ticari alacak davası',
        lawyerSicilNo: '34821',
      }),
    });
    const procData = await procRes.json();
    logTest(
      '35 Noktalı Usul Denetimi ve Dava Şartı Filtresi',
      procRes.status === 200 && procData.usulUygunlukPuani > 0 && Array.isArray(procData.tespitEdilenRiskler),
      `Usul Puanı: ${procData.usulUygunlukPuani}/100 | ${procData.davaSartlariDurumu}`
    );

    // Expert Report Audit (HMK 266 / 281)
    const expertRes = await fetch(`${BASE_URL}/api/ai/expert-report-audit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reportSummary: 'Bilirkişi davalının kusursuz olduğunu ve cezai şartın fahiş olduğunu mütalaa etmiştir.',
        clientPerspective: 'Rapor çelişkilidir ve hakimin yerine geçip hukuki tavsif yapmıştır.',
        caseSubject: 'Eser Sözleşmesinden Doğan Hakediş',
        lawyerName: 'Av. Mehmet Akif Kaya',
        lawyerSicilNo: '34821',
      }),
    });
    const expertData = await expertRes.json();
    logTest(
      'Bilirkişi Raporu İnceleme ve HMK m. 281 İtiraz Layihası Ajanı',
      expertRes.status === 200 && expertData.itirazDilekcesiTaslagi?.includes('HMK m. 281'),
      `Yetki Aşımı Tespiti: ${expertData.hukukiTavsifIhlaliVarMi ? 'Evet (HMK 266 İhlali)' : 'Hayır'}`
    );

    // Hearing Prep & Cross-Exam
    const hearingRes = await fetch(`${BASE_URL}/api/ai/hearing-prep`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        caseStage: 'Tanık Dinleme Celsesi',
        witnessStatements: 'Tanık davalının işi vaktinde bitirmediğini iddia etmiştir.',
        opponentClaims: 'Sözleşme şartlarına uyulmadı.',
        lawyerSicilNo: '34821',
      }),
    });
    const hearingData = await hearingRes.json();
    logTest(
      'Duruşma Hazırlığı ve Çapraz Sorgu Simülatörü (HMK 254-257)',
      hearingRes.status === 200 && hearingData.tanikCaprazSorguSorulari?.length > 0,
      `${hearingData.tanikCaprazSorguSorulari?.length} adet soru ve zapta geçirme şerhi üretildi`
    );

    // Summary
    const totalTests = results.length;
    const passedTests = results.filter((r) => r.status === 'PASS').length;
    const failedTests = totalTests - passedTests;

    console.log('\n=============================================');
    console.log(`TEST SONUCU: ${passedTests}/${totalTests} BAŞARILI (%${Math.round((passedTests / totalTests) * 100)})`);
    console.log('=============================================');

    if (failedTests > 0) {
      process.exit(1);
    }
  } catch (err: any) {
    console.error('Test yürütülürken beklenmeyen hata:', err);
    process.exit(1);
  }
}

runFeatureTests();
