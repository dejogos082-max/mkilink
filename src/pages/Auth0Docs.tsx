import React from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";

export default function Auth0Docs() {
  const docs = `
# Auth0 Quickstart Documentation

## 1. Create a new JavaScript project for this Quickstart
\`\`\`bash
mkdir auth0-vanillajs && cd auth0-vanillajs
npm init -y && npm install --save-dev vite && npm pkg set scripts.dev="vite" scripts.build="vite build" scripts.preview="vite preview" type="module"
\`\`\`

## 2. Install the Auth0 SPA JS SDK
\`\`\`bash
npm install @auth0/auth0-spa-js
\`\`\`

## 3. Setup your Auth0 App
Create a new app on your Auth0 tenant and add the environment variables to your project in \`.env.local\`:
\`\`\`env
VITE_AUTH0_DOMAIN=dev-dea5vqbzg6mutbjd.us.auth0.com
VITE_AUTH0_CLIENT_ID=e0kFuXgvKko7ST3mTbbYXEqG3AiNmcGV
\`\`\`

## 4. Create the HTML structure and application logic
(See the provided code snippets in the original documentation)
`;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-sm"
      >
        <Link to="/login" className="text-indigo-600 hover:text-indigo-800 mb-4 inline-block">
          &larr; Voltar para Login
        </Link>
        <div className="prose prose-indigo max-w-none">
          <pre className="whitespace-pre-wrap font-sans text-gray-800">{docs}</pre>
        </div>
      </motion.div>
    </div>
  );
}
