import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Users, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface UserRow {
  user_id: string;
  name: string;
  email: string | null;
  store_name: string;
  role: string;
  created_at: string;
}

export default function SuperAdminUsers() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [profilesRes, rolesRes, storesRes] = await Promise.all([
        supabase.from("profiles").select("user_id, name, email, store_id, created_at"),
        supabase.from("user_roles").select("user_id, store_id, role"),
        supabase.from("stores").select("id, name"),
      ]);

      const profiles = profilesRes.data || [];
      const roles = rolesRes.data || [];
      const stores = storesRes.data || [];

      const storeMap = new Map(stores.map((s) => [s.id, s.name]));
      const roleMap = new Map<string, string>();
      roles.forEach((r) => {
        const key = `${r.user_id}_${r.store_id}`;
        roleMap.set(key, r.role);
      });

      const rows: UserRow[] = profiles.map((p) => ({
        user_id: p.user_id,
        name: p.name,
        email: p.email,
        store_name: storeMap.get(p.store_id) || "—",
        role: roleMap.get(`${p.user_id}_${p.store_id}`) || "—",
        created_at: p.created_at,
      }));

      setUsers(rows);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <p className="text-muted-foreground">Chargement...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Utilisateurs</h2>
          <p className="text-sm text-muted-foreground">{users.length} utilisateurs enregistrés</p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium text-muted-foreground">Nom</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Email</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Boutique</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Rôle</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Inscription</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={`${u.user_id}-${u.store_name}`} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-3 font-medium">{u.name}</td>
                    <td className="p-3 text-muted-foreground">{u.email || "—"}</td>
                    <td className="p-3">{u.store_name}</td>
                    <td className="p-3">
                      <Badge variant="secondary" className="text-xs capitalize">{u.role}</Badge>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString("fr-FR")}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      Aucun utilisateur trouvé
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
