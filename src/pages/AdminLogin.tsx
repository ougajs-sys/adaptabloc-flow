import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Loader2, UserPlus, Clock, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const ADMIN_ROLES = ["superadmin", "support", "finance", "developer"];
const REQUEST_ROLES = [
  { value: "support", label: "Support" },
  { value: "finance", label: "Finance" },
  { value: "developer", label: "Développeur" },
];

type View = "login" | "request" | "pending";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<View>("login");

  // Request form state
  const [reqName, setReqName] = useState("");
  const [reqEmail, setReqEmail] = useState("");
  const [reqPassword, setReqPassword] = useState("");
  const [reqRole, setReqRole] = useState("support");
  const [submitting, setSubmitting] = useState(false);

  // Auto-redirect if already logged in as admin
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);
      if (roles?.some((r) => ADMIN_ROLES.includes(r.role))) {
        navigate("/admin/overview", { replace: true });
        return;
      }
      // Check if user has a pending request
      const { data: requests } = await supabase
        .from("admin_join_requests")
        .select("status")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(1);
      if (requests && requests.length > 0 && requests[0].status === "pending") {
        setView("pending");
      }
    })();
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;

      const userId = authData.user?.id;
      if (!userId) throw new Error("Utilisateur introuvable");

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      const hasAdminRole = roles?.some((r) => ADMIN_ROLES.includes(r.role));

      if (hasAdminRole) {
        navigate("/admin/overview", { replace: true });
        return;
      }

      // Check for pending request
      const { data: requests } = await supabase
        .from("admin_join_requests")
        .select("status")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (requests && requests.length > 0) {
        if (requests[0].status === "pending") {
          setView("pending");
          setLoading(false);
          return;
        }
        if (requests[0].status === "rejected") {
          setError("Votre demande d'accès a été refusée.");
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }
      }

      await supabase.auth.signOut();
      setError("Accès refusé. Vous n'avez pas les droits d'administration.");
    } catch (err: any) {
      setError(err.message || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestAccess(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      // Sign up or sign in
      let userId: string;

      // Try sign in first
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: reqEmail,
        password: reqPassword,
      });

      if (signInError) {
        // Try sign up
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: reqEmail,
          password: reqPassword,
          options: { data: { full_name: reqName } },
        });
        if (signUpError) throw signUpError;
        if (!signUpData.user) throw new Error("Erreur lors de la création du compte");
        userId = signUpData.user.id;
      } else {
        if (!signInData.user) throw new Error("Erreur de connexion");
        userId = signInData.user.id;
      }

      // Check if already has admin role
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (roles?.some((r) => ADMIN_ROLES.includes(r.role))) {
        navigate("/admin/overview", { replace: true });
        return;
      }

      // Check existing pending request
      const { data: existing } = await supabase
        .from("admin_join_requests")
        .select("id, status")
        .eq("user_id", userId)
        .eq("status", "pending")
        .limit(1);

      if (existing && existing.length > 0) {
        setView("pending");
        setSubmitting(false);
        return;
      }

      // Insert request
      const { error: insertError } = await supabase
        .from("admin_join_requests")
        .insert({
          user_id: userId,
          email: reqEmail,
          name: reqName,
          requested_role: reqRole,
        });

      if (insertError) throw insertError;

      setView("pending");
      toast({ title: "Demande envoyée", description: "Votre demande est en attente de validation par un administrateur." });
    } catch (err: any) {
      setError(err.message || "Erreur");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[hsl(222,47%,8%)] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(222,47%,14%),hsl(222,47%,6%))]" />

      <Card className="relative z-10 w-full max-w-md border-border/30 bg-card/80 backdrop-blur-xl shadow-2xl">
        {view === "pending" ? (
          <>
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                <Clock className="h-8 w-8 text-amber-500" />
              </div>
              <CardTitle className="text-2xl font-bold">Demande en attente</CardTitle>
              <CardDescription>
                Votre demande d'accès à l'espace Intramate HQ a été soumise.
                Un administrateur doit la valider avant que vous puissiez y accéder.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" onClick={() => { setView("login"); supabase.auth.signOut(); }}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Retour à la connexion
              </Button>
            </CardContent>
          </>
        ) : view === "request" ? (
          <>
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <UserPlus className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold">Demander un accès</CardTitle>
              <CardDescription>Remplissez ce formulaire pour soumettre une demande d'accès à l'espace HQ</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRequestAccess} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Nom complet</label>
                  <Input value={reqName} onChange={(e) => setReqName(e.target.value)} placeholder="Votre nom" required className="bg-background/50" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Email</label>
                  <Input type="email" value={reqEmail} onChange={(e) => setReqEmail(e.target.value)} placeholder="votre@email.com" required className="bg-background/50" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Mot de passe</label>
                  <Input type="password" value={reqPassword} onChange={(e) => setReqPassword(e.target.value)} placeholder="••••••••" required className="bg-background/50" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Rôle souhaité</label>
                  <Select value={reqRole} onValueChange={setReqRole}>
                    <SelectTrigger className="bg-background/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REQUEST_ROLES.map((r) => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">{error}</div>
                )}

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                  Soumettre la demande
                </Button>
                <Button type="button" variant="ghost" className="w-full" onClick={() => { setView("login"); setError(""); }}>
                  <ArrowLeft className="h-4 w-4 mr-2" /> Retour à la connexion
                </Button>
              </form>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold">Intramate HQ</CardTitle>
              <CardDescription>Espace réservé à l'équipe interne</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Email</label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@intramate.com" required className="bg-background/50" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Mot de passe</label>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className="bg-background/50" />
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">{error}</div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Shield className="h-4 w-4 mr-2" />}
                  Connexion sécurisée
                </Button>

                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/30" /></div>
                  <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">ou</span></div>
                </div>

                <Button type="button" variant="outline" className="w-full" onClick={() => { setView("request"); setError(""); }}>
                  <UserPlus className="h-4 w-4 mr-2" /> Demander un accès
                </Button>
              </form>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
