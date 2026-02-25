import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { db } from "../firebase";
import { ref, runTransaction, push, set } from "firebase/database";
import { Loader2, ExternalLink, AlertCircle } from "lucide-react";
import { motion } from "motion/react";
import HCaptcha from '@hcaptcha/react-hcaptcha';
import axios from 'axios';

function AdsterraAd({ width, height, adKey }: { width: number; height: number; adKey: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
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

  }, [adKey, height, width]);

  return <div ref={containerRef} className="flex justify-center items-center my-4 bg-gray-50 rounded-lg overflow-hidden" style={{ minHeight: height, minWidth: width }} />;
}

export default function Redirect() {
  const { shortId } = useParams();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState("");
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(15);
  const [initialCountdown, setInitialCountdown] = useState(15);
  const [hasClickedAd, setHasClickedAd] = useState(false);
  const [smartLinkUrl, setSmartLinkUrl] = useState<string | null>(null);
  const [adCount, setAdCount] = useState(3);
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const captchaRef = useRef<HCaptcha>(null);

  const handleCaptchaVerify = async (token: string) => {
    try {
      const response = await axios.post('/api/verify-hcaptcha', { token });
      if (response.data.success) {
        setIsCaptchaVerified(true);
      } else {
        console.error("Captcha verification failed:", response.data.error);
        captchaRef.current?.resetCaptcha();
      }
    } catch (error) {
      console.error("Captcha verification error:", error);
      captchaRef.current?.resetCaptcha();
    }
  };

  // PropellerAds Postback Helper
  const firePostback = (goal?: number) => {
    const visitorId = searchParams.get("visitor_id") || searchParams.get("click_id");
    const payout = searchParams.get("payout") || "0";
    
    if (!visitorId) return; // Cannot fire without visitor_id

    let url = `https://ad.propellerads.com/conversion.php?aid=3895472&pid=&tid=153340&visitor_id=${visitorId}&payout=${payout}`;
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

    // Use transaction to atomically increment clicks
    runTransaction(linkRef, (link) => {
      if (link) {
        link.clicks = (link.clicks || 0) + 1;
      }
      return link;
    })
      .then((result) => {
        if (result.snapshot.exists()) {
          const data = result.snapshot.val();
          setOriginalUrl(data.originalUrl);
          
          // Record detailed click stat
          try {
            const statsRef = ref(db, `click_stats/${shortId}`);
            push(statsRef, {
                timestamp: Date.now(),
                userAgent: navigator.userAgent,
                referrer: document.referrer || 'direct'
            });
          } catch (e) {
            console.error("Failed to record stats", e);
          }

          // Apply Settings
          if (data.settings) {
            if (typeof data.settings.duration === 'number') {
                setCountdown(data.settings.duration);
                setInitialCountdown(data.settings.duration);
            }
            if (typeof data.settings.adCount === 'number') {
                setAdCount(data.settings.adCount);
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

    // Adsterra Popunder Script (ID: 28690364)
    const popunderScript = document.createElement('script');
    popunderScript.src = "https://pl28790863.effectivegatecpm.com/68/3b/77/683b770e844c241a13aeb7420291d24a.js";
    popunderScript.async = true;
    document.body.appendChild(popunderScript);

    // RTMark Script
    const rtScript = document.createElement('script');
    rtScript.src = "https://my.rtmark.net/p.js?f=sync&lr=1&partner=d5d41e36a76e12bf7a278e7cbfef774d16aaeb5d8929f02ddc515d9fa0ebfbda";
    rtScript.defer = true;
    document.body.appendChild(rtScript);

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
      try {
        if (document.body.contains(popunderScript)) {
          document.body.removeChild(popunderScript);
        }
        if (document.body.contains(rtScript)) {
          document.body.removeChild(rtScript);
        }
      } catch (e) {
        // ignore
      }
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
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
          <AlertCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Link Não Encontrado</h1>
          <p className="mt-2 text-gray-600">{error}</p>
          <a href="/" className="mt-6 inline-block text-indigo-600 font-medium hover:underline">
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

  return (
    <div className="min-h-screen bg-gray-100 p-4 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Ad Banner - 728x90 */}
        <div className="hidden md:block">
            <AdsterraAd width={728} height={90} adKey="0ca51050bd22ba2d41c5886673f1d125" />
        </div>
        {/* Mobile Fallback for Top Banner - 468x60 */}
        <div className="block md:hidden">
            <AdsterraAd width={468} height={60} adKey="fe708b38a538d928d198c016373d636b" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Content Area */}
          <div className="md:col-span-2 space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-xl p-8 text-center ring-1 ring-gray-900/5"
            >
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
                {/* Always show Captcha if not verified */}
                {!isCaptchaVerified && (
                  <div className="flex justify-center my-4">
                    <HCaptcha
                      sitekey="0b32d3c2-baa2-41d0-82a2-7e4cf074b27e"
                      onVerify={handleCaptchaVerify}
                      ref={captchaRef}
                    />
                  </div>
                )}

                {countdown > 0 ? (
                  <p className="text-sm text-gray-400">
                    Por favor aguarde {countdown} segundos...
                  </p>
                ) : !isCaptchaVerified ? (
                   <p className="text-sm text-red-500 font-medium">
                     Por favor complete o captcha acima para continuar.
                   </p>
                ) : !hasClickedAd ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl"
                  >
                    <p className="text-yellow-800 font-bold text-lg mb-2">Link Bloqueado</p>
                    <p className="text-yellow-700">
                      Por favor <span className="font-bold underline">clique em qualquer anúncio</span> para desbloquear seu link de destino.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <p className="text-green-600 font-medium mb-2">Link Desbloqueado!</p>
                    <a 
                      href={smartLinkUrl || originalUrl}
                      target={smartLinkUrl ? "_blank" : "_self"}
                      rel={smartLinkUrl ? "noopener noreferrer" : undefined}
                      onClick={(e) => {
                        if (smartLinkUrl) {
                           // If using smartlink, we open it in new tab, and redirect current tab to original
                           // giving the user the ad experience + the content
                           setTimeout(() => {
                             window.location.href = originalUrl!;
                           }, 500);
                        }
                      }}
                      className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transition-all w-full sm:w-auto"
                    >
                      Continuar para o Link
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* Content Ad - 468x60 */}
            {adCount >= 3 && (
                <AdsterraAd width={468} height={60} adKey="fe708b38a538d928d198c016373d636b" />
            )}
            
            {/* Additional Ads for High Count */}
            {adCount >= 5 && (
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <AdsterraAd width={300} height={250} adKey="cc2b7dcc58facfed3b3f747cdeae7485" />
                    <AdsterraAd width={300} height={250} adKey="cc2b7dcc58facfed3b3f747cdeae7485" />
                 </div>
            )}
            
            {/* Max Ads (10) - Add more rows */}
            {adCount >= 10 && (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <AdsterraAd width={300} height={250} adKey="cc2b7dcc58facfed3b3f747cdeae7485" />
                        <AdsterraAd width={300} height={250} adKey="cc2b7dcc58facfed3b3f747cdeae7485" />
                    </div>
                    <AdsterraAd width={468} height={60} adKey="fe708b38a538d928d198c016373d636b" />
                    <AdsterraAd width={468} height={60} adKey="fe708b38a538d928d198c016373d636b" />
                </div>
            )}
          </div>

          {/* Sidebar Ads */}
          <div className="space-y-6 flex flex-col items-center md:block">
            {/* Sidebar Ad 1 - 300x250 */}
            {adCount >= 1 && (
                <AdsterraAd width={300} height={250} adKey="cc2b7dcc58facfed3b3f747cdeae7485" />
            )}
            
            {/* Sidebar Ad 2 - 160x300 */}
            {adCount >= 3 && (
                <AdsterraAd width={160} height={300} adKey="40ba51d801ce3b95edba18997ac87495" />
            )}
            
            {/* Additional Sidebar Ads */}
            {adCount >= 5 && (
                <AdsterraAd width={160} height={600} adKey="40ba51d801ce3b95edba18997ac87495" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
