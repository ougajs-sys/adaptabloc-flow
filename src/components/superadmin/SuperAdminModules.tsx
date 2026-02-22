import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { modulesRegistry, type ModuleDefinition } from "@/lib/modules-registry";

export default function SuperAdminModules() {
  const [modules] = useState<ModuleDefinition[]>(modulesRegistry);

  // EUR approximate conversion (1 EUR ≈ 655.957 FCFA)
  const fcfaToEur = (fcfa: number) => (fcfa / 655.957).toFixed(2);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Catalogue Modules ({modules.length})</h2>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Module</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Niveau</TableHead>
                <TableHead>Prix FCFA</TableHead>
                <TableHead>Prix EUR</TableHead>
                <TableHead>Fonctionnalités</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {modules.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell>{m.category}</TableCell>
                  <TableCell>
                    <Badge variant={m.tier === "free" ? "default" : "secondary"}>
                      {m.tier === "free" ? "Gratuit" : m.tier.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>{m.price === 0 ? "Gratuit" : `${m.price.toLocaleString()} FCFA`}</TableCell>
                  <TableCell>{m.price === 0 ? "—" : `${fcfaToEur(m.price)} €`}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                    {m.features.join(", ")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
