import { useState } from "react";
import { OnboardingData } from "@/pages/Onboarding";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Sparkles, ArrowRight, ArrowLeft, Check, Loader2,
  ShoppingCart, Users, Package, Truck, BarChart3,
  MessageSquare, MapPin, Bot, Boxes, Award,
} from "lucide-react";

// ── Guided questions ──

interface QuestionOption {
  id: string;
  label: string;
  description: string;
}

interface Question {
  id: string;
  question: string;
  subtitle: string;
  multiSelect: boolean;
  options: QuestionOption[];
}

const guidedQuestions: Question[] = [
  {
    id: "activity_type",
    question: "Que faites-vous exactement ?",
    subtitle: "Décrivez votre activité en quelques mots ou choisissez ce qui s'en rapproche le plus",
    multiSelect: false,
    options: [
      { id: "vente_produits", label: "Je vends des produits", description: "Physiques ou numériques" },
      { id: "services", label: "Je propose des services", description: "Rendez-vous, prestations..." },
      { id: "food", label: "Restauration / Alimentation", description: "Restaurant, traiteur, cuisine..." },
      { id: "mixte", label: "Un peu des deux", description: "Produits + services combinés" },
    ],
  },
  {
    id: "volume",
    question: "Combien de commandes gérez-vous par mois ?",
    subtitle: "Cela nous aide à dimensionner votre système",
    multiSelect: false,
    options: [
      { id: "small", label: "Moins de 50", description: "Je débute ou c'est une petite activité" },
      { id: "medium", label: "50 à 200", description: "Mon activité tourne bien" },
      { id: "large", label: "200 à 500", description: "J'ai une équipe qui m'aide" },
      { id: "xlarge", label: "Plus de 500", description: "C'est une grosse opération" },
    ],
  },
  {
    id: "team_size",
    question: "Combien de personnes travaillent avec vous ?",
    subtitle: "On adapte les fonctionnalités d'équipe à votre taille",
    multiSelect: false,
    options: [
      { id: "solo", label: "Juste moi", description: "Je gère tout seul(e)" },
      { id: "small_team", label: "2 à 5 personnes", description: "Une petite équipe" },
      { id: "medium_team", label: "6 à 15 personnes", description: "Plusieurs rôles différents" },
      { id: "large_team", label: "Plus de 15", description: "Une grande équipe" },
    ],
  },
  {
    id: "needs",
    question: "Qu'est-ce qui est le plus important pour vous ?",
    subtitle: "Sélectionnez tout ce qui compte (plusieurs choix possibles)",
    multiSelect: true,
    options: [
      { id: "need_orders", label: "Gérer mes commandes facilement", description: "Suivi, statuts, pipeline" },
      { id: "need_delivery", label: "Organiser mes livraisons", description: "Livreurs, suivi, zones" },
      { id: "need_stock", label: "Contrôler mon stock", description: "Alertes, inventaire, FIFO" },
      { id: "need_clients", label: "Fidéliser mes clients", description: "Historique, segments, fidélité" },
      { id: "need_team", label: "Coordonner mon équipe", description: "Rôles, performance, tâches" },
      { id: "need_marketing", label: "Faire du marketing", description: "SMS, WhatsApp, campagnes" },
    ],
  },
];

// ── Module recommendation engine (simulated AI) ──

function recommendModules(answers: Record<string, string[]>): {
  recommended: string[];
  sectorLabel: string;
  description: string;
} {
  const needs = answers.needs || [];
  const volume = (answers.volume || [])[0] || "small";
  const teamSize = (answers.team_size || [])[0] || "solo";
  const activityType = (answers.activity_type || [])[0] || "vente_produits";

  const recommended: string[] = [];
  let sectorLabel = "Configuration personnalisée";
  let description = "";

  // Activity type determines base label
  switch (activityType) {
    case "vente_produits":
      sectorLabel = "Vente de produits";
      description = "Un système optimisé pour la vente et la gestion de produits";
      break;
    case "services":
      sectorLabel = "Prestataire de services";
      description = "Un système adapté à la gestion de rendez-vous et prestations";
      break;
    case "food":
      sectorLabel = "Restauration & Alimentation";
      description = "Un système pensé pour la restauration et les commandes alimentaires";
      break;
    case "mixte":
      sectorLabel = "Activité mixte";
      description = "Un système hybride pour gérer produits et services";
      break;
  }

  // Needs-based recommendations
  if (needs.includes("need_orders")) recommended.push("custom_status");
  if (needs.includes("need_delivery")) recommended.push("extra_drivers");
  if (needs.includes("need_stock")) recommended.push("stock_auto");
  if (needs.includes("need_clients")) {
    recommended.push("customer_history", "segmentation");
  }
  if (needs.includes("need_team")) {
    recommended.push("extra_callers", "extra_preparers");
  }
  if (needs.includes("need_marketing")) {
    recommended.push("campaigns", "message_templates");
  }

  // Volume-based upgrades
  if (volume === "large" || volume === "xlarge") {
    recommended.push("export");
    if (!recommended.includes("stock_auto")) recommended.push("stock_auto");
  }
  if (volume === "xlarge") {
    recommended.push("automations");
  }

  // Team-based upgrades
  if (teamSize === "medium_team" || teamSize === "large_team") {
    if (!recommended.includes("extra_callers")) recommended.push("extra_callers");
    if (!recommended.includes("extra_preparers")) recommended.push("extra_preparers");
    if (!recommended.includes("extra_drivers")) recommended.push("extra_drivers");
  }
  if (teamSize === "large_team") {
    recommended.push("call_center", "warehouse_team", "multi_delivery");
  }

  // Deduplicate
  return {
    recommended: [...new Set(recommended)],
    sectorLabel,
    description,
  };
}

