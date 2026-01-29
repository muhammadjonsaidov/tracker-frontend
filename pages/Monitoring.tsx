import React from 'react';
import { ExternalLink } from 'lucide-react';

const PROM_URL = (import.meta as any).env?.VITE_PROMETHEUS_URL || 'http://localhost:9090';
const GRAFANA_URL = (import.meta as any).env?.VITE_GRAFANA_URL || 'http://localhost:3001';

const MonitoringPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Monitoring</h2>
          <p className="text-sm text-gray-500">Prometheus metrics and Grafana dashboards.</p>
        </div>
        <div className="flex gap-3">
          <a
            href={PROM_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Open Prometheus
            <ExternalLink className="h-4 w-4" />
          </a>
          <a
            href={GRAFANA_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Open Grafana
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <a
          href={PROM_URL}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-6 py-5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
        >
          Prometheus UI
          <ExternalLink className="h-4 w-4" />
        </a>
        <a
          href={GRAFANA_URL}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-6 py-5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
        >
          Grafana UI
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
};

export default MonitoringPage;
