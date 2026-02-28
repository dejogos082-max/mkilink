import React, { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import { db } from "../firebase";
import { ref, runTransaction, push, set, get } from "firebase/database";
import { Loader2, ExternalLink, AlertCircle } from "lucide-react";
import HCaptcha from '@hcaptcha/react-hcaptcha';
import axios from 'axios';
import { detectAdBlock, AdBlockModal } from "../utils/antiAdblock";
import { HCaptchaWrapper } from "../components/HCaptchaWrapper";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { useSettings } from "../contexts/SettingsContext";

const AdsterraAd = React.memo(({ width, height, adKey }: { width: number; height: number; adKey: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    try {
        // Clear previous content to prevent duplicates
        containerRef.current.innerHTML = '';

        const conf = {
            'key' : adKey,
            'format' : 'iframe',
            'height' : height,
            'width' : width,
            'params' : {}
        };

        const scriptUrl = `https://www.highperformanceformat.com/${adKey}/invoke.js`;

        const iframe = document.createElement('iframe');
        iframe.width = `${width}`;
        iframe.height = `${height}`;
        iframe.style.border = 'none';
        iframe.style.overflow = 'hidden';
        iframe.scrolling = 'no';
        
        containerRef.current.appendChild(iframe);
        
        const doc = iframe.contentWindow?.document;
        if (doc) {
            doc.open();
            doc.write(`
                <html>
                <head></head>
                <body style="margin:0;padding:0;display:flex;justify-content:center;align-items:center;">
                    <script>
                        atOptions = ${JSON.stringify(conf)};
                    </script>
                    <script type="text/javascript" src="${scriptUrl}"></script>
                </body>
                </html>
            `);
            doc.close();
        }
    } catch (e) {
        console.error("AdsterraAd Error:", e);
    }

  }, [adKey, height, width]);

  return <div ref={containerRef} className="flex justify-center items-center my-4 bg-gray-50 rounded-lg overflow-hidden" style={{ minHeight: height, minWidth: width }} />;
});

const AdFallback = ({ width, height }: { width: number, height: number }) => (
    <div className="bg-gray-50 animate-pulse rounded-lg mx-auto my-4 flex items-center justify-center text-gray-300 text-xs" style={{ width, height }}>
        Anúncio
    </div>
);

const SafeAdsterraAd = (props: { width: number; height: number; adKey: string }) => (
    <ErrorBoundary fallback={<AdFallback width={props.width} height={props.height} />}>
        <AdsterraAd {...props} />
    </ErrorBoundary>
);

