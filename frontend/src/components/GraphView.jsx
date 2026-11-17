import React, { useState } from 'react';
import { Network, Search, Info, ShieldAlert, Cpu } from 'lucide-react';

const CATEGORY_COLORS = {
  CVE: { bg: '#F43F5E', border: '#FB7185', text: '#FFE4E6' },
  THREAT_ACTOR: { bg: '#8B5CF6', border: '#A78BFA', text: '#EDE9FE' },
  MALWARE: { bg: '#F59E0B', border: '#FBBF24', text: '#FEF3C7' },
  TOOL: { bg: '#06B6D4', border: '#22D3EE', text: '#CFFAFE' },
  TACTIC: { bg: '#3B82F6', border: '#60A5FA', text: '#DBEAFE' },
  ENTITY: { bg: '#64748B', border: '#94A3B8', text: '#F1F5F9' }
};

export default function GraphView({ graphData }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const nodes = graphData?.nodes || [];
  const edges = graphData?.edges || [];

  const filteredNodes = nodes.filter((n) => {
    const matchCat = filterCategory === 'ALL' || n.category === filterCategory;
    const matchSearch = n.label.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  const categories = ['ALL', ...Array.from(new Set(nodes.map((n) => n.category)))];

  // Simple concentric or circular layout calculation for SVG
  const width = 800;
  const height = 500;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.38;

  const nodePositions = {};
  filteredNodes.forEach((node, i) => {
    const angle = (i / Math.max(filteredNodes.length, 1)) * 2 * Math.PI - Math.PI / 2;
    // Jitter slightly based on category
    const r = radius * (node.category === 'CVE' ? 0.6 : node.category === 'THREAT_ACTOR' ? 0.9 : 0.75);
    nodePositions[node.id] = {
      x: centerX + r * Math.cos(angle),
      y: centerY + r * Math.sin(angle)
    };
  });

  return (
    <div className="bg-ares-card border border-ares-border rounded-xl p-5">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b border-ares-border">
        <div className="flex items-center space-x-2">
          <Network className="w-5 h-5 text-blue-400" />
          <h3 className="font-semibold text-white">Interactive Cybersecurity Knowledge Graph</h3>
          <span className="text-xs font-mono text-ares-muted">
            ({filteredNodes.length} nodes, {edges.length} edges)
          </span>
        </div>

        <div className="flex items-center space-x-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-ares-muted absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search entities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg bg-ares-bg border border-ares-border text-xs text-white focus:outline-none focus:border-blue-500 w-44"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center space-x-1 bg-ares-bg p-1 rounded-lg border border-ares-border">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-2 py-1 rounded text-[11px] font-mono transition-all ${
                  filterCategory === cat
                    ? 'bg-blue-600 text-white font-medium'
                    : 'text-ares-muted hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Canvas Area & Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* SVG Graph View */}
        <div className="lg:col-span-3 bg-[#0B1020] rounded-xl border border-ares-border overflow-hidden relative">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[520px]">
            <defs>
              <marker
                id="arrowhead"
                markerWidth="8"
                markerHeight="6"
                refX="22"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#3B82F6" opacity="0.7" />
              </marker>
            </defs>

            {/* Edges */}
            {edges.map((edge, i) => {
              const src = nodePositions[edge.source];
              const tgt = nodePositions[edge.target];
              if (!src || !tgt) return null;

              const midX = (src.x + tgt.x) / 2;
              const midY = (src.y + tgt.y) / 2;

              return (
                <g key={`edge-${i}`} className="transition-all">
                  <line
                    x1={src.x}
                    y1={src.y}
                    x2={tgt.x}
                    y2={tgt.y}
                    stroke="#1E293B"
                    strokeWidth="1.5"
                    markerEnd="url(#arrowhead)"
                  />
                  <text
                    x={midX}
                    y={midY}
                    fill="#64748B"
                    fontSize="9"
                    fontFamily="JetBrains Mono"
                    textAnchor="middle"
                    className="select-none"
                  >
                    {edge.label}
                  </text>
                </g>
              );
            })}

            {/* Nodes */}
            {filteredNodes.map((node) => {
              const pos = nodePositions[node.id];
              if (!pos) return null;

              const style = CATEGORY_COLORS[node.category] || CATEGORY_COLORS.ENTITY;
              const isSelected = selectedNode?.id === node.id;

              return (
                <g
                  key={node.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  onClick={() => setSelectedNode(node)}
                  className="cursor-pointer transition-transform hover:scale-110"
                >
                  <circle
                    r={isSelected ? 18 : 14}
                    fill={style.bg}
                    stroke={isSelected ? '#FFFFFF' : style.border}
                    strokeWidth={isSelected ? 3 : 1.5}
                    className="drop-shadow-md"
                  />
                  <text
                    y={24}
                    fill="#F8FAFC"
                    fontSize="10"
                    fontWeight="500"
                    textAnchor="middle"
                    className="select-none pointer-events-none drop-shadow"
                  >
                    {node.label}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Graph Legend */}
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-2 bg-ares-card/90 backdrop-blur p-2 rounded-lg border border-ares-border text-[10px] font-mono">
            {Object.entries(CATEGORY_COLORS).map(([cat, colors]) => (
              <div key={cat} className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors.bg }} />
                <span className="text-ares-muted">{cat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Node Inspector Sidebar */}
        <div className="bg-[#0B1020] rounded-xl border border-ares-border p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono text-ares-muted mb-3 uppercase tracking-wider">
              <Info className="w-4 h-4 text-blue-400" />
              <span>Entity Inspector</span>
            </div>

            {selectedNode ? (
              <div className="space-y-4">
                <div className="p-3 rounded-lg border border-ares-border bg-ares-card">
                  <span
                    className="text-[10px] font-mono px-2 py-0.5 rounded font-semibold"
                    style={{
                      backgroundColor: `${CATEGORY_COLORS[selectedNode.category]?.bg}20`,
                      color: CATEGORY_COLORS[selectedNode.category]?.border
                    }}
                  >
                    {selectedNode.category}
                  </span>
                  <h4 className="text-base font-bold text-white mt-2 break-words">
                    {selectedNode.label}
                  </h4>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-ares-border">
                    <span className="text-ares-muted">Degree Centrality:</span>
                    <span className="font-mono text-white">{selectedNode.degree ?? 1}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-ares-border">
                    <span className="text-ares-muted">PageRank Score:</span>
                    <span className="font-mono text-white">{selectedNode.pagerank ?? '0.15'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-ares-border">
                    <span className="text-ares-muted">Confidence:</span>
                    <span className="font-mono text-emerald-400">
                      {Math.round((selectedNode.confidence ?? 0.9) * 100)}%
                    </span>
                  </div>
                </div>

                {selectedNode.metadata && Object.keys(selectedNode.metadata).length > 0 && (
                  <div>
                    <div className="text-[11px] font-mono text-ares-muted mb-1">Metadata Attributes:</div>
                    <pre className="text-[11px] bg-ares-card border border-ares-border rounded p-2 text-blue-300 font-mono overflow-x-auto">
                      {JSON.stringify(selectedNode.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-16 text-ares-muted text-xs">
                <p>Click on any node in the graph to inspect entity attributes, centrality metrics, and relationships.</p>
              </div>
            )}
          </div>

          <div className="text-[11px] font-mono text-ares-muted border-t border-ares-border pt-3">
            Engine: NetworkX MultiDiGraph
          </div>
        </div>
      </div>
    </div>
  );
}
