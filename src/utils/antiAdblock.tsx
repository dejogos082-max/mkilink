import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, CheckCircle } from 'lucide-react';

/**
 * Anti-AdBlock Module
 * 
 * Implements multiple detection methods to identify ad blockers without
 * causing false positives or breaking the user experience.
 */

// --- Detection Methods ---

// Method 1: Bait Script Dynamic Loading
const checkBaitScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        // Random hash to avoid static blocklists
        const hash = Math.random().toString(36).substring(7);
        const baitName = `ads-${hash}.js`;
        
        // We don't actually need the script to exist, just the request to be intercepted
        // or the element to be blocked. However, a 404 might be confusing.
        // Better approach: Check if a known ad-related global variable is missing
        // after attempting to load a "bait" resource.
        
        // Simpler approach for "Bait Script": 
        // Create a script element with a suspicious src and see if it's blocked.
        // Most blockers block the network request, not the DOM element creation immediately.
        
        // Alternative: Create a "bait" global variable in a script that looks like an ad script
        // If the variable is not present, it might be blocked.
        // But we can't easily serve a dynamic JS file from the client.
        
        // Let's use the "Fetch Control" for network blocking (Method 3).
        // For Method 1, we'll try to detect if a specific "bait" element style is applied.
        resolve(false);
    });
};

// Method 2: DOM Verification (Hidden Elements)
const checkDomBait = (): boolean => {
    const bait = document.createElement('div');
    // Common ad classes
    bait.className = 'adsbox ad-placement doubleclick ad-banner banner-ads';
    bait.style.position = 'absolute';
    bait.style.left = '-9999px';
    bait.style.top = '-9999px';
    bait.style.width = '1px';
    bait.style.height = '1px';
    bait.innerHTML = '&nbsp;';
    
    document.body.appendChild(bait);
    
    // Check if the element has been hidden or removed by adblocker styles
    const style = window.getComputedStyle(bait);
    const isBlocked = 
        bait.offsetParent === null || 
        bait.offsetHeight === 0 || 
        bait.offsetLeft === 0 || 
        style.display === 'none' || 
        style.visibility === 'hidden' ||
        style.opacity === '0';
        
    document.body.removeChild(bait);
    return isBlocked;
};

// Method 3: Fetch Control (Network Blocking)
const checkNetworkBait = async (): Promise<boolean> => {
    try {
        // Request a URL that is almost certainly in blocklists
        // We use a dummy domain or a path that triggers filters
        const baitUrl = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
        
        // We expect this to fail if blocked, or succeed (404/200) if not blocked.
        // AdBlockers usually block the request entirely (Network Error).
        await fetch(baitUrl, { 
            method: 'HEAD', 
            mode: 'no-cors', // Opaque response, but throws on network error (blocked)
            cache: 'no-store'
        });
        
        return false; // Request went through (even if 404 or opaque)
    } catch (e) {
        // Network error usually means blocked
        return true;
    }
};

// Method 4: Adsterra / Third-party Script Monitoring
const checkAdsterraGlobal = (): boolean => {
    // Check for common Adsterra globals or if the iframe created by our component is empty
    // This is hard to do generically without knowing the specific global.
    // However, we can check if our specific ad containers are empty.
    
    // Let's check for a generic "atOptions" which we set in our Adsterra component
    // If atOptions is defined but the script didn't execute/render, it's suspicious.
    
    // Better: Check if the 'atOptions' is present (we put it there) 
    // but maybe the script src was blocked.
    
    // Since we can't easily access the iframe content due to cross-origin (if ad loads),
    // we rely on the other methods.
    return false;
};

// Main Detection Function
export const detectAdBlock = async (): Promise<boolean> => {
    // Check Session Storage first to avoid repeated checks in same session if desired
    // But for "Soft Wall", we might want to check every time or respect a "dismissed" state.
    const cached = sessionStorage.getItem('adblock_detected');
    if (cached === 'true') return true;
    if (cached === 'false') return false;

    const results = await Promise.all([
        checkDomBait(),
        checkNetworkBait()
    ]);
    
    const isDetected = results.some(r => r === true);
    sessionStorage.setItem('adblock_detected', String(isDetected));
    return isDetected;
};

// --- UI Component ---

export function AdBlockModal({ onContinue }: { onContinue?: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [canContinue, setCanContinue] = useState(false);
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        detectAdBlock().then(detected => {
            if (detected) {
                setIsOpen(true);
                // Start countdown for "Continue Anyway"
                const timer = setInterval(() => {
                    setCountdown(prev => {
                        if (prev <= 1) {
                            clearInterval(timer);
                            setCanContinue(true);
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);
            }
        });
    }, []);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100"
                >
                    <div className="p-6 text-center space-y-4">
                        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <Shield className="w-8 h-8 text-red-600" />
                        </div>
                        
                        <h2 className="text-2xl font-bold text-gray-900">AdBlock Detectado</h2>
                        
                        <p className="text-gray-600 text-sm leading-relaxed">
                            Nós dependemos de anúncios para manter este serviço gratuito. 
                            Por favor, considere desativar seu bloqueador de anúncios para continuar.
                        </p>

                        <div className="bg-gray-50 p-4 rounded-xl text-left text-xs text-gray-500 space-y-2 border border-gray-100">
                            <p className="font-semibold text-gray-700">Como desativar:</p>
                            <ol className="list-decimal list-inside space-y-1">
                                <li>Clique no ícone do AdBlock no navegador</li>
                                <li>Selecione "Não executar nesta página"</li>
                                <li>Atualize a página</li>
                            </ol>
                        </div>

                        <div className="pt-4 space-y-3">
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                <CheckCircle className="w-4 h-4" />
                                Já desativei, atualizar página
                            </button>
                            
                            {canContinue ? (
                                <button
                                    onClick={() => {
                                        setIsOpen(false);
                                        if (onContinue) onContinue();
                                    }}
                                    className="w-full py-3 px-4 bg-transparent hover:bg-gray-50 text-gray-500 font-medium rounded-xl transition-colors text-sm"
                                >
                                    Continuar mesmo assim (Experiência limitada)
                                </button>
                            ) : (
                                <button
                                    disabled
                                    className="w-full py-3 px-4 bg-transparent text-gray-300 font-medium rounded-xl text-sm cursor-not-allowed"
                                >
                                    Aguarde {countdown}s para continuar...
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
