import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import {
  BarChart3,
  PieChart,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Search,
  ArrowUpRight,
  Scale,
  Gavel,
  FileText,
  Plus,
  RefreshCw,
  Briefcase,
  X,
  Sparkles,
  CalendarDays,
  Brain
} from 'lucide-react';
import {
  getClientList,
  addClient,
  addCaseToClient,
  subscribeToClientUpdates,
  ClientItem
} from '../services/clientCaseStore';

export type CaseStatus = 'Open' | 'Pending' | 'Closed' | 'Açık' | 'Kapalı' | 'Üst Mahkemede' | 'Beklemede';

export interface CaseRecord {
  id: string;
  caseNumber: string;
  court: string;
  clientName: string;
  opponentName: string;
  subject: string;
  status: CaseStatus;
  caseType: 'Ticaret' | 'İş Hukuku' | 'Medeni/Borçlar' | 'Kira & Gayrimenkul' | 'İcra & İflas';
  openedDate: string;
  nextDeadlineDate: string;
  deadlineType: 'Duruşma / Celse' | 'Bilirkişi İtirazı (HMK 281)' | 'Cevap Dilekçesi (HMK 122)' | 'İstinaf Başvurusu' | 'Zamanaşımı Kesin Tarih';
  lawArticle?: string;
  urgencyDays: number; // calculated days remaining
  estimatedValue?: string;
}

function convertClientsToCaseRecords(clients: ClientItem[]): CaseRecord[] {
  const records: CaseRecord[] = [];
  clients.forEach((client) => {
    (client.cases || []).forEach((c) => {
      const now = new Date();
      let urgencyDays = 30;
      let deadlineDate = '2026-10-15';
      if (c.nextHearingDate) {
        deadlineDate = c.nextHearingDate;
        const diff = new Date(c.nextHearingDate).getTime() - now.getTime();
        urgencyDays = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
      }
      records.push({
        id: c.id,
        caseNumber: c.caseNumber,
        court: c.court,
        clientName: client.fullName,
        opponentName: c.opponentName,
        subject: c.subject,
        status: c.status || 'Open',
        caseType: c.subject.toLowerCase().includes('iş')
          ? 'İş Hukuku'
          : c.subject.toLowerCase().includes('kira')
          ? 'Kira & Gayrimenkul'
          : c.subject.toLowerCase().includes('icra')
          ? 'İcra & İflas'
          : 'Ticaret',
        openedDate: c.openedDate || new Date().toISOString().split('T')[0],
        nextDeadlineDate: deadlineDate,
        deadlineType: 'Duruşma / Celse',
        lawArticle: 'HMK',
        urgencyDays,
        estimatedValue: c.estimatedValue
      });
    });
  });
  return records;
}

interface CaseAnalyticsProps {
  user: {
    fullName: string;
    sicilNo: string;
    baroAdi: string;
  };
  onNavigateToTimeline?: () => void;
  onNavigateToDeepAnalysis?: () => void;
  onSelectCaseForPetition?: (caseSummary: string) => void;
}

