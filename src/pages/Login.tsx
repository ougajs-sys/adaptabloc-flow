import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Mail, ChevronDown, ChevronUp } from "lucide-react";
import { motion } from "framer-motion";

const FacebookIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const GoogleIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const Login = () => {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const [showEmail, setShowEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  const handleLogin = async (provider: "facebook" | "google" | "email") => {
    setLoadingProvider(provider);
    try {
      await login(provider, email, password);
      navigate("/onboarding");
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg font-[Space_Grotesk]">EF</span>
          </div>
          <span className="text-2xl font-bold font-[Space_Grotesk] text-foreground">
            Easy<span className="text-primary">Flow</span>
          </span>
        </Link>

        {/* Headline */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground font-[Space_Grotesk] mb-2">
            Bienvenue sur EasyFlow
          </h1>
          <p className="text-muted-foreground text-sm">
            Connectez-vous pour gérer votre boutique
          </p>
        </div>

        {/* Facebook — Primary CTA */}
        <Button
          onClick={() => handleLogin("facebook")}
          disabled={isLoading}
          className="w-full h-12 text-base font-semibold mb-3 text-white"
          style={{ backgroundColor: "#1877F2" }}
        >
          {loadingProvider === "facebook" ? (
            <Loader2 className="animate-spin mr-2" size={20} />
          ) : (
            <FacebookIcon size={20} />
          )}
          <span className="ml-2">Continuer avec Facebook</span>
        </Button>

        {/* Google — Secondary */}
        <Button
          variant="outline"
          onClick={() => handleLogin("google")}
          disabled={isLoading}
          className="w-full h-11 text-sm font-medium mb-6"
        >
          {loadingProvider === "google" ? (
            <Loader2 className="animate-spin mr-2" size={18} />
          ) : (
            <GoogleIcon size={18} />
          )}
          <span className="ml-2">Continuer avec Google</span>
        </Button>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-background px-3 text-muted-foreground">ou</span>
          </div>
        </div>

        {/* Email toggle */}
        <button
          onClick={() => setShowEmail(!showEmail)}
          className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <Mail size={16} />
          <span>Se connecter par email</span>
          {showEmail ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showEmail && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="space-y-3"
          >
            <Input
              type="email"
              placeholder="Votre email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11"
            />
            <Input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11"
            />
            <Button
              onClick={() => handleLogin("email")}
              disabled={isLoading || !email}
              className="w-full h-11"
            >
              {loadingProvider === "email" ? (
                <Loader2 className="animate-spin mr-2" size={18} />
              ) : null}
              Se connecter
            </Button>
          </motion.div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          En continuant, vous acceptez les{" "}
          <span className="underline cursor-pointer">conditions d'utilisation</span>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
