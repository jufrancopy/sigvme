'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Building2, Users, ClipboardList, CheckCircle, Heart, Activity, Brain, Smile, Salad } from 'lucide-react'
import { BarChart, Bar, PieChart, Pie, Cell, RadialBarChart, RadialBar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import api from '@/services/api'
import { empresasService } from '@/services/empresas'
import { Empresa } from '@/types'

interface RankingEmpresa {
  empresa: string
  empresa_id: string
  total_evaluados: number
  hta_pct: number
  dbt_pct: number
  obesidad_pct: number
  sobrepeso_pct: number
  ecv_pct: number
  no_apto_pct: number
  estres_pct: number
  indice_morbilidad: number
}

interface Indicadores {
  totales: { evaluaciones_enfermeria: number; evaluaciones_medicina: number; evaluaciones_psicologia: number; evaluaciones_odontologia: number }
  cardiovascular: { hta: number; hta_no_diagnosticada: number; ecv: number; renal: number; total: number }
  diabetes: { diagnosticada: number; glucemia_alta: number; hba1c_alta: number; total_enf: number; total_med: number }
  imc: { distribucion: { bajo_peso: number; normal: number; sobrepeso: number; obesidad: number }; promedio: number | null; total: number }
  findrisc: { distribucion: { bajo: number; moderado: number; muy_alto: number }; total: number }
  hearts: { distribucion: { bajo: number; moderado: number; alto: number }; total: number }
  aptitud_laboral: { apto: number; no_apto: number; total: number }
  alcohol: { distribucion: { normal: number; riesgoso: number; trastorno: number }; total: number }
  estres: { distribucion: { leve: number; moderado: number; severo: number }; promedio: number | null; total: number }
  salud_bucal: { boca_sana: number; caries: number; periodontal: number; total: number }
  habitos: { sedentarios: number; bajo_consumo_frutas: number; total: number }
}

const COLORS = {
  verde:    '#22c55e',
  amarillo: '#eab308',
  rojo:     '#ef4444',
  azul:     '#3b82f6',
  naranja:  '#f97316',
  violeta:  '#8b5cf6',
  gris:     '#94a3b8',
}

function pct(valor: number, total: number) {
  if (!total) return 0
  return Math.round((valor / total) * 100)
}

function BarraIndicador({ label, valor, total, color }: { label: string; valor: number; total: number; color: string }) {
  const p = pct(valor, total)
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="font-medium">{valor} <span className="text-slate-400 font-normal">({p}%)</span></span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${p}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [indicadores, setIndicadores] = useState<Indicadores | null>(null)
  const [ranking, setRanking] = useState<RankingEmpresa[]>([])
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [filtroEmpresa, setFiltroEmpresa] = useState('TODAS')
  const [statsGlobales, setStatsGlobales] = useState({ empresas: 0, pacientes: 0, jornadas: 0, completadas: 0 })

  useEffect(() => {
    empresasService.listar().then(({ data }) => setEmpresas(data.results ?? data))
    Promise.all([
      api.get('/empresas/'),
      api.get('/pacientes/'),
      api.get('/jornadas/'),
      api.get('/ranking-empresas/'),
    ]).then(([emp, pac, jor, rank]) => {
      setStatsGlobales({
        empresas: emp.data.count ?? 0,
        pacientes: pac.data.count ?? 0,
        jornadas: jor.data.count ?? 0,
        completadas: (jor.data.results ?? []).filter((j: { estado: string }) => j.estado === 'FINALIZADA').length,
      })
      setRanking(rank.data)
    })
  }, [])

  useEffect(() => {
    const params = filtroEmpresa !== 'TODAS' ? `?empresa=${filtroEmpresa}` : ''
    api.get(`/indicadores/${params}`).then(({ data }) => setIndicadores(data))
  }, [filtroEmpresa])

  const imcData = indicadores ? [
    { name: 'Bajo peso',  value: indicadores.imc.distribucion.bajo_peso,  fill: COLORS.azul },
    { name: 'Normal',     value: indicadores.imc.distribucion.normal,     fill: COLORS.verde },
    { name: 'Sobrepeso',  value: indicadores.imc.distribucion.sobrepeso,  fill: COLORS.amarillo },
    { name: 'Obesidad',   value: indicadores.imc.distribucion.obesidad,   fill: COLORS.rojo },
  ] : []

  const findriscData = indicadores ? [
    { name: 'Bajo',      value: indicadores.findrisc.distribucion.bajo,     fill: COLORS.verde },
    { name: 'Moderado',  value: indicadores.findrisc.distribucion.moderado, fill: COLORS.amarillo },
    { name: 'Muy alto',  value: indicadores.findrisc.distribucion.muy_alto, fill: COLORS.rojo },
  ] : []

  const auditData = indicadores ? [
    { name: 'Normal',    value: indicadores.alcohol.distribucion.normal,    fill: COLORS.verde },
    { name: 'Riesgoso',  value: indicadores.alcohol.distribucion.riesgoso,  fill: COLORS.amarillo },
    { name: 'Trastorno', value: indicadores.alcohol.distribucion.trastorno, fill: COLORS.rojo },
  ] : []

  const estresData = indicadores ? [
    { name: 'Leve',     value: indicadores.estres.distribucion.leve,     fill: COLORS.verde },
    { name: 'Moderado', value: indicadores.estres.distribucion.moderado, fill: COLORS.amarillo },
    { name: 'Severo',   value: indicadores.estres.distribucion.severo,   fill: COLORS.rojo },
  ] : []

  const aptitudData = indicadores ? [
    { name: 'Apto',     value: indicadores.aptitud_laboral.apto,     fill: COLORS.verde },
    { name: 'No apto',  value: indicadores.aptitud_laboral.no_apto,  fill: COLORS.rojo },
  ] : []

  const resumenBarData = indicadores ? [
    { name: 'HTA',        valor: pct(indicadores.cardiovascular.hta, indicadores.cardiovascular.total) },
    { name: 'DBT',        valor: pct(indicadores.diabetes.diagnosticada, indicadores.diabetes.total_enf) },
    { name: 'Obesidad',   valor: pct(indicadores.imc.distribucion.obesidad, indicadores.imc.total) },
    { name: 'Sedent.',    valor: pct(indicadores.habitos.sedentarios, indicadores.habitos.total) },
    { name: 'Caries',     valor: pct(indicadores.salud_bucal.caries, indicadores.salud_bucal.total) },
    { name: 'Alcohol',    valor: pct((indicadores.alcohol.distribucion.riesgoso + indicadores.alcohol.distribucion.trastorno), indicadores.alcohol.total) },
    { name: 'Estrés',     valor: pct((indicadores.estres.distribucion.moderado + indicadores.estres.distribucion.severo), indicadores.estres.total) },
  ] : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Dashboard de Salud</h1>
          <p className="text-sm text-slate-500">Indicadores de salud poblacional y riesgo clínico</p>
        </div>
        <div className="w-56">
          <Select value={filtroEmpresa} onValueChange={setFiltroEmpresa}>
            <SelectTrigger><SelectValue placeholder="Filtrar por empresa..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="TODAS">Todas las empresas</SelectItem>
              {empresas.map(e => <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats globales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Empresas',    value: statsGlobales.empresas,    icon: Building2,    color: 'text-blue-600' },
          { title: 'Funcionarios', value: statsGlobales.pacientes,  icon: Users,        color: 'text-green-600' },
          { title: 'Jornadas',    value: statsGlobales.jornadas,    icon: ClipboardList, color: 'text-orange-600' },
          { title: 'Finalizadas', value: statsGlobales.completadas, icon: CheckCircle,  color: 'text-purple-600' },
        ].map(({ title, value, icon: Icon, color }) => (
          <Card key={title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
              <Icon className={`h-5 w-5 ${color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-800">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {!indicadores ? (
        <div className="text-center py-12 text-slate-400">Cargando indicadores...</div>
      ) : (
        <>
          {/* Resumen prevalencia — gráfico de barras */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-slate-500" />
                Prevalencia de factores de riesgo (%)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={resumenBarData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} unit="%" domain={[0, 100]} />
                  <Tooltip formatter={(v) => `${v}%`} />
                  <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                    {resumenBarData.map((entry) => (
                      <Cell key={entry.name} fill={entry.valor >= 40 ? COLORS.rojo : entry.valor >= 20 ? COLORS.amarillo : COLORS.azul} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Ranking empresas más enfermas */}
          {ranking.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-slate-500" />
                  Ranking de morbilidad por empresa
                  <span className="ml-2 text-xs font-normal text-slate-400">(índice ponderado: HTA 25% · DBT 20% · ECV 20% · Obesidad 15% · No apto 10% · Estrés 5% · FINDRISC 5%)</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {ranking.map((r, i) => {
                    const color = r.indice_morbilidad >= 30 ? COLORS.rojo : r.indice_morbilidad >= 15 ? COLORS.amarillo : COLORS.verde
                    return (
                      <div key={r.empresa_id} className="flex items-center gap-3">
                        <span className="text-sm font-bold text-slate-400 w-5 shrink-0">#{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium text-slate-700 truncate">{r.empresa}</span>
                            <div className="flex items-center gap-3 shrink-0 ml-2">
                              <span className="text-xs text-slate-400">{r.total_evaluados} eval.</span>
                              <span className="text-sm font-bold" style={{ color }}>{r.indice_morbilidad}</span>
                            </div>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(r.indice_morbilidad, 100)}%`, backgroundColor: color }} />
                          </div>
                          <div className="flex gap-3 mt-1 flex-wrap">
                            {r.hta_pct > 0 && <span className="text-xs text-slate-500">HTA {r.hta_pct}%</span>}
                            {r.dbt_pct > 0 && <span className="text-xs text-slate-500">DBT {r.dbt_pct}%</span>}
                            {(r.obesidad_pct + r.sobrepeso_pct) > 0 && <span className="text-xs text-slate-500">Obesidad/SP {r.obesidad_pct + r.sobrepeso_pct}%</span>}
                            {r.no_apto_pct > 0 && <span className="text-xs text-red-500 font-medium">No apto {r.no_apto_pct}%</span>}
                            {r.estres_pct > 0 && <span className="text-xs text-slate-500">Estrés {r.estres_pct}%</span>}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Cardiovascular */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  Riesgo Cardiovascular
                  <Badge variant="outline" className="ml-auto text-xs">{indicadores.cardiovascular.total} evaluados</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <BarraIndicador label="Hipertensión diagnosticada" valor={indicadores.cardiovascular.hta} total={indicadores.cardiovascular.total} color={COLORS.rojo} />
                <BarraIndicador label="HTA no diagnosticada (PA elevada)" valor={indicadores.cardiovascular.hta_no_diagnosticada} total={indicadores.cardiovascular.total} color={COLORS.naranja} />
                <BarraIndicador label="Antecedente ECV" valor={indicadores.cardiovascular.ecv} total={indicadores.cardiovascular.total} color={COLORS.violeta} />
                <BarraIndicador label="Enfermedad renal crónica" valor={indicadores.cardiovascular.renal} total={indicadores.cardiovascular.total} color={COLORS.amarillo} />
                <div className="pt-2 border-t">
                  <p className="text-xs text-slate-500 mb-2">Riesgo HEARTS</p>
                  <div className="flex gap-3 text-sm">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />Bajo: {indicadores.hearts.distribucion.bajo}</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" />Moderado: {indicadores.hearts.distribucion.moderado}</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />Alto: {indicadores.hearts.distribucion.alto}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Diabetes / FINDRISC */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4 text-orange-500" />
                  Diabetes y Riesgo Metabólico
                  <Badge variant="outline" className="ml-auto text-xs">{indicadores.diabetes.total_enf} evaluados</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <BarraIndicador label="Diabetes diagnosticada" valor={indicadores.diabetes.diagnosticada} total={indicadores.diabetes.total_enf} color={COLORS.rojo} />
                <BarraIndicador label="Glucemia ≥ 126 mg/dL" valor={indicadores.diabetes.glucemia_alta} total={indicadores.diabetes.total_med} color={COLORS.naranja} />
                <BarraIndicador label="HbA1c ≥ 6.5%" valor={indicadores.diabetes.hba1c_alta} total={indicadores.diabetes.total_med} color={COLORS.amarillo} />
                <div className="pt-2 border-t">
                  <p className="text-xs text-slate-500 mb-2">Riesgo FINDRISC ({indicadores.findrisc.total} evaluados)</p>
                  <ResponsiveContainer width="100%" height={100}>
                    <BarChart data={findriscData} layout="vertical" margin={{ left: 10, right: 30, top: 0, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={60} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {findriscData.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* IMC */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  Índice de Masa Corporal
                  {indicadores.imc.promedio && (
                    <Badge variant="secondary" className="ml-auto text-xs">Promedio: {indicadores.imc.promedio}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width="50%" height={160}>
                    <PieChart>
                      <Pie data={imcData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={2}>
                        {imcData.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 flex-1">
                    {imcData.map(d => (
                      <div key={d.name} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: d.fill }} />
                          {d.name}
                        </span>
                        <span className="font-medium">{d.value} <span className="text-slate-400 text-xs">({pct(d.value, indicadores.imc.total)}%)</span></span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Salud mental */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Brain className="h-4 w-4 text-purple-500" />
                  Salud Mental
                  <Badge variant="outline" className="ml-auto text-xs">{indicadores.estres.total} evaluados</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-slate-500 mb-2">Nivel de estrés EVA {indicadores.estres.promedio !== null && <span className="font-medium text-slate-700">(promedio: {indicadores.estres.promedio}/10)</span>}</p>
                  <div className="flex gap-2 h-24">
                    {estresData.map(d => (
                      <div key={d.name} className="flex-1 flex flex-col items-center justify-end gap-1">
                        <span className="text-xs font-medium">{d.value}</span>
                        <div className="w-full rounded-t" style={{ height: `${pct(d.value, indicadores.estres.total)}%`, minHeight: 4, backgroundColor: d.fill }} />
                        <span className="text-xs text-slate-500">{d.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border-t pt-3">
                  <p className="text-xs text-slate-500 mb-2">Consumo de alcohol AUDIT</p>
                  <div className="flex gap-2 h-20">
                    {auditData.map(d => (
                      <div key={d.name} className="flex-1 flex flex-col items-center justify-end gap-1">
                        <span className="text-xs font-medium">{d.value}</span>
                        <div className="w-full rounded-t" style={{ height: `${pct(d.value, indicadores.alcohol.total)}%`, minHeight: 4, backgroundColor: d.fill }} />
                        <span className="text-xs text-slate-500">{d.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Salud bucal */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Smile className="h-4 w-4 text-cyan-500" />
                  Salud Bucal
                  <Badge variant="outline" className="ml-auto text-xs">{indicadores.salud_bucal.total} evaluados</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <BarraIndicador label="Boca sana" valor={indicadores.salud_bucal.boca_sana} total={indicadores.salud_bucal.total} color={COLORS.verde} />
                <BarraIndicador label="Caries no tratada" valor={indicadores.salud_bucal.caries} total={indicadores.salud_bucal.total} color={COLORS.rojo} />
                <BarraIndicador label="Enfermedad periodontal" valor={indicadores.salud_bucal.periodontal} total={indicadores.salud_bucal.total} color={COLORS.naranja} />
              </CardContent>
            </Card>

            {/* Hábitos + Aptitud laboral */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Salad className="h-4 w-4 text-green-500" />
                  Hábitos y Aptitud Laboral
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-slate-500 mb-2">Hábitos ({indicadores.habitos.total} evaluados)</p>
                  <BarraIndicador label="Sedentarismo" valor={indicadores.habitos.sedentarios} total={indicadores.habitos.total} color={COLORS.naranja} />
                  <div className="mt-2">
                    <BarraIndicador label="Bajo consumo frutas/verduras" valor={indicadores.habitos.bajo_consumo_frutas} total={indicadores.habitos.total} color={COLORS.amarillo} />
                  </div>
                </div>
                <div className="border-t pt-3">
                  <p className="text-xs text-slate-500 mb-3">Aptitud laboral ({indicadores.aptitud_laboral.total} evaluados)</p>
                  <div className="flex items-center gap-4">
                    <ResponsiveContainer width="50%" height={120}>
                      <PieChart>
                        <Pie data={aptitudData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value" paddingAngle={3}>
                          {aptitudData.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />Apto</span>
                        <span className="font-medium">{indicadores.aptitud_laboral.apto} <span className="text-slate-400 text-xs">({pct(indicadores.aptitud_laboral.apto, indicadores.aptitud_laboral.total)}%)</span></span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />No apto</span>
                        <span className="font-medium">{indicadores.aptitud_laboral.no_apto} <span className="text-slate-400 text-xs">({pct(indicadores.aptitud_laboral.no_apto, indicadores.aptitud_laboral.total)}%)</span></span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </>
      )}
    </div>
  )
}
