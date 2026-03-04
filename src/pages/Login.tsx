import React, { useState, useRef, useEffect } from "react";
import { signInWithEmailAndPassword, signOut, GoogleAuthProvider, GithubAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, db } from "../firebase";
import { ref, get, set, update } from "firebase/database";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { motion, AnimatePresence } from "motion/react";
import HCaptcha from '@hcaptcha/react-hcaptcha';
import axios from 'axios';
import { Github } from "lucide-react";
import { loginGithub } from "../lib/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<HCaptcha>(null);
  const navigate = useNavigate();

  // MFA State
  const [mfaStep, setMfaStep] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaLoading, setMfaLoading] = useState(false);
  const [tempUser, setTempUser] = useState<any>(null);

  async function handleSocialLogin(providerName: 'google' | 'github') {
    try {
      setError("");
      setLoading(true);
      
      let result;
      if (providerName === 'google') {
        const provider = new GoogleAuthProvider();
        result = await signInWithPopup(auth, provider);
      } else if (providerName === 'github') {
        result = await loginGithub();
      } else {
        throw new Error("Provedor não suportado");
      }

      const user = result.user;

      // Check if user exists in Realtime DB
      const userRef = ref(db, `users/${user.uid}`);
      const snapshot = await get(userRef);

      if (!snapshot.exists()) {
        // Create new user record if not exists
        await set(userRef, {
          email: user.email,
          displayName: user.displayName || 'Usuário',
          createdAt: Date.now(),
          lastLogin: Date.now(),
          role: 'user',
          plan: 'free',
          balance: 0,
          mfaEnabled: false
        });
      } else {
        // Update last login
        await update(userRef, {
          lastLogin: Date.now()
        });
      }

      await completeLogin(user);
    } catch (err: any) {
      console.error(`${providerName} Login Error:`, err);
      setError(`Falha ao entrar com ${providerName}. Tente novamente.`);
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!captchaToken) {
      return setError("Por favor, complete o captcha.");
    }

    try {
      setError("");
      setLoading(true);

      // Verify captcha on server
      const verifyRes = await axios.post('/api/verify-hcaptcha', { token: captchaToken });
      if (!verifyRes.data.success) {
        setCaptchaToken(null);
        captchaRef.current?.resetCaptcha();
        return setError("Falha na verificação do Captcha. Tente novamente.");
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if MFA is enabled for this user
      // MFA Temporarily Disabled for Maintenance
      const isMfaEnabled = false; 
      /* 
      const mfaRef = ref(db, `users/${user.uid}/mfaEnabled`);
      const mfaSnapshot = await get(mfaRef);
      const isMfaEnabled = mfaSnapshot.exists() && mfaSnapshot.val() === true;
      */

      if (isMfaEnabled) {
        setTempUser(user);
        setMfaStep(true);
        // Send code
        await axios.post('/api/mfa/send-code', { userId: user.uid, email: user.email });
        setLoading(false);
        return;
      }

      await completeLogin(user);
    } catch (err: any) {
      console.error(err);
      setError("Falha ao entrar. Verifique suas credenciais.");
      setCaptchaToken(null);
      captchaRef.current?.resetCaptcha();
    }
    setLoading(false);
  }

  async function handleMfaVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!tempUser || !mfaCode) return;

    setMfaLoading(true);
    setError("");
    try {
      const res = await axios.post('/api/mfa/verify-code', { userId: tempUser.uid, code: mfaCode });
      if (res.data.success) {
        await completeLogin(tempUser);
      } else {
        setError("Código inválido ou expirado.");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Erro ao verificar código.");
    } finally {
      setMfaLoading(false);
    }
  }

  async function completeLogin(user: any) {
    // Log Login History
    try {
      await fetch('/api/log-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              userId: user.uid,
              email: user.email,
              userAgent: navigator.userAgent
          })
      });
    } catch (logErr) {
      console.error("Failed to log login:", logErr);
    }

    navigate("/");
  }

  const handleCancelMfa = async () => {
    await signOut(auth);
    setMfaStep(false);
    setTempUser(null);
    setMfaCode("");
    setCaptchaToken(null);
    captchaRef.current?.resetCaptcha();
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {!mfaStep ? (
          <motion.div
            key="login-form"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl ring-1 ring-gray-900/5"
          >
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                <span>Bem-vindo de volta</span>
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                <span>Entre para gerenciar seus links</span>
              </p>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
                <span>{error}</span>
              </div>
            )}

            <div className="mt-8 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full flex items-center justify-center py-2.5 bg-white hover:bg-gray-50 text-gray-700 border-gray-300 transition-all shadow-sm"
                  onClick={() => handleSocialLogin('google')}
                  isLoading={loading}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                </Button>

                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full flex items-center justify-center py-2.5 bg-[#24292F] hover:bg-[#24292F]/90 text-white border-transparent transition-all shadow-sm"
                  onClick={() => handleSocialLogin('github')}
                  isLoading={loading}
                >
                  <Github className="w-5 h-5" />
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-2 text-gray-500">Ou continue com e-mail</span>
                </div>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <Input
                    label="Endereço de e-mail"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@exemplo.com"
                  />
                  <Input
                    label="Senha"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>

                <div className="flex justify-center">
                  <HCaptcha
                    sitekey={import.meta.env.VITE_HCAPTCHA_SITEKEY || "0b32d3c2-baa2-41d0-82a2-7e4cf074b27e"}
                    onVerify={(token) => setCaptchaToken(token)}
                    onExpire={() => setCaptchaToken(null)}
                    ref={captchaRef}
                  />
                </div>

                <Button type="submit" className="w-full" isLoading={loading}>
                  <span>Entrar</span>
                </Button>

                <p className="text-center text-sm text-gray-600">
                  <span>Não tem uma conta?</span>{" "}
                  <Link
                    to="/register"
                    className="font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    <span>Cadastre-se</span>
                  </Link>
                </p>
              </form>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="mfa-form"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl ring-1 ring-gray-900/5"
          >
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 mb-4">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8-0v4h8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                <span>Verificação em Duas Etapas</span>
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                <span>Enviamos um código de 6 dígitos para o seu e-mail.</span>
              </p>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
                <span>{error}</span>
              </div>
            )}

            <form className="mt-8 space-y-6" onSubmit={handleMfaVerify}>
              <div className="space-y-4">
                <Input
                  label="Código de Verificação"
                  type="text"
                  required
                  maxLength={6}
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="text-center text-2xl tracking-[0.5em] font-mono"
                />
              </div>

              <div className="space-y-3">
                <Button type="submit" className="w-full" isLoading={mfaLoading}>
                  <span>Verificar Código</span>
                </Button>
                <Button type="button" variant="ghost" className="w-full" onClick={handleCancelMfa}>
                  <span>Cancelar</span>
                </Button>
              </div>
              
              <p className="text-center text-[10px] text-gray-400">
                <span>O código expira em 5 minutos.</span>
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
