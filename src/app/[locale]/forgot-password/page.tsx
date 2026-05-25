"use client";

import Image from "next/image";
import { useState } from "react";
import { ForgotPassword } from "../login/_components/forgot-password";

export default function ForgotPasswordPage() {
  const [showForgotPassword, setShowForgotPassword] = useState(true);

  const handleBackToLogin = () => {
    // In a real app, this would redirect to the login page
    console.log("Back to login");
  };

  return (
    <div className="relative min-h-svh w-full overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-black/40 z-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-green-900/50 to-blue-900/50 z-20" />
        <Image
          src="/mountains.jpg"
          alt="Outdoor background"
          fill
          priority
          className="object-cover"
        />
      </div>

      {/* Content */}
      <div className="relative z-30 flex min-h-svh items-center justify-center p-6">
        <div className="w-full max-w-md">
          {showForgotPassword && (
            <ForgotPassword onBackToLogin={handleBackToLogin} />
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 z-30 p-4 text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
          <span className="text-white/80 text-sm">Desarrollado por</span>
          <a
            href="https://bridev.cl"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white font-medium hover:text-green-400 transition-colors"
          >
            Bridev
          </a>
        </div>
      </div>
    </div>
  );
}