// ── Component ──

interface Props {
  data: OnboardingData;
  updateData: (d: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export const OnboardingStepCustom = ({ data, updateData, onNext, onBack }: Props) => {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof recommendModules> | null>(null);

  const currentQuestion = guidedQuestions[questionIndex];
  const totalQuestions = guidedQuestions.length;
  const progress = result
    ? 100
    : ((questionIndex + 1) / (totalQuestions + 1)) * 100;

  const currentAnswers = answers[currentQuestion?.id] || [];

  const toggleAnswer = (optionId: string) => {
    const qId = currentQuestion.id;
    if (currentQuestion.multiSelect) {
      setAnswers((prev) => {
        const current = prev[qId] || [];
        return {
          ...prev,
          [qId]: current.includes(optionId)
            ? current.filter((a) => a !== optionId)
            : [...current, optionId],
        };
      });
    } else {
      setAnswers((prev) => ({ ...prev, [qId]: [optionId] }));
    }
  };

  const nextQuestion = () => {
    if (questionIndex < totalQuestions - 1) {
      setQuestionIndex((i) => i + 1);
    } else {
      // Simulate AI analysis
      setIsAnalyzing(true);
      setTimeout(() => {
        const r = recommendModules(answers);
        setResult(r);
        updateData({ modules: r.recommended, customSectorLabel: r.sectorLabel });
        setIsAnalyzing(false);
      }, 2000);
    }
  };

  const prevQuestion = () => {
    if (result) {
      setResult(null);
      setQuestionIndex(totalQuestions - 1);
    } else if (questionIndex > 0) {
      setQuestionIndex((i) => i - 1);
    } else {
      onBack();
    }
  };

  // ── Analyzing screen ──
  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
          <Sparkles size={32} className="text-primary animate-pulse" />
        </div>
        <h2 className="text-2xl font-bold text-foreground font-[Space_Grotesk] mb-3">
          Intramate analyse votre activité...
        </h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Notre intelligence embarquée prépare une configuration sur mesure pour vous.
          Cela ne prend que quelques secondes.
        </p>
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  // ── Result screen ──
  if (result) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
            <Sparkles size={22} className="text-accent" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground font-[Space_Grotesk]">
              Votre système est prêt !
            </h2>
          </div>
        </div>
        <p className="text-muted-foreground mb-6">
          Basé sur vos réponses, voici ce qu'on vous recommande. Vous pourrez tout modifier plus tard.
        </p>

        <Card className="border-primary/30 bg-primary/5 mb-6">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <Bot size={24} className="text-primary mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">{result.sectorLabel}</p>
                <p className="text-sm text-muted-foreground mt-1">{result.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mb-6">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Modules recommandés pour vous ({result.recommended.length})
          </h3>
          <div className="grid gap-2">
            {result.recommended.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Les modules gratuits de base suffisent pour démarrer ! Vous pourrez en ajouter plus tard.
              </p>
            ) : (
              result.recommended.map((modId) => (
                <div
                  key={modId}
                  className="flex items-center gap-3 p-3 rounded-lg border border-primary/30 bg-primary/5 text-sm"
                >
                  <div className="w-5 h-5 rounded bg-primary flex items-center justify-center shrink-0">
                    <Check size={12} className="text-primary-foreground" />
                  </div>
                  <span className="text-foreground font-medium">{modId.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <p className="text-xs text-muted-foreground mb-6 flex items-start gap-2">
          <Sparkles size={14} className="shrink-0 mt-0.5 text-primary" />
          Bientôt, notre IA analysera votre activité en profondeur pour des recommandations encore plus précises.
        </p>

        <div className="flex justify-between">
          <Button variant="ghost" onClick={prevQuestion}>
            <ArrowLeft size={16} className="mr-2" />
            Modifier mes réponses
          </Button>
          <Button onClick={onNext} className="px-8">
            Continuer avec cette configuration
            <ArrowRight size={16} className="ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  // ── Question screen ──
  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Sparkles size={18} className="text-primary" />
        </div>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Question {questionIndex + 1} sur {totalQuestions}
        </span>
      </div>

      <Progress value={progress} className="h-1.5 rounded-full mb-6 mt-3" />

      <h2 className="text-2xl font-bold text-foreground font-[Space_Grotesk] mb-2">
        {currentQuestion.question}
      </h2>
      <p className="text-muted-foreground mb-8">
        {currentQuestion.subtitle}
      </p>

      <div className="grid gap-3">
        {currentQuestion.options.map((opt) => {
          const selected = currentAnswers.includes(opt.id);
          return (
            <button
              key={opt.id}
              onClick={() => toggleAnswer(opt.id)}
              className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                selected
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border bg-card hover:border-primary/30"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                  selected ? "bg-primary" : "border border-border"
                }`}
              >
                {selected && <Check size={14} className="text-primary-foreground" />}
              </div>
              <div>
                <span className="font-medium text-foreground block">{opt.label}</span>
                <span className="text-xs text-muted-foreground">{opt.description}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex justify-between">
        <Button variant="ghost" onClick={prevQuestion}>
          <ArrowLeft size={16} className="mr-2" />
          Retour
        </Button>
        <Button onClick={nextQuestion} disabled={currentAnswers.length === 0} className="px-8">
          {questionIndex === totalQuestions - 1 ? "Analyser mon activité" : "Suivant"}
          <ArrowRight size={16} className="ml-2" />
        </Button>
      </div>
    </div>
  );
};
