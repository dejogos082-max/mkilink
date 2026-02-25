import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import { ref, onValue, query, orderByChild, equalTo, get } from "firebase/database";
import { motion } from "motion/react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  Legend
} from "recharts";
import { MousePointerClick, Link as LinkIcon, TrendingUp, Calendar, Filter, Download } from "lucide-react";
import { Button } from "../components/Button";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface LinkData {
  id: string;
  originalUrl: string;
  shortCode: string;
  userId: string;
  createdAt: number;
  clicks: number;
}

interface ClickEvent {
    timestamp: number;
    userAgent?: string;
    referrer?: string;
}

interface LinkStats {
    [shortCode: string]: ClickEvent[];
}

export default function Stats() {
  const { currentUser } = useAuth();
  const [links, setLinks] = useState<LinkData[]>([]);
  const [linkStats, setLinkStats] = useState<LinkStats>({});
  const [loading, setLoading] = useState(true);
  
  // Date Filter State
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30); // Default last 30 days
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  useEffect(() => {
    if (!currentUser) return;

    const linksRef = query(
      ref(db, "short_links"),
      orderByChild("userId"),
      equalTo(currentUser.uid)
    );

    const unsubscribe = onValue(linksRef, async (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const linkList = Object.entries(data).map(([key, value]: [string, any]) => ({
          id: key,
          ...value,
        }));
        setLinks(linkList);
        
        // Fetch click stats for these links
        const stats: LinkStats = {};
        const promises = linkList.map(async (link) => {
            const statsRef = ref(db, `click_stats/${link.shortCode}`);
            try {
                const snap = await get(statsRef);
                if (snap.exists()) {
                    stats[link.shortCode] = Object.values(snap.val());
                } else {
                    stats[link.shortCode] = [];
                }
            } catch (e) {
                console.error("Error fetching stats for", link.shortCode, e);
                stats[link.shortCode] = [];
            }
        });
        
        await Promise.all(promises);
        setLinkStats(stats);

      } else {
        setLinks([]);
        setLinkStats({});
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Filter Data based on Date Range
  const startTs = new Date(startDate).getTime();
  const endTs = new Date(endDate).getTime() + (24 * 60 * 60 * 1000) - 1; // End of the day

  const filteredStats = React.useMemo(() => {
    const filtered: LinkStats = {};
    links.forEach(link => {
        const events = linkStats[link.shortCode] || [];
        filtered[link.shortCode] = events.filter(e => e.timestamp >= startTs && e.timestamp <= endTs);
    });
    return filtered;
  }, [links, linkStats, startTs, endTs]);

  // Calculate Aggregates
  const totalAllTimeClicks = links.reduce((acc, link) => acc + link.clicks, 0);
  const totalClicksInPeriod = (Object.values(filteredStats) as ClickEvent[][]).reduce((acc, events) => acc + events.length, 0);
  const totalLinks = links.length; 
  
  // Top Links Data (based on filtered clicks)
  const topLinksData = links.map(link => ({
    name: `/${link.shortCode}`,
    clicks: filteredStats[link.shortCode]?.length || 0,
    fullUrl: link.originalUrl,
    totalClicks: link.clicks
  }))
  .sort((a, b) => b.clicks - a.clicks)
  .slice(0, 10);

  // Clicks Over Time Data
  const clicksOverTimeData = React.useMemo(() => {
    const dailyCounts: {[date: string]: number} = {};
    
    // Initialize days in range with 0
    let current = new Date(startTs);
    const end = new Date(endTs);
    while (current <= end) {
        dailyCounts[current.toLocaleDateString()] = 0;
        current.setDate(current.getDate() + 1);
    }

    (Object.values(filteredStats) as ClickEvent[][]).flat().forEach(e => {
        const date = new Date(e.timestamp).toLocaleDateString();
        if (dailyCounts[date] !== undefined) {
            dailyCounts[date]++;
        }
    });

    return Object.entries(dailyCounts).map(([date, count]) => ({
        date,
        clicks: count
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredStats, startTs, endTs]);

  // Export Functions
  const exportCSV = () => {
    const headers = ["Data", "Cliques no Periodo", "Total Geral"];
    const rows = links.map(link => [
        new Date(link.createdAt).toLocaleDateString(),
        filteredStats[link.shortCode]?.length || 0,
        link.clicks
    ]);
    
    // Add Clicks Over Time Data
    const dailyRows = clicksOverTimeData.map(d => [d.date, d.clicks, "-"]);

    const csvContent = "data:text/csv;charset=utf-8," 
        + "RELATORIO DE LINKS\n"
        + "Link Curto,URL Original,Data Criacao,Cliques (Periodo),Total Geral\n"
        + links.map(l => `${l.shortCode},${l.originalUrl},${new Date(l.createdAt).toLocaleDateString()},${filteredStats[l.shortCode]?.length || 0},${l.clicks}`).join("\n")
        + "\n\nRELATORIO DIARIO\n"
        + "Data,Cliques\n"
        + clicksOverTimeData.map(d => `${d.date},${d.clicks}`).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relatorio_clicks_${startDate}_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text("Relatório de Desempenho - MKI Links PRO", 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Período: ${new Date(startDate).toLocaleDateString()} a ${new Date(endDate).toLocaleDateString()}`, 14, 30);
    
    // Summary
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("Resumo:", 14, 40);
    doc.setFontSize(10);
    doc.text(`Total de Cliques (Geral): ${totalAllTimeClicks}`, 14, 46);
    doc.text(`Cliques no Período: ${totalClicksInPeriod}`, 14, 52);
    doc.text(`Total de Links: ${totalLinks}`, 14, 58);

    // Daily Clicks Table
    doc.setFontSize(12);
    doc.text("Cliques por Dia:", 14, 70);
    
    autoTable(doc, {
        startY: 75,
        head: [['Data', 'Cliques']],
        body: clicksOverTimeData.map(d => [d.date, d.clicks]),
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] }, // Indigo 600
    });

    // Links Table
    const finalY = (doc as any).lastAutoTable.finalY || 75;
    doc.text("Desempenho Detalhado dos Links:", 14, finalY + 15);

    autoTable(doc, {
        startY: finalY + 20,
        head: [['Link Curto', 'URL Original', 'Criado em', 'Cliques (Período)', 'Total Geral']],
        body: links.map(l => [
            `/${l.shortCode}`,
            l.originalUrl,
            new Date(l.createdAt).toLocaleDateString(),
            filteredStats[l.shortCode]?.length || 0,
            l.clicks
        ]),
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] }, // Blue 500
        columnStyles: {
            1: { cellWidth: 60 } // Limit URL column width
        }
    });

    doc.save(`relatorio_mki_${startDate}_${endDate}.pdf`);
  };

  // Custom Tooltip for Top Links
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 max-w-xs">
          <p className="font-bold text-gray-900">{label}</p>
          <p className="text-xs text-gray-500 break-all mb-2">{payload[0].payload.fullUrl}</p>
          <p className="text-indigo-600 font-medium">
            {payload[0].value} Cliques
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
            <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"
            >
            Estatísticas
            </motion.h1>
            <p className="text-gray-500">
            Acompanhe o desempenho dos seus links.
            </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 items-center">
            <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 px-2">
                    <Filter className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">Filtrar:</span>
                </div>
                <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="text-sm border-gray-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                />
                <span className="text-gray-400 self-center">-</span>
                <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="text-sm border-gray-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                />
            </div>
            
            <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportCSV} className="h-full">
                    <Download className="mr-2 h-4 w-4" />
                    CSV
                </Button>
                <Button variant="outline" size="sm" onClick={exportPDF} className="h-full">
                    <Download className="mr-2 h-4 w-4" />
                    PDF
                </Button>
            </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 sm:grid-cols-3">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-2xl shadow-sm ring-1 ring-gray-900/5"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <MousePointerClick className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total de Cliques (Geral)</p>
              <h3 className="text-2xl font-bold text-gray-900">{totalAllTimeClicks}</h3>
              {startDate && (
                  <p className="text-xs text-gray-400 mt-1">
                      {totalClicksInPeriod} neste período
                  </p>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-2xl shadow-sm ring-1 ring-gray-900/5"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <LinkIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total de Links</p>
              <h3 className="text-2xl font-bold text-gray-900">{totalLinks}</h3>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-2xl shadow-sm ring-1 ring-gray-900/5"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-xl">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Média (Cliques/Link)</p>
              <h3 className="text-2xl font-bold text-gray-900">
                {totalLinks > 0 ? (totalAllTimeClicks / totalLinks).toFixed(1) : "0"}
              </h3>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Clicks Over Time Line Chart */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-white p-6 rounded-2xl shadow-sm ring-1 ring-gray-900/5"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-6">Cliques por Dia</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={clicksOverTimeData}>
                <defs>
                  <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" minTickGap={30} />
                <YAxis />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="clicks" stroke="#4f46e5" fillOpacity={1} fill="url(#colorClicks)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Top Links Bar Chart */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white p-6 rounded-2xl shadow-sm ring-1 ring-gray-900/5"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-6">Top 10 Links (No Período)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topLinksData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f3f4f6' }} />
                <Bar dataKey="clicks" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Detailed List */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-900/5 overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Desempenho Detalhado</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs uppercase font-medium text-gray-500">
              <tr>
                <th className="px-6 py-4">Link Curto</th>
                <th className="px-6 py-4">URL Original</th>
                <th className="px-6 py-4">Data de Criação</th>
                <th className="px-6 py-4 text-right">Cliques (Período)</th>
                <th className="px-6 py-4 text-right">Total Geral</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {links.map((link) => (
                <tr key={link.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-indigo-600">
                    /{link.shortCode}
                  </td>
                  <td className="px-6 py-4 max-w-xs truncate" title={link.originalUrl}>
                    {link.originalUrl}
                  </td>
                  <td className="px-6 py-4">
                    {new Date(link.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-gray-900">
                    {filteredStats[link.shortCode]?.length || 0}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-500">
                    {link.clicks}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
