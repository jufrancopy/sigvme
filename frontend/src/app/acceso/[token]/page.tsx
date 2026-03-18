'use client'

import { useEffect, useState, use } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import axios from 'axios'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1'

function pct(n: number, total: number) {
  if (!total) return 0
  return Math.round((n / total) * 100)
}

function Stat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 text-center shadow-sm">
      <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color ?? 'text-slate-800'}`}>{value}</p>
    </div>
  )
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
        <h2 className="font-semibold text-slate-700 text-sm">{titulo}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

export default function AccesoPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get(`${API}/publico/indicadores/${token}/`)
      .then(r => setData(r.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <p className="text-slate-400">Cargando...</p>
    </div>
  )

  if (error || !data) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <p className="text-slate-400">Link inválido o expirado.</p>
    </div>
  )

  const { empresa, totales, cardiovascular, diabetes, imc, aptitud_laboral, estres, salud_bucal, habitos } = data
  const totalEnf = totales.evaluaciones_enfermeria
  const totalMed = totales.evaluaciones_medicina
  const totalPsi = totales.evaluaciones_psicologia
  const totalOdo = totales.evaluaciones_odontologia

  const imcData = [
    { name: 'Bajo peso', value: imc.distribucion.bajo_peso, color: '#60a5fa' },
    { name: 'Normal',    value: imc.distribucion.normal,    color: '#34d399' },
    { name: 'Sobrepeso', value: imc.distribucion.sobrepeso, color: '#fbbf24' },
    { name: 'Obesidad',  value: imc.distribucion.obesidad,  color: '#f87171' },
  ]

  const estresData = [
    { name: 'Leve',     value: estres.distribucion.leve,     color: '#34d399' },
    { name: 'Moderado', value: estres.distribucion.moderado, color: '#fbbf24' },
    { name: 'Severo',   value: estres.distribucion.severo,   color: '#f87171' },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-teal-600 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
              <img src="/logo.png" alt="Logo" className="w-7 h-7 object-contain" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">{empresa.nombre}</h1>
              <p className="text-sm text-teal-200">{empresa.rubro} · SIGVME</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-teal-300">Evaluados</p>
            <p className="text-2xl font-bold text-white">{totalEnf}</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">

        {/* Stats principales */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label="HTA" value={`${pct(cardiovascular.hta, totalEnf)}%`} color="text-red-500" />
          <Stat label="Diabetes" value={`${pct(diabetes.diagnosticada, totalEnf)}%`} color="text-orange-500" />
          <Stat label="Sobrepeso/Obesidad" value={`${pct(imc.distribucion.sobrepeso + imc.distribucion.obesidad, totalEnf)}%`} color="text-yellow-500" />
          <Stat label="Aptos laborales" value={`${pct(aptitud_laboral.apto, totalMed)}%`} color="text-green-600" />
        </div>

        {/* IMC */}
        <Seccion titulo="Distribución IMC">
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={imcData} barSize={36}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v} personas`]} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {imcData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {imc.promedio && (
              <div className="text-center shrink-0">
                <p className="text-xs text-slate-400">IMC promedio</p>
                <p className="text-3xl font-bold text-slate-700">{imc.promedio}</p>
              </div>
            )}
          </div>
        </Seccion>

        {/* Estrés */}
        <Seccion titulo="Nivel de Estrés (EVA)">
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={estresData} barSize={36}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v} personas`]} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {estresData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {estres.promedio !== null && (
              <div className="text-center shrink-0">
                <p className="text-xs text-slate-400">Promedio EVA</p>
                <p className="text-3xl font-bold text-slate-700">{estres.promedio}</p>
                <p className="text-xs text-slate-400">/ 10</p>
              </div>
            )}
          </div>
        </Seccion>

        {/* Salud bucal y hábitos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Seccion titulo="Salud Bucal">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Boca sana</span><span className="font-medium text-green-600">{pct(salud_bucal.boca_sana, totalOdo)}%</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Caries no tratada</span><span className="font-medium text-red-500">{pct(salud_bucal.caries, totalOdo)}%</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Enf. periodontal</span><span className="font-medium text-orange-500">{pct(salud_bucal.periodontal, totalOdo)}%</span></div>
            </div>
          </Seccion>
          <Seccion titulo="Hábitos">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Sedentarios</span><span className="font-medium text-red-500">{pct(habitos.sedentarios, habitos.total)}%</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Bajo consumo frutas/verduras</span><span className="font-medium text-orange-500">{pct(habitos.bajo_consumo_frutas, habitos.total)}%</span></div>
            </div>
          </Seccion>
        </div>

        <p className="text-center text-xs text-slate-300 pb-4">
          Reporte generado por Medicina Preventiva ·{' '}
          <a href="https://thepydeveloper.dev" target="_blank" rel="noopener noreferrer" className="text-teal-500 hover:underline">
            Julio Franco
          </a>
        </p>
      </div>
    </div>
  )
}
