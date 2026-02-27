import React, { useState, useRef, useEffect } from "react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { ref, get } from "firebase/database";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { motion, AnimatePresence } from "motion/react";
import HCaptcha from '@hcaptcha/react-hcaptcha';
import axios from 'axios';

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
      const mfaRef = ref(db, `users/${user.uid}/mfaEnabled`);
      const mfaSnapshot = await get(mfaRef);
      const isMfaEnabled = mfaSnapshot.exists() && mfaSnapshot.val() === true;

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
              ip: "auto",
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
                Bem-vindo de volta
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Entre para gerenciar seus links
              </p>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
                {error}
              </div>
            )}

            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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
                Entrar
              </Button>

              <p className="text-center text-sm text-gray-600">
                Não tem uma conta?{" "}
                <Link
                  to="/register"
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Cadastre-se
                </Link>
              </p>
            </form>
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
                Verificação em Duas Etapas
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Enviamos um código de 6 dígitos para o seu e-mail.
              </p>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
                {error}
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
                  Verificar Código
                </Button>
                <Button type="button" variant="ghost" className="w-full" onClick={handleCancelMfa}>
                  Cancelar
                </Button>
              </div>
              
              <p className="text-center text-[10px] text-gray-400">
                O código expira em 5 minutos.
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