export function CaseAnalytics({
  user,
  onNavigateToTimeline,
  onNavigateToDeepAnalysis,
  onSelectCaseForPetition,
}: CaseAnalyticsProps) {
  // Case Data State synchronized with active lawyer clientCaseStore
  const [cases, setCases] = useState<CaseRecord[]>(() => convertClientsToCaseRecords(getClientList()));

  useEffect(() => {
    const unsub = subscribeToClientUpdates((clients) => {
      setCases(convertClientsToCaseRecords(clients));
    });
    return unsub;
  }, []);

  // Filtering states
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'All' | CaseStatus>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCaseTypeFilter, setSelectedCaseTypeFilter] = useState<string>('All');
  
  // D3 Hover state for interactive tooltips
  const [hoveredSlice, setHoveredSlice] = useState<{ status: string; count: number; percentage: number } | null>(null);
  const [hoveredDeadline, setHoveredDeadline] = useState<CaseRecord | null>(null);

  // New Case Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCaseNumber, setNewCaseNumber] = useState('');
  const [newCourt, setNewCourt] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [newOpponentName, setNewOpponentName] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newStatus, setNewStatus] = useState<CaseStatus>('Open');
  const [newCaseType, setNewCaseType] = useState<CaseRecord['caseType']>('Ticaret');
  const [newDeadlineDate, setNewDeadlineDate] = useState('2026-10-15');
  const [newDeadlineType, setNewDeadlineType] = useState<CaseRecord['deadlineType']>('Duruşma / Celse');

  // SVG Refs for D3 Renderings
  const donutSvgRef = useRef<SVGSVGElement | null>(null);
  const deadlineSvgRef = useRef<SVGSVGElement | null>(null);
  const courtBarSvgRef = useRef<SVGSVGElement | null>(null);

  // Filtered cases for table
  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      const matchStatus = selectedStatusFilter === 'All' || c.status === selectedStatusFilter;
      const matchType = selectedCaseTypeFilter === 'All' || c.caseType === selectedCaseTypeFilter;
      const matchSearch =
        searchQuery === '' ||
        c.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.opponentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.court.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.subject.toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchType && matchSearch;
    });
  }, [cases, selectedStatusFilter, selectedCaseTypeFilter, searchQuery]);

  // Aggregate Status Distribution
  const statusStats = useMemo(() => {
    const total = cases.length;
    const openCount = cases.filter((c) => c.status === 'Open').length;
    const pendingCount = cases.filter((c) => c.status === 'Pending').length;
    const closedCount = cases.filter((c) => c.status === 'Closed').length;

    return {
      total,
      open: { count: openCount, percentage: total > 0 ? Math.round((openCount / total) * 100) : 0 },
      pending: { count: pendingCount, percentage: total > 0 ? Math.round((pendingCount / total) * 100) : 0 },
      closed: { count: closedCount, percentage: total > 0 ? Math.round((closedCount / total) * 100) : 0 }
    };
  }, [cases]);

  // D3 Chart 1: Case Status Distribution (Donut Chart)
  useEffect(() => {
    if (!donutSvgRef.current) return;

    const svg = d3.select(donutSvgRef.current);
    svg.selectAll('*').remove();

    const width = 280;
    const height = 240;
    const radius = Math.min(width, height) / 2 - 16;
    const innerRadius = radius * 0.62;

    const data: Array<{ status: CaseStatus; label: string; count: number; color: string }> = [
      { status: 'Open', label: 'Açık (Open)', count: statusStats.open.count, color: '#38bdf8' }, // sky-400
      { status: 'Pending', label: 'Beklemede (Pending)', count: statusStats.pending.count, color: '#f59e0b' }, // amber-500
      { status: 'Closed', label: 'Kapalı (Closed)', count: statusStats.closed.count, color: '#10b981' } // emerald-500
    ];

    const g = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    if (statusStats.total === 0) {
      g.append('circle')
        .attr('r', radius)
        .attr('fill', 'none')
        .attr('stroke', '#1e293b')
        .attr('stroke-width', 16)
        .attr('stroke-dasharray', '4 4');
      g.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .attr('fill', '#64748b')
        .attr('font-size', '12px')
        .text('Kayıtlı Dava Yok');
      return;
    }

    const pie = d3
      .pie<{ status: CaseStatus; label: string; count: number; color: string }>()
      .value((d) => d.count)
      .sort(null)
      .padAngle(0.04);

    const arc = d3
      .arc<d3.PieArcDatum<{ status: CaseStatus; label: string; count: number; color: string }>>()
      .innerRadius(innerRadius)
      .outerRadius(radius)
      .cornerRadius(6);

    const hoverArc = d3
      .arc<d3.PieArcDatum<{ status: CaseStatus; label: string; count: number; color: string }>>()
      .innerRadius(innerRadius - 2)
      .outerRadius(radius + 7)
      .cornerRadius(8);

    const arcs = g
      .selectAll('.arc')
      .data(pie(data))
      .enter()
      .append('g')
      .attr('class', 'arc')
      .style('cursor', 'pointer');

    // Slices rendering
    arcs
      .append('path')
      .attr('d', arc)
      .attr('fill', (d) => d.data.color)
      .attr('stroke', '#090d16')
      .attr('stroke-width', 3)
      .style('transition', 'all 0.25s ease-out')
      .on('mouseenter', function (event, d) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('d', hoverArc as any)
          .attr('opacity', 1);

        const total = statusStats.total;
        const percentage = total > 0 ? Math.round((d.data.count / total) * 100) : 0;
        setHoveredSlice({
          status: d.data.label,
          count: d.data.count,
          percentage
        });
      })
      .on('mouseleave', function () {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('d', arc as any)
          .attr('opacity', 0.95);
        setHoveredSlice(null);
      })
      .on('click', (_, d) => {
        setSelectedStatusFilter((prev) => (prev === d.data.status ? 'All' : d.data.status));
      });

    // Center Display (KPI)
    const centerGroup = g.append('g').attr('text-anchor', 'middle');

    centerGroup
      .append('text')
      .attr('dy', '-0.2em')
      .attr('class', 'text-2xl font-black fill-slate-100 font-mono')
      .style('font-size', '24px')
      .style('font-weight', '800')
      .style('fill', '#f1f5f9')
      .text(statusStats.total.toString());

    centerGroup
      .append('text')
      .attr('dy', '1.4em')
      .style('font-size', '10px')
      .style('font-weight', '600')
      .style('fill', '#94a3b8')
      .style('letter-spacing', '0.06em')
      .style('text-transform', 'uppercase')
      .text('Toplam Dava');
  }, [statusStats]);

  // D3 Chart 2: Upcoming Deadlines Timeline / Urgency Bar Chart
  useEffect(() => {
    if (!deadlineSvgRef.current) return;

    const svg = d3.select(deadlineSvgRef.current);
    svg.selectAll('*').remove();

    // Sort cases by upcoming urgency
    const sortedUpcoming = [...cases]
      .filter((c) => c.status !== 'Closed')
      .sort((a, b) => a.urgencyDays - b.urgencyDays)
      .slice(0, 6);

    const margin = { top: 20, right: 30, bottom: 35, left: 160 };
    const width = 480;
    const height = 240;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    if (sortedUpcoming.length === 0) {
      g.append('text')
        .attr('x', innerWidth / 2)
        .attr('y', innerHeight / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', '#64748b')
        .attr('font-size', '12px')
        .text('Takip Edilen Acil Dava Süresi Bulunmuyor');
      return;
    }

    const yScale = d3
      .scaleBand()
      .domain(sortedUpcoming.map((d) => d.caseNumber))
      .range([0, innerHeight])
      .padding(0.28);

    const maxDays = Math.max(30, d3.max(sortedUpcoming, (d) => d.urgencyDays) || 30);
    const xScale = d3.scaleLinear().domain([0, maxDays]).range([0, innerWidth]);

    // Grid lines
    g.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(
        d3
          .axisBottom(xScale)
          .ticks(5)
          .tickSize(-innerHeight)
          .tickFormat(() => '')
      )
      .selectAll('line')
      .style('stroke', '#1e293b')
      .style('stroke-dasharray', '3 3')
      .style('opacity', 0.6);

    // Bars
    g.selectAll('.deadline-bar')
      .data(sortedUpcoming)
      .enter()
      .append('rect')
      .attr('class', 'deadline-bar')
      .attr('y', (d) => yScale(d.caseNumber) || 0)
      .attr('height', yScale.bandwidth())
      .attr('x', 0)
      .attr('width', (d) => Math.max(8, xScale(d.urgencyDays)))
      .attr('rx', 4)
      .attr('fill', (d) => {
        if (d.urgencyDays <= 5) return '#f43f5e'; // rose-500 critical
        if (d.urgencyDays <= 12) return '#f59e0b'; // amber-500 warning
        return '#0284c7'; // sky-600 normal
      })
      .attr('opacity', 0.9)
      .style('cursor', 'pointer')
      .on('mouseenter', function (_, d) {
        d3.select(this).attr('opacity', 1).attr('stroke', '#f8fafc').attr('stroke-width', 1.5);
        setHoveredDeadline(d);
      })
      .on('mouseleave', function () {
        d3.select(this).attr('opacity', 0.9).attr('stroke', 'none');
        setHoveredDeadline(null);
      });

    // Bar Labels: Days Remaining
    g.selectAll('.bar-label')
      .data(sortedUpcoming)
      .enter()
      .append('text')
      .attr('y', (d) => (yScale(d.caseNumber) || 0) + yScale.bandwidth() / 2 + 4)
      .attr('x', (d) => xScale(d.urgencyDays) + 6)
      .style('font-size', '10px')
      .style('font-weight', '700')
      .style('font-family', 'ui-monospace, monospace')
      .style('fill', (d) => (d.urgencyDays <= 5 ? '#fb7185' : d.urgencyDays <= 12 ? '#fbbf24' : '#38bdf8'))
      .text((d) => `${d.urgencyDays} gün`);

    // Y Axis (Case No + Client)
    const yAxis = d3.axisLeft(yScale).tickSize(0);
    g.append('g')
      .call(yAxis)
      .selectAll('text')
      .style('fill', '#cbd5e1')
      .style('font-size', '11px')
      .style('font-weight', '600')
      .style('text-anchor', 'end')
      .attr('dx', '-8px');

    // X Axis
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(5)
      .tickFormat((d) => `${d}g`);
    g.append('g')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(xAxis)
      .selectAll('text')
      .style('fill', '#94a3b8')
      .style('font-size', '10px');
  }, [cases]);

  // D3 Chart 3: Case Type / Field Distribution (Horizontal Bar Chart)
  useEffect(() => {
    if (!courtBarSvgRef.current) return;

    const svg = d3.select(courtBarSvgRef.current);
    svg.selectAll('*').remove();

    const typeCounts: Record<string, number> = {};
    cases.forEach((c) => {
      typeCounts[c.caseType] = (typeCounts[c.caseType] || 0) + 1;
    });

    const data = Object.entries(typeCounts).map(([type, count]) => ({ type, count }));

    const margin = { top: 10, right: 35, bottom: 25, left: 110 };
    const width = 360;
    const height = 180;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    if (data.length === 0) {
      g.append('text')
        .attr('x', innerWidth / 2)
        .attr('y', innerHeight / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', '#64748b')
        .attr('font-size', '12px')
        .text('Dava Türü Dağılımı Bulunmuyor');
      return;
    }

    const yScale = d3
      .scaleBand()
      .domain(data.map((d) => d.type))
      .range([0, innerHeight])
      .padding(0.3);

    const maxCount = d3.max(data, (d) => d.count) || 5;
    const xScale = d3.scaleLinear().domain([0, maxCount]).range([0, innerWidth]);

    g.selectAll('.type-bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'type-bar')
      .attr('y', (d) => yScale(d.type) || 0)
      .attr('height', yScale.bandwidth())
      .attr('x', 0)
      .attr('width', (d) => xScale(d.count))
      .attr('rx', 4)
      .attr('fill', '#6366f1') // indigo-500
      .attr('opacity', 0.85);

    g.selectAll('.type-count')
      .data(data)
      .enter()
      .append('text')
      .attr('y', (d) => (yScale(d.type) || 0) + yScale.bandwidth() / 2 + 4)
      .attr('x', (d) => xScale(d.count) + 6)
      .style('font-size', '10px')
      .style('font-weight', '700')
      .style('fill', '#a5b4fc')
      .text((d) => `${d.count} dosya`);

    g.append('g')
      .call(d3.axisLeft(yScale).tickSize(0))
      .selectAll('text')
      .style('fill', '#94a3b8')
      .style('font-size', '10px');
  }, [cases]);

  // Handle adding a new case
  const handleAddNewCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaseNumber.trim() || !newClientName.trim()) {
      alert('Lütfen esas numarası ve müvekkil adını doldurun.');
      return;
    }

    const currentClients = getClientList();
    let targetClient = currentClients.find(
      (c) => c.fullName.toLowerCase() === newClientName.trim().toLowerCase()
    );

    let clientId = targetClient?.id;
    if (!clientId) {
      const created = addClient({
        fullName: newClientName.trim(),
        type: 'Gerçek Kişi',
        idNumber: ''
      });
      clientId = created.id;
    }

    addCaseToClient(clientId, {
      caseNumber: newCaseNumber.trim(),
      court: newCourt.trim() || 'İstanbul Asliye Hukuk Mahkemesi',
      subject: newSubject.trim() || 'Genel Hukuki Uyuşmazlık',
      opponentName: newOpponentName.trim() || 'Davalı Taraf',
      estimatedValue: 'Belirtilmedi'
    });

    setShowAddModal(false);
    // Reset form
    setNewCaseNumber('');
    setNewCourt('');
    setNewClientName('');
    setNewOpponentName('');
    setNewSubject('');
  };

  return (
    <div className="space-y-6">
      {/* Header & Quick Action Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
                <BarChart3 className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
                  Dava Analitiği & Portföy Paneli
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 font-mono">
                    D3.js Veri Görselleştirme
                  </span>
                </h2>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                  <span className="text-slate-300 font-semibold">{user.fullName}</span>
                  <span aria-hidden="true">·</span>
                  <span>{user.baroAdi} (Sicil: {user.sicilNo})</span>
                  <span aria-hidden="true">·</span>
                  <span>{cases.length} Aktif Portföy Dosyası</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
            {onNavigateToTimeline && (
              <button
                type="button"
                onClick={onNavigateToTimeline}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
              >
                <CalendarDays className="w-3.5 h-3.5 text-sky-400" />
                <span>Adli Takvimi Aç</span>
              </button>
            )}

            {onNavigateToDeepAnalysis && (
              <button
                type="button"
                onClick={onNavigateToDeepAnalysis}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
              >
                <Brain className="w-3.5 h-3.5 text-amber-400" />
                <span>Dava Derin Analiz</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-md shadow-indigo-900/30"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Yeni Dava Ekle</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metric Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Toplam Dava */}
        <div
          onClick={() => setSelectedStatusFilter('All')}
          className={`p-4 rounded-2xl bg-slate-900/80 border transition cursor-pointer ${
            selectedStatusFilter === 'All'
              ? 'border-indigo-500/60 ring-1 ring-indigo-500/30 shadow-md'
              : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>Toplam Dava Portföyü</span>
            <Briefcase className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-100 font-mono">{statusStats.total}</span>
            <span className="text-[11px] text-slate-400">Aktif Takip</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Tüm kategoriler dahil</span>
            <span className="text-indigo-400 font-medium">Tümünü Filtrele</span>
          </div>
        </div>

        {/* KPI 2: Açık Davalar (Open) */}
        <div
          onClick={() => setSelectedStatusFilter('Open')}
          className={`p-4 rounded-2xl bg-slate-900/80 border transition cursor-pointer ${
            selectedStatusFilter === 'Open'
              ? 'border-sky-500/60 ring-1 ring-sky-500/30 shadow-md'
              : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>Açık Davalar (Open)</span>
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-sky-400 font-mono">{statusStats.open.count}</span>
            <span className="text-[11px] text-sky-300 font-mono">%{statusStats.open.percentage}</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Aktif tahkikat & tensip</span>
            <span className="text-sky-400 font-medium">Filtrele</span>
          </div>
        </div>

        {/* KPI 3: Beklemede / Derdest (Pending) */}
        <div
          onClick={() => setSelectedStatusFilter('Pending')}
          className={`p-4 rounded-2xl bg-slate-900/80 border transition cursor-pointer ${
            selectedStatusFilter === 'Pending'
              ? 'border-amber-500/60 ring-1 ring-amber-500/30 shadow-md'
              : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>Beklemede (Pending)</span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-400 font-mono">{statusStats.pending.count}</span>
            <span className="text-[11px] text-amber-300 font-mono">%{statusStats.pending.percentage}</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Bilirkişi & arabuluculuk</span>
            <span className="text-amber-400 font-medium">Filtrele</span>
          </div>
        </div>

        {/* KPI 4: Karara Çıkmış / Kapalı (Closed) */}
        <div
          onClick={() => setSelectedStatusFilter('Closed')}
          className={`p-4 rounded-2xl bg-slate-900/80 border transition cursor-pointer ${
            selectedStatusFilter === 'Closed'
              ? 'border-emerald-500/60 ring-1 ring-emerald-500/30 shadow-md'
              : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>Kapalı (Closed)</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400 font-mono">{statusStats.closed.count}</span>
            <span className="text-[11px] text-emerald-300 font-mono">%{statusStats.closed.percentage}</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Hüküm & kesinleşmiş</span>
            <span className="text-emerald-400 font-medium">Filtrele</span>
          </div>
        </div>
      </div>

      {/* Main D3 Visualizations Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* D3 Donut Chart: Case Statuses Distribution (4 Cols) */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-sky-400" />
                Dava Durum Dağılımı (D3 Donut)
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">D3.js Arc</span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Açık, beklemede ve karara çıkmış dava oranları. Dilimlerin üzerine gelerek detayları görebilir veya filtrelemek için tıklayabilirsiniz.
            </p>

            {/* D3 Donut SVG Container */}
            <div className="relative flex items-center justify-center py-2">
              <svg ref={donutSvgRef} className="w-full max-w-[280px] h-[240px] drop-shadow-md" />
            </div>

            {/* Hover Tooltip / Status Information */}
            <div className="min-h-[40px] p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-xs">
              {hoveredSlice ? (
                <div className="flex items-center justify-center gap-3">
                  <span className="font-semibold text-slate-200">{hoveredSlice.status}</span>
                  <span aria-hidden="true" className="text-slate-600">·</span>
                  <span className="text-indigo-400 font-mono font-bold">{hoveredSlice.count} Dosya</span>
                  <span aria-hidden="true" className="text-slate-600">·</span>
                  <span className="text-emerald-400 font-mono font-bold">%{hoveredSlice.percentage}</span>
                </div>
              ) : (
                <span className="text-slate-500">
                  {selectedStatusFilter === 'All'
                    ? 'Dilimin üzerine gelin veya listeyi daraltmak için tıklayın.'
                    : `Filtrelendi: ${selectedStatusFilter} (Sıfırlamak için tekrar tıklayın)`}
                </span>
              )}
            </div>
          </div>

          {/* Legend Strip */}
          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-800 mt-4 text-xs">
            <button
              type="button"
              onClick={() => setSelectedStatusFilter((prev) => (prev === 'Open' ? 'All' : 'Open'))}
              className={`p-2 rounded-xl text-left border transition ${
                selectedStatusFilter === 'Open'
                  ? 'bg-sky-500/10 border-sky-500/40 text-sky-300'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                <span className="font-semibold text-[11px]">Açık (Open)</span>
              </div>
              <div className="font-mono text-xs text-slate-200">{statusStats.open.count} Dosya</div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedStatusFilter((prev) => (prev === 'Pending' ? 'All' : 'Pending'))}
              className={`p-2 rounded-xl text-left border transition ${
                selectedStatusFilter === 'Pending'
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="font-semibold text-[11px]">Beklemede</span>
              </div>
              <div className="font-mono text-xs text-slate-200">{statusStats.pending.count} Dosya</div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedStatusFilter((prev) => (prev === 'Closed' ? 'All' : 'Closed'))}
              className={`p-2 rounded-xl text-left border transition ${
                selectedStatusFilter === 'Closed'
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="font-semibold text-[11px]">Kapalı (Closed)</span>
              </div>
              <div className="font-mono text-xs text-slate-200">{statusStats.closed.count} Dosya</div>
            </button>
          </div>
        </div>

        {/* D3 Timeline / Upcoming Deadlines Chart (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Clock className="w-4 h-4 text-rose-400" />
                Yaklaşan Kesin Süreler & Duruşmalar (D3 Time Axis)
              </h3>
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-rose-400 font-semibold">🔴 &le; 5 Gün</span>
                <span className="text-amber-400 font-semibold">🟡 &le; 12 Gün</span>
                <span className="text-sky-400 font-semibold">🔵 &gt; 12 Gün</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mb-2">
              Önümüzdeki kritik adli tarihler, HMK m. 281 bilirkişi itirazı ve duruşma günleri sıralaması.
            </p>

            {/* D3 Deadline Horizontal Bar SVG */}
            <div className="relative flex items-center justify-center">
              <svg ref={deadlineSvgRef} className="w-full h-[240px]" />
            </div>

            {/* Hovered Deadline Detail Preview */}
            <div className="mt-2 min-h-[46px] p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
              {hoveredDeadline ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-slate-200">{hoveredDeadline.caseNumber}</span>
                    <span className="text-slate-400 ml-2">({hoveredDeadline.court})</span>
                    <div className="text-[11px] text-amber-300 font-medium">
                      {hoveredDeadline.deadlineType} — {hoveredDeadline.lawArticle}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold font-mono text-rose-400">
                      Son Tarih: {hoveredDeadline.nextDeadlineDate}
                    </span>
                    <div className="text-[10px] text-slate-400">
                      Müvekkil: {hoveredDeadline.clientName}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-slate-500 text-center">
                  Çubukların üzerine gelerek HMK kanun maddesini ve dosya taraflarını inceleyebilirsiniz.
                </div>
              )}
            </div>
          </div>

          {/* D3 Mini Court Distribution Strip */}
          <div className="pt-4 border-t border-slate-800 mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs space-y-1">
              <span className="font-semibold text-slate-300 block">Dava Türü & Uzmanlık Dağılımı:</span>
              <span className="text-[11px] text-slate-400">
                Portföydeki ticari, iş hukuku ve borçlar uyuşmazlıkları yoğunluğu.
              </span>
            </div>
            <div className="w-full sm:w-auto">
              <svg ref={courtBarSvgRef} className="w-full max-w-[360px] h-[110px]" />
            </div>
          </div>
        </div>
      </div>

      {/* Case Management & Interactive Explorer Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        {/* Controls & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-slate-200">
              Müvekkil Dava Dosyaları ({filteredCases.length} Kayıt)
            </h3>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Esas no, müvekkil, mahkeme..."
                className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            {/* Status Filter */}
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="All">Tüm Durumlar</option>
              <option value="Open">Açık (Open)</option>
              <option value="Pending">Beklemede (Pending)</option>
              <option value="Closed">Kapalı (Closed)</option>
            </select>

            {/* Type Filter */}
            <select
              value={selectedCaseTypeFilter}
              onChange={(e) => setSelectedCaseTypeFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="All">Tüm Hukuk Dalları</option>
              <option value="Ticaret">Ticaret Hukuku</option>
              <option value="İş Hukuku">İş Hukuku</option>
              <option value="Medeni/Borçlar">Medeni / Borçlar</option>
              <option value="Kira & Gayrimenkul">Kira & Gayrimenkul</option>
              <option value="İcra & İflas">İcra & İflas</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Dosya / Mahkeme</th>
                <th className="py-3 px-4">Müvekkil & Karşı Taraf</th>
                <th className="py-3 px-4">Dava Konusu & Dal</th>
                <th className="py-3 px-4">Durum</th>
                <th className="py-3 px-4">Sonraki Kritik Süre</th>
                <th className="py-3 px-4 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-slate-900/40">
              {filteredCases.length > 0 ? (
                filteredCases.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition">
                    {/* Dosya / Mahkeme */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-100 font-mono">{item.caseNumber}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Gavel className="w-3 h-3 text-amber-500/70" />
                        <span>{item.court}</span>
                      </div>
                    </td>

                    {/* Müvekkil / Karşı Taraf */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-200">{item.clientName}</div>
                      <div className="text-[11px] text-slate-400">K. Taraf: {item.opponentName}</div>
                    </td>

                    {/* Dava Konusu */}
                    <td className="py-3 px-4 max-w-xs">
                      <div className="truncate text-slate-200" title={item.subject}>
                        {item.subject}
                      </div>
                      <div className="text-[11px] text-indigo-400 font-medium">{item.caseType}</div>
                    </td>

                    {/* Durum */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                          item.status === 'Open'
                            ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                            : item.status === 'Pending'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.status === 'Open'
                              ? 'bg-sky-400'
                              : item.status === 'Pending'
                              ? 'bg-amber-400'
                              : 'bg-emerald-400'
                          }`}
                        />
                        {item.status === 'Open' ? 'Açık' : item.status === 'Pending' ? 'Beklemede' : 'Kapalı'}
                      </span>
                    </td>

                    {/* Sonraki Süre */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div
                          className={`font-mono text-xs font-bold ${
                            item.urgencyDays <= 5
                              ? 'text-rose-400'
                              : item.urgencyDays <= 12
                              ? 'text-amber-400'
                              : 'text-slate-300'
                          }`}
                        >
                          {item.nextDeadlineDate}
                        </div>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                            item.urgencyDays <= 5
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : item.urgencyDays <= 12
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {item.urgencyDays} gün
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[190px]">
                        {item.deadlineType}
                      </div>
                    </td>

                    {/* İşlemler */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {onSelectCaseForPetition && (
                          <button
                            type="button"
                            onClick={() =>
                              onSelectCaseForPetition(
                                `Dosya No: ${item.caseNumber}\nMahkeme: ${item.court}\nMüvekkil: ${item.clientName}\nKonu: ${item.subject}`
                              )
                            }
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 transition"
                            title="Dilekçeye Aktar"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onNavigateToTimeline && (
                          <button
                            type="button"
                            onClick={onNavigateToTimeline}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-sky-300 transition"
                            title="Takvimde Göster"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onNavigateToDeepAnalysis && (
                          <button
                            type="button"
                            onClick={onNavigateToDeepAnalysis}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-indigo-300 transition"
                            title="Dava Derin Analize Gönder"
                          >
                            <Brain className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Arama kriterlerinize uyan dava dosyası bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Case Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-400" />
                Portföye Yeni Dava Dosyası Ekle
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddNewCase} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Esas Numarası *</label>
                  <input
                    type="text"
                    required
                    placeholder="2025/341 Esas"
                    value={newCaseNumber}
                    onChange={(e) => setNewCaseNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Dava Durumu</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as CaseStatus)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Open">Açık (Open)</option>
                    <option value="Pending">Beklemede (Pending)</option>
                    <option value="Closed">Kapalı (Closed)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Görevli Mahkeme</label>
                <input
                  type="text"
                  placeholder="İstanbul 14. Asliye Ticaret Mahkemesi"
                  value={newCourt}
                  onChange={(e) => setNewCourt(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Müvekkil Adı / Ünvanı *</label>
                  <input
                    type="text"
                    required
                    placeholder="Müvekkil Şirket veya Şahıs"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Karşı Taraf</label>
                  <input
                    type="text"
                    placeholder="Davalı / Borçlu"
                    value={newOpponentName}
                    onChange={(e) => setNewOpponentName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Dava Konusu & Özeti</label>
                <input
                  type="text"
                  placeholder="Ticari alacak, kira tahliyesi, haksız fesih..."
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Sonraki Kesin Tarih</label>
                  <input
                    type="date"
                    value={newDeadlineDate}
                    onChange={(e) => setNewDeadlineDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Süre Türü</label>
                  <select
                    value={newDeadlineType}
                    onChange={(e) => setNewDeadlineType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Duruşma / Celse">Duruşma / Celse</option>
                    <option value="Bilirkişi İtirazı (HMK 281)">Bilirkişi İtirazı (HMK 281)</option>
                    <option value="Cevap Dilekçesi (HMK 122)">Cevap Dilekçesi (HMK 122)</option>
                    <option value="İstinaf Başvurusu">İstinaf Başvurusu</option>
                    <option value="Zamanaşımı Kesin Tarih">Zamanaşımı Kesin Tarih</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition shadow-md shadow-indigo-900/30"
                >
                  Dosyayı Kaydet & D3 Grafiğini Güncelle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
