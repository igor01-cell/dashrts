import { motion } from "framer-motion";
import {
  Line,
  LineChart,
  Bar,
  BarChart,
  Pie,
  PieChart,
  Cell,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import {
  RefreshCw,
  Loader2,
  Package,
  Activity,
  Archive,
  Layers,
  AlertOctagon
} from "lucide-react";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { InsightsPanel } from "@/components/dashboard/InsightsPanel";
import { useProductivityState } from "@/lib/dashboard/productivity/hooks/useProductivityState";
import { Turno } from "@/lib/dashboard/productivity/utils";

// --- SUBCOMPONENTES DA UI (100% "Burros") ---

function FilterSection({
  turnoFilter,
  setTurnoFilter,
  onRefresh,
  loading,
}: {
  turnoFilter: Turno;
  setTurnoFilter: (t: Turno) => void;
  onRefresh: () => void;
  loading: boolean;
}) {
  const turnos: Turno[] = ["Todos", "T1", "T2", "T3"];
  return (
    <div className="glass flex flex-wrap items-center justify-between gap-4 rounded-2xl p-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
          Filtro de Turno
        </span>
        <div className="flex rounded-lg bg-black/20 p-1">
          {turnos.map((t) => (
            <button
              key={t}
              onClick={() => setTurnoFilter(t)}
              className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${
                turnoFilter === t
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:bg-white/10"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <button
        onClick={onRefresh}
        disabled={loading}
        className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-xs font-bold text-foreground transition-colors hover:bg-white/10 disabled:opacity-50"
      >
        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        Atualizar Dados
      </button>
    </div>
  );
}

function MainChart({ data }: { data: any[] }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-5"
    >
      <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">
        Produtividade por Hora
      </h2>
      <div className="h-72">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.3} />
            <XAxis dataKey="hour" stroke="var(--color-muted-foreground)" fontSize={11} />
            <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
            <Tooltip
              contentStyle={{ background: "#111", border: "1px solid #333", borderRadius: 8 }}
            />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ r: 4, fill: "#3b82f6" }}
              name="Gaiolas"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.section>
  );
}

function SecondaryCharts({ perfil, categoria }: { perfil: any[]; categoria: any[] }) {
  const COLORS = ["#f87171", "#fbbf24", "#34d399", "#60a5fa"];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Esquerda: Barras (Perfil) */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-5"
      >
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Gaiolas por Perfil
        </h2>
        <div className="h-64">
          <ResponsiveContainer>
            <BarChart data={perfil} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.3} />
              <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
              <Tooltip contentStyle={{ background: "#111", border: "1px solid #333", borderRadius: 8 }} />
              <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} name="Qtd" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.section>

      {/* Direita: Rosca (Categoria) */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-5"
      >
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Categorias de Gaiola
        </h2>
        <div className="h-64">
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={categoria}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
              >
                {categoria.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "#111", border: "1px solid #333", borderRadius: 8 }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </motion.section>
    </div>
  );
}

// --- TELA PRINCIPAL ---

export function ProductivityScreen() {
  const {
    rawData,
    computedData,
    insights,
    loading,
    error,
    turnoFilter,
    setTurnoFilter,
    refresh,
  } = useProductivityState();

  if (error) {
    return (
      <div className="glass rounded-2xl border border-destructive/40 p-6 text-sm">
        <p className="font-semibold text-destructive">Falha na API de Performance</p>
        <p className="mt-1 text-muted-foreground">{error}</p>
      </div>
    );
  }

  // Desestruturação segura do computedData memoizado
  const { kpis, hourlyChart, perfilChart, categoryChart } = computedData;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. FILTROS */}
      <FilterSection
        turnoFilter={turnoFilter}
        setTurnoFilter={setTurnoFilter}
        onRefresh={refresh}
        loading={loading}
      />

      {loading && !kpis.gaiolasProcessadas ? (
        <div className="glass flex items-center justify-center rounded-2xl p-12 text-muted-foreground">
          <Loader2 className="mr-3 h-6 w-6 animate-spin text-primary" />
          <span className="text-sm">Processando telemetria operacional...</span>
        </div>
      ) : (
        <>
          {/* 2. KPI CARDS */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <KpiCard
              index={0}
              label="Produtos Processados"
              value={kpis.produtosProcessados.toLocaleString("pt-BR")}
              icon={<Package className="h-5 w-5" />}
              hint="Estimativa de itens (P/M/G)"
            />
            <KpiCard
              index={1}
              label="Gaiolas Processadas"
              value={kpis.gaiolasProcessadas.toLocaleString("pt-BR")}
              icon={<Activity className="h-5 w-5" />}
              hint="Volumetria operacional"
              tone="success"
            />
            <KpiCard
              index={2}
              label="Produtos por EHA"
              value={kpis.produtosPorEHA.toLocaleString("pt-BR")}
              icon={<Layers className="h-5 w-5" />}
              hint="Produtividade do buffer EHA"
              tone="info"
            />
            <KpiCard
              index={3}
              label="Produtos pelo RTS"
              value={kpis.produtosRTS.toLocaleString("pt-BR")}
              icon={<Archive className="h-5 w-5" />}
              hint="Produtividade do buffer RTS"
              tone="warning"
            />
            <KpiCard
              index={4}
              label="Salvados Expedidos"
              value={kpis.salvadosExpedidos.toLocaleString("pt-BR")}
              icon={<AlertOctagon className="h-5 w-5 text-destructive" />}
              hint="Isolados dos outros KPIs"
              tone="danger"
            />
          </div>

          {/* 3. GRÁFICO PRINCIPAL */}
          <MainChart data={hourlyChart} />

          {/* 4. GRÁFICOS SECUNDÁRIOS */}
          <SecondaryCharts perfil={perfilChart} categoria={categoryChart} />

          {/* INSIGHTS DE I.A. APLICADOS À PRODUTIVIDADE */}
          <div className="pt-4">
            <InsightsPanel insights={insights} />
          </div>
        </>
      )}
    </div>
  );
}
