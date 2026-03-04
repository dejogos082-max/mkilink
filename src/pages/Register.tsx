import React, { useState, useRef } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { ref, set } from "firebase/database";
import { auth, db } from "../firebase";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { motion } from "motion/react";
import HCaptcha from '@hcaptcha/react-hcaptcha';
import axios from 'axios';

import { useSettings } from "../contexts/SettingsContext";
import { SecurityBadges } from "../components/SecurityBadges";

export default function Register() {
  const { settings } = useSettings();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get("ref");
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<HCaptcha>(null);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return setError("Por favor, insira um endereço de email válido.");
    }

    if (password !== confirmPassword) {
      return setError("As senhas não coincidem.");
    }

    if (!captchaToken) {
      return setError("Please complete the captcha.");
    }

    try {
      setError("");
      setLoading(true);

      // Verify captcha on server
      try {
        const verifyRes = await axios.post('/api/verify-hcaptcha', { token: captchaToken });
        if (!verifyRes.data.success) {
          setCaptchaToken(null);
          captchaRef.current?.resetCaptcha();
          return setError("Falha na verificação do Captcha. Tente novamente.");
        }
      } catch (err) {
        console.error("Captcha verification error:", err);
        // If server returns 400/500, we might want to allow registration in preview if it's a config issue,
        // but since we fixed the server to return success in preview, we should trust the server response.
        // However, if the server is down or unreachable (404), we might block.
        // Let's just log it and let the user know, or fail safely.
        // Given the server fix, we expect success: true even on error in preview.
        // So if we get here, it's a network error or something else.
        setCaptchaToken(null);
        captchaRef.current?.resetCaptcha();
        return setError("Erro ao verificar Captcha. Tente novamente.");
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create user record in database
      await set(ref(db, `users/${user.uid}`), {
        email: user.email,
        createdAt: Date.now(),
        role: 'user',
        status: 'active',
        referredBy: referralCode || null
      });

      navigate("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError("Failed to create an account. " + err.message);
      setCaptchaToken(null);
      captchaRef.current?.resetCaptcha();
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col min-h-[80vh] items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl ring-1 ring-gray-900/5"
      >
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            <span>Criar uma conta</span>
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            <span>Comece a encurtar links gratuitamente</span>
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
            <span>{error}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              label="Email address"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
            <Input
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            <Input
              label="Confirm Password"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <div className="flex justify-center">
            <HCaptcha
              sitekey={import.meta.env.VITE_HCAPTCHA_SITEKEY || "0b32d3c2-baa2-41d0-82a2-7e4cf074b27e"}
              onVerify={(token) => setCaptchaToken(token)}
              onExpire={() => setCaptchaToken(null)}
              ref={captchaRef}
              theme={settings.theme}
            />
          </div>

          <Button type="submit" className="w-full" isLoading={loading}>
            <span>Cadastrar</span>
          </Button>

          <p className="text-center text-sm text-gray-600">
            <span>Já tem uma conta?</span>{" "}
            <Link
              to="/login"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              <span>Entrar</span>
            </Link>
          </p>
        </form>
      </motion.div>
      <SecurityBadges />
    </div>
  );
}
