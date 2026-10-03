import React, { useState, useEffect } from 'react';
import {
  ESignatureBridgeService,
  ESignatureBridgeStatus,
  SmartCardCertificate,
  SignUdfResult
} from '../services/eSignatureBridgeService';
import {
  ShieldCheck,
  Cpu,
  KeyRound,
  Download,
  AlertCircle,
  CheckCircle2,
  X,
  RefreshCw,
  FileCode,
  HardDrive
} from 'lucide-react';

interface ESignatureSignModalProps {
  isOpen: boolean;
  onClose: () => void;
  xmlContent: string;
  documentTitle?: string;
  lawyerSicil?: string;
  courtName?: string;
  onSignedSuccess?: (result: SignUdfResult) => void;
}

export const ESignatureSignModal: React.FC<ESignatureSignModalProps> = ({
  isOpen,
  onClose,
  xmlContent,
  documentTitle = 'UYAP Dava Dilekçesi.udf',
  lawyerSicil = '8109',
  courtName = 'Yetkili Mahkeme',
  onSignedSuccess
}) => {
  const [bridgeStatus, setBridgeStatus] = useState<ESignatureBridgeStatus | null>(null);
  const [selectedCard, setSelectedCard] = useState<SmartCardCertificate | null>(null);
  const [pin, setPin] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isSigning, setIsSigning] = useState<boolean>(false);
  const [signResult, setSignResult] = useState<SignUdfResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      handleProbeBridge();
    } else {
      setPin('');
      setSignResult(null);
      setErrorMessage(null);
    }
  }, [isOpen]);

  const handleProbeBridge = async () => {
    setIsScanning(true);
    setErrorMessage(null);
    try {
      const status = await ESignatureBridgeService.probeLocalBridge();
      setBridgeStatus(status);
      if (status.detectedCards.length > 0) {
        setSelectedCard(status.detectedCards[0]);
      } else {
        setSelectedCard(ESignatureBridgeService.getFallbackDemoCertificates()[0]);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Köprü taranırken hata oluştu.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSign = async () => {
    if (!pin || pin.length < 4) {
      setErrorMessage('Lütfen en az 4 haneli E-İmza PIN kodunuzu giriniz.');
      return;
    }

    setIsSigning(true);
    setErrorMessage(null);
    try {
      const result = await ESignatureBridgeService.signUdfDocument({
        xmlContent,
        pin,
        slotId: selectedCard?.slotId ?? 0,
        certificateSerial: selectedCard?.serialNumber,
        lawyerSicil,
        courtName
      });

      setSignResult(result);
      if (onSignedSuccess) {
        onSignedSuccess(result);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'İmzalama işlemi tamamlanamadı.');
    } finally {
      setIsSigning(false);
    }
  };

  const handleDownloadSignedUdf = () => {
    if (!signResult?.signedXml) return;
    const blob = new Blob([signResult.signedXml], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const baseName = documentTitle.replace(/\.udf$/i, '');
    link.download = `${baseName}_E-IMZALI.udf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden text-slate-100 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-slate-100 flex items-center gap-2">
                Adli E-İmza ile İmzala
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  5070 Sayılı Kanun Uyumlu
                </span>
              </h3>
              <p className="text-xs text-slate-400">AKİS & PKCS#11 Akıllı Kart WebSocket Entegrasyonu</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Bridge Status Indicator */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${bridgeStatus?.connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <div>
                <div className="text-xs font-medium text-slate-300">
                  {bridgeStatus?.connected
                    ? `Yerel Köprü Aktif (ws://127.0.0.1:${bridgeStatus.port})`
                    : 'Yerel E-İmza Köprüsü Bekleniyor / Hazır Mod'}
                </div>
                <div className="text-[11px] text-slate-400">
                  {bridgeStatus?.version || 'TÜBİTAK AKİS / PKCS#11 Native Driver'}
                </div>
              </div>
            </div>
            <button
              onClick={handleProbeBridge}
              disabled={isScanning}
              className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Köprüyü Yeniden Tara"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              Yenile
            </button>
          </div>

          {/* Smart Card Info Card */}
          {selectedCard && (
            <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-950/40 via-slate-950/80 to-slate-900 border border-indigo-900/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-indigo-400" />
                  Algılanan Nitelikli Elektronik Sertifika (NES)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Slot #{selectedCard.slotId} ({selectedCard.cardType})
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div>
                  <span className="text-slate-400 block text-[11px]">Sertifika Sahibi:</span>
                  <span className="font-medium text-slate-200">{selectedCard.ownerName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">TCKN:</span>
                  <span className="font-mono text-slate-300">{selectedCard.tckn}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[11px]">Sağlayıcı (CA):</span>
                  <span className="text-slate-300 text-[11px] truncate block">{selectedCard.issuer}</span>
                </div>
              </div>
            </div>
          )}

          {/* Document to Sign info */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-950/40 border border-slate-800/80 text-xs">
            <FileCode className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="truncate flex-1">
              <span className="text-slate-400">İmzalanacak Belge: </span>
              <span className="font-semibold text-slate-200">{documentTitle}</span>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success State */}
          {signResult && (
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-700/60 space-y-3">
              <div className="flex items-center gap-2 text-emerald-300 font-medium text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                UDF Belgesi Başarıyla İmzalandı ve Damgalandı!
              </div>
              <div className="text-xs text-slate-300 space-y-1 font-mono bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                <div className="text-slate-400">İmza ID: {signResult.signatureId}</div>
                <div className="text-slate-400 truncate">SHA-256 Damga: {signResult.stampHash}</div>
                <div className="text-slate-400">Zaman: {new Date(signResult.signingTime).toLocaleString('tr-TR')}</div>
              </div>
              <button
                onClick={handleDownloadSignedUdf}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm shadow-lg shadow-emerald-900/30 transition"
              >
                <Download className="w-4 h-4" />
                İmzalı .udf Dosyasını İndir
              </button>
            </div>
          )}

          {/* PIN Input and Sign Button (Only if not signed yet) */}
          {!signResult && (
            <div className="space-y-3">
              <label className="block text-xs font-medium text-slate-300">
                Akıllı Kart PIN Kodu:
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  maxLength={8}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="E-İmza PIN kodunuzu girin"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-100 placeholder-slate-500 text-sm font-mono tracking-widest outline-none transition"
                />
              </div>

              <button
                onClick={handleSign}
                disabled={isSigning || !pin}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-50 text-white font-medium text-sm shadow-lg shadow-indigo-950 transition"
              >
                {isSigning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Donanım Çipi İle İmzalanıyor...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    AKİS ile İmzala ve Onayla
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-slate-400" />
            UYAP UDF v2.4 Enveloped XML-DSig Standardı
          </span>
          <span className="text-slate-400">Yerel Servis: ws://127.0.0.1:8080</span>
        </div>
      </div>
    </div>
  );
};