export default function Redirect() {
  const { settings } = useSettings();
  const { shortId } = useParams();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState("");
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(15);
  const [initialCountdown, setInitialCountdown] = useState(15);
  const [hasClickedAd, setHasClickedAd] = useState(false);
  const [smartLinkUrl, setSmartLinkUrl] = useState<string | null>(null);
  const [adCount, setAdCount] = useState(3);
  const [layout, setLayout] = useState<'default' | 'header'>('default');
  const [headerTitle, setHeaderTitle] = useState("Valecraft");
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const captchaRef = useRef<HCaptcha>(null);
  
  // Error States
  const [validationError, setValidationError] = useState<string | null>(null);
  
  // Secure Redirect State
  const [redirectToken, setRedirectToken] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleCaptchaVerify = async (token: string) => {
    setValidationError(null);
    try {
      const response = await axios.post('/api/verify-hcaptcha', { token });
      if (response.data.success) {
        setIsCaptchaVerified(true);
      } else {
        console.error("Captcha verification failed:", response.data.error);
        setValidationError("Falha na verificação do Captcha. Tente novamente.");
        captchaRef.current?.resetCaptcha();
      }
    } catch (error: any) {
      console.error("Captcha verification error:", error);
      const msg = error.response?.data?.error || error.message;
      setValidationError(`Erro de conexão: ${msg}`);
      captchaRef.current?.resetCaptcha();
    }
  };

  // Initialize Secure Token
  useEffect(() => {
    if (shortId) {
        fetch(`/api/redirect/init?linkId=${shortId}`)
            .then(res => res.json())
            .then(data => {
                if (data.token) setRedirectToken(data.token);
            })
            .catch(err => console.error("Failed to init secure redirect", err));
    }
  }, [shortId]);

  const handleSecureRedirect = async () => {
    if (!redirectToken || !shortId) return;
    setIsRedirecting(true);
    setValidationError(null);
    
    // Increment clicks and record stats ONLY NOW when user actually follows the link
    try {
        const linkRef = ref(db, `short_links/${shortId}`);
        runTransaction(linkRef, (link) => {
            if (link) {
                link.clicks = (link.clicks || 0) + 1;
            }
            return link;
        });

        const statsRef = ref(db, `click_stats/${shortId}`);
        push(statsRef, {
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            referrer: document.referrer || 'direct'
        });
    } catch (e) {
        console.error("Failed to record click", e);
    }
    
    try {
        const res = await fetch('/api/redirect/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: redirectToken })
        });
        
        const data = await res.json();
        
        if (data.url) {
            // Success!
            if (smartLinkUrl) {
                // SmartLink Logic
                window.open(smartLinkUrl, '_blank');
                setTimeout(() => {
                    window.location.href = data.url;
                }, 500);
            } else {
                window.location.href = data.url;
            }
        } else {
            setValidationError(data.error || "Erro ao validar redirecionamento");
            setIsRedirecting(false);
        }
    } catch (err) {
      console.error(err);
      setValidationError("Erro de conexão ao validar link.");
      setIsRedirecting(false);
    }
  };

  // PropellerAds Postback Helper
  const firePostback = (goal?: number) => {
    const visitorId = searchParams.get("visitor_id") || searchParams.get("click_id");
    const payout = searchParams.get("payout") || "0";
    
    if (!visitorId) return; // Cannot fire without visitor_id

    const aid = import.meta.env.VITE_PROPELLER_AID || "3895472";
    const tid = import.meta.env.VITE_PROPELLER_TID || "153340";
    let url = `https://ad.propellerads.com/conversion.php?aid=${aid}&pid=&tid=${tid}&visitor_id=${visitorId}&payout=${payout}`;
    if (goal) {
      url += `&goal=${goal}`;
    }

    // Fire pixel using Image to avoid CORS issues with simple GET
    new Image().src = url;
    console.log(`Fired postback: Goal ${goal || 'Main'}`, url);
  };

  useEffect(() => {
    // Fire Main Conversion on Page Load
    firePostback();

    // Fetch SmartLink from our backend proxy
    fetch("/api/adsterra/smart-link")
      .then(res => res.json())
      .then(data => {
        if (data.url) {
          setSmartLinkUrl(data.url);
        }
      })
      .catch(err => console.error("Failed to fetch smart link", err));
  }, []);

  useEffect(() => {
    if (!shortId) return;

    const linkRef = ref(db, `short_links/${shortId}`);

    get(linkRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          setOriginalUrl(data.originalUrl);
          
          // Apply Settings
          if (data.settings) {
            if (typeof data.settings.duration === 'number' && data.settings.duration > 0) {
                setCountdown(data.settings.duration);
                setInitialCountdown(data.settings.duration);
            } else {
                // Fallback safe default
                setCountdown(15);
                setInitialCountdown(15);
            }
            if (typeof data.settings.adCount === 'number') {
                setAdCount(data.settings.adCount);
            }
            if (data.settings.layout) {
                setLayout(data.settings.layout);
            }
            if (data.settings.headerTitle) {
                setHeaderTitle(data.settings.headerTitle);
            }
            // Check expiration
            if (data.settings.expiresAt && Date.now() > data.settings.expiresAt) {
                setError("This link has expired.");
                setOriginalUrl(null);
            }
          }
        } else {
          setError("Link not found");
        }
      })
      .catch((err) => {
        console.error(err);
        setError("An error occurred");
      });
  }, [shortId]);

  useEffect(() => {
    if (!originalUrl) return;

    // Adsterra Popunder Script
    try {
        const popunderScript = document.createElement('script');
        popunderScript.src = import.meta.env.VITE_ADSTERRA_POPUNDER_URL || "https://pl28790863.effectivegatecpm.com/68/3b/77/683b770e844c241a13aeb7420291d24a.js";
        popunderScript.async = true;
        document.body.appendChild(popunderScript);
    } catch (e) {
        console.error("Popunder error", e);
    }

    // RTMark Script
    try {
        const rtScript = document.createElement('script');
        const rtPartnerId = import.meta.env.VITE_RTMARK_PARTNER_ID || "d5d41e36a76e12bf7a278e7cbfef774d16aaeb5d8929f02ddc515d9fa0ebfbda";
        rtScript.src = `https://my.rtmark.net/p.js?f=sync&lr=1&partner=${rtPartnerId}`;
        rtScript.defer = true;
        document.body.appendChild(rtScript);
    } catch (e) {
        console.error("RTMark error", e);
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          firePostback(2); // Fire Goal 2 when countdown finishes
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      // Cleanup scripts if possible/necessary
    };
  }, [originalUrl]);

  useEffect(() => {
    const handleBlur = () => {
      if (countdown === 0 && !hasClickedAd) {
        setHasClickedAd(true);
        firePostback(3); // Fire Goal 3 when ad is clicked (link unlocked)
      }
    };

    window.addEventListener("blur", handleBlur);
    return () => window.removeEventListener("blur", handleBlur);
  }, [countdown, hasClickedAd]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full ring-1 ring-gray-900/5">
          <AlertCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Ops! Algo deu errado</h1>
          <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-100">
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
          <a href="/" className="mt-8 inline-flex items-center justify-center px-6 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors">
            Voltar para o início
          </a>
        </div>
      </div>
    );
  }

  if (!originalUrl) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-indigo-600" />
          <p className="mt-4 text-gray-600 font-medium">Carregando detalhes do link...</p>
        </div>
      </div>
    );
  }

  const renderStatus = () => {
    if (countdown > 0) {
        return (
          <div key="countdown">
            <p className="text-sm text-gray-400">
              <span>Por favor aguarde {countdown} segundos...</span>
            </p>
          </div>
        );
    }
    if (!isCaptchaVerified) {
        return (
           <div key="captcha-msg">
             <p className="text-sm text-red-500 font-medium">
               <span>Por favor complete o captcha acima para continuar.</span>
             </p>
           </div>
        );
    }
    if (!hasClickedAd) {
        return (
          <div key="ad-block" className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl animate-in fade-in zoom-in duration-300">
            <p className="text-yellow-800 font-bold text-lg mb-2"><span>Link Bloqueado</span></p>
            <p className="text-yellow-700">
              <span>Por favor </span><span className="font-bold underline"><span>clique em qualquer anúncio</span></span><span> para desbloquear seu link de destino.</span>
            </p>
          </div>
        );
    }
    return (
      <div key="unlocked" className="animate-in fade-in zoom-in duration-300">
        <p className="text-green-600 font-medium mb-2"><span>Link Desbloqueado!</span></p>
        <button 
          onClick={handleSecureRedirect}
          disabled={isRedirecting}
          className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transition-all w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRedirecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Validando...</span>
              </>
          ) : (
              <>
                <span>Continuar para o Link</span>
                <ExternalLink className="ml-2 h-4 w-4" />
              </>
          )}
        </button>
      </div>
    );
  };

  if (layout === 'header') {
    return (
      <div className="min-h-screen bg-gray-100 font-sans relative">
        <AdBlockModal onContinue={() => {}} />
        
        {/* Header Layout Bar */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm p-4">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div>
                        <h1 className="text-lg font-bold text-gray-900 leading-none"><span>{headerTitle}</span></h1>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold"><span>Redirecionamento Seguro</span></p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10">
                            <svg className="h-10 w-10 transform -rotate-90">
                                <circle className="text-gray-100" strokeWidth="3" stroke="currentColor" fill="transparent" r="18" cx="20" cy="20" />
                                <circle className="text-indigo-600 transition-all duration-1000 ease-linear" strokeWidth="3" strokeDasharray={113} strokeDashoffset={113 - (113 * (initialCountdown - countdown)) / initialCountdown} strokeLinecap="round" stroke="currentColor" fill="transparent" r="18" cx="20" cy="20" />
                            </svg>
                            <div className="absolute top-0 left-0 h-full w-full flex items-center justify-center">
                                <span className="text-xs font-bold text-gray-900">{countdown}</span>
                            </div>
                        </div>
                        <div className="hidden sm:block">
                            <p className="text-[10px] text-gray-400 uppercase font-bold"><span>Status</span></p>
                            <p className="text-xs font-medium text-gray-900">
                                {countdown > 0 ? <span>Aguarde...</span> : <span>Pronto!</span>}
                            </p>
                        </div>
                    </div>

                    <div className="h-10 w-px bg-gray-100 hidden sm:block" />

                    <div className="flex items-center gap-3">
                        {countdown === 0 && isCaptchaVerified && hasClickedAd ? (
                            <button 
                                onClick={handleSecureRedirect}
                                disabled={isRedirecting}
                                className="inline-flex items-center justify-center px-5 py-2 border border-transparent text-sm font-bold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all disabled:opacity-50"
                            >
                                {isRedirecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Ir para o Link</span>}
                            </button>
                        ) : (
                            <div className="px-5 py-2 bg-gray-100 text-gray-400 rounded-lg text-sm font-bold cursor-not-allowed">
                                <span>Link Bloqueado</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>

        <main className="max-w-4xl mx-auto p-4 space-y-6 mt-6">
            {validationError && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 font-medium flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{validationError}</span>
                </motion.div>
            )}

            {!isCaptchaVerified && (
                <div className="bg-white p-8 rounded-2xl shadow-xl ring-1 ring-gray-900/5 text-center space-y-4">
                    <h2 className="text-xl font-bold text-gray-900"><span>Verificação de Segurança</span></h2>
                    <p className="text-gray-500 text-sm"><span>Por favor, prove que você não é um robô para continuar.</span></p>
                    <div className="flex justify-center min-h-[78px]">
                        <HCaptchaWrapper>
                            <HCaptcha sitekey={import.meta.env.VITE_HCAPTCHA_SITEKEY || "0b32d3c2-baa2-41d0-82a2-7e4cf074b27e"} onVerify={handleCaptchaVerify} ref={captchaRef} theme={settings.theme} />
                        </HCaptchaWrapper>
                    </div>
                </div>
            )}

            {countdown === 0 && isCaptchaVerified && !hasClickedAd && (
                <div className="bg-white p-8 rounded-2xl shadow-xl ring-1 ring-gray-900/5 text-center space-y-4 border-2 border-yellow-400 animate-pulse">
                    <h2 className="text-xl font-bold text-yellow-800"><span>Ação Necessária</span></h2>
                    <p className="text-yellow-700"><span>Clique em qualquer anúncio abaixo para desbloquear seu link.</span></p>
                </div>
            )}

            {/* Ads Grid */}
            <div className="space-y-6">
                <div className="flex justify-center">
                    <SafeAdsterraAd width={728} height={90} adKey={import.meta.env.VITE_ADSTERRA_KEY_728_90 || "0ca51050bd22ba2d41c5886673f1d125"} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-6 md:col-span-1">
                        {adCount >= 1 && <SafeAdsterraAd width={300} height={250} adKey={import.meta.env.VITE_ADSTERRA_KEY_300_250 || "cc2b7dcc58facfed3b3f747cdeae7485"} />}
                        {adCount >= 5 && <SafeAdsterraAd width={300} height={250} adKey={import.meta.env.VITE_ADSTERRA_KEY_300_250 || "cc2b7dcc58facfed3b3f747cdeae7485"} />}
                        {adCount >= 10 && <SafeAdsterraAd width={300} height={250} adKey={import.meta.env.VITE_ADSTERRA_KEY_300_250 || "cc2b7dcc58facfed3b3f747cdeae7485"} />}
                    </div>
                    <div className="space-y-6 md:col-span-1">
                        {adCount >= 3 && <SafeAdsterraAd width={300} height={250} adKey={import.meta.env.VITE_ADSTERRA_KEY_300_250 || "cc2b7dcc58facfed3b3f747cdeae7485"} />}
                        {adCount >= 5 && <SafeAdsterraAd width={468} height={60} adKey={import.meta.env.VITE_ADSTERRA_KEY_468_60 || "fe708b38a538d928d198c016373d636b"} />}
                        {adCount >= 10 && <SafeAdsterraAd width={300} height={250} adKey={import.meta.env.VITE_ADSTERRA_KEY_300_250 || "cc2b7dcc58facfed3b3f747cdeae7485"} />}
                    </div>
                    <div className="space-y-6 md:col-span-1">
                        {adCount >= 3 && <SafeAdsterraAd width={160} height={600} adKey={import.meta.env.VITE_ADSTERRA_KEY_160_300 || "40ba51d801ce3b95edba18997ac87495"} />}
                        {adCount >= 10 && <SafeAdsterraAd width={160} height={600} adKey={import.meta.env.VITE_ADSTERRA_KEY_160_300 || "40ba51d801ce3b95edba18997ac87495"} />}
                    </div>
                </div>
                
                {adCount >= 10 && (
                  <div className="flex justify-center">
                    <SafeAdsterraAd width={728} height={90} adKey={import.meta.env.VITE_ADSTERRA_KEY_728_90 || "0ca51050bd22ba2d41c5886673f1d125"} />
                  </div>
                )}
            </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 font-sans relative">
      <AdBlockModal onContinue={() => {
          // Optional: Track that user continued despite adblock
          console.log("User continued with AdBlock");
      }} />
      
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Ad Banner - 728x90 */}
        <div className="hidden md:block">
            <SafeAdsterraAd width={728} height={90} adKey={import.meta.env.VITE_ADSTERRA_KEY_728_90 || "0ca51050bd22ba2d41c5886673f1d125"} />
        </div>
        {/* Mobile Fallback for Top Banner - 468x60 */}
        <div className="block md:hidden">
            <SafeAdsterraAd width={468} height={60} adKey={import.meta.env.VITE_ADSTERRA_KEY_468_60 || "fe708b38a538d928d198c016373d636b"} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Content Area */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center ring-1 ring-gray-900/5 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Seu link está quase pronto!
              </h1>
              <p className="text-gray-500 mb-8">
                Por favor, aguarde um momento enquanto preparamos seu destino.
              </p>

              <div className="relative flex items-center justify-center mb-8">
                <div className="relative">
                  <svg className="h-32 w-32 transform -rotate-90">
                    <circle
                      className="text-gray-200"
                      strokeWidth="8"
                      stroke="currentColor"
                      fill="transparent"
                      r="58"
                      cx="64"
                      cy="64"
                    />
                    <circle
                      className="text-indigo-600 transition-all duration-1000 ease-linear"
                      strokeWidth="8"
                      strokeDasharray={365}
                      strokeDashoffset={365 - (365 * (initialCountdown - countdown)) / initialCountdown}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="58"
                      cx="64"
                      cy="64"
                    />
                  </svg>
                  <div className="absolute top-0 left-0 h-full w-full flex items-center justify-center">
                    <span className="text-4xl font-bold text-gray-900">{countdown}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {validationError && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-medium flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {validationError}
                  </motion.div>
                )}

                {/* Always show Captcha if not verified */}
                {!isCaptchaVerified && (
                  <div className="flex justify-center my-4 min-h-[78px]">
                    <HCaptchaWrapper>
                      <HCaptcha
                        sitekey={import.meta.env.VITE_HCAPTCHA_SITEKEY || "0b32d3c2-baa2-41d0-82a2-7e4cf074b27e"}
                        onVerify={handleCaptchaVerify}
                        ref={captchaRef}
                        theme={settings.theme}
                      />
                    </HCaptchaWrapper>
                  </div>
                )}

                {renderStatus()}
              </div>
            </div>

            {/* Content Ad - 468x60 */}
            {adCount >= 3 && (
                <SafeAdsterraAd width={468} height={60} adKey={import.meta.env.VITE_ADSTERRA_KEY_468_60 || "fe708b38a538d928d198c016373d636b"} />
            )}
            
            {/* Additional Ads for High Count */}
            {adCount >= 5 && (
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <SafeAdsterraAd width={300} height={250} adKey={import.meta.env.VITE_ADSTERRA_KEY_300_250 || "cc2b7dcc58facfed3b3f747cdeae7485"} />
                    <SafeAdsterraAd width={300} height={250} adKey={import.meta.env.VITE_ADSTERRA_KEY_300_250 || "cc2b7dcc58facfed3b3f747cdeae7485"} />
                 </div>
            )}
            
            {/* Max Ads (10) - Add more rows */}
            {adCount >= 10 && (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <SafeAdsterraAd width={300} height={250} adKey={import.meta.env.VITE_ADSTERRA_KEY_300_250 || "cc2b7dcc58facfed3b3f747cdeae7485"} />
                        <SafeAdsterraAd width={300} height={250} adKey={import.meta.env.VITE_ADSTERRA_KEY_300_250 || "cc2b7dcc58facfed3b3f747cdeae7485"} />
                    </div>
                    <SafeAdsterraAd width={468} height={60} adKey={import.meta.env.VITE_ADSTERRA_KEY_468_60 || "fe708b38a538d928d198c016373d636b"} />
                    <SafeAdsterraAd width={468} height={60} adKey={import.meta.env.VITE_ADSTERRA_KEY_468_60 || "fe708b38a538d928d198c016373d636b"} />
                </div>
            )}
          </div>

          {/* Sidebar Ads */}
          <div className="space-y-6 flex flex-col items-center md:block">
            {/* Sidebar Ad 1 - 300x250 */}
            {adCount >= 1 && (
                <SafeAdsterraAd width={300} height={250} adKey={import.meta.env.VITE_ADSTERRA_KEY_300_250 || "cc2b7dcc58facfed3b3f747cdeae7485"} />
            )}
            
            {/* Sidebar Ad 2 - 160x300 */}
            {adCount >= 3 && (
                <SafeAdsterraAd width={160} height={300} adKey={import.meta.env.VITE_ADSTERRA_KEY_160_300 || "40ba51d801ce3b95edba18997ac87495"} />
            )}
            
            {/* Additional Sidebar Ads */}
            {adCount >= 5 && (
                <SafeAdsterraAd width={160} height={600} adKey={import.meta.env.VITE_ADSTERRA_KEY_160_300 || "40ba51d801ce3b95edba18997ac87495"} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
