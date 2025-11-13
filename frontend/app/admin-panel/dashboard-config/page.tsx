'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Edit, Trash2, BarChart3, Save, X, Eye, Package, Clock, Euro, TrendingUp, Box } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface KPIConfig {
  title: string;
  description: string;
  query: string;
  clientCodeField: string;
  valueType: 'number' | 'currency' | 'percentage';
  format: string;
  icon: string;
  color: 'blue' | 'orange' | 'green' | 'purple' | 'indigo' | 'teal' | 'red' | 'yellow';
  enabled: boolean;
  order: number;
}

interface KPIWithSlug extends KPIConfig {
  slug: string;
}

const iconOptions = [
  { value: 'package', label: 'Package', Icon: Package },
  { value: 'clock', label: 'Clock', Icon: Clock },
  { value: 'euro', label: 'Euro', Icon: Euro },
  { value: 'trending-up', label: 'Trending Up', Icon: TrendingUp },
  { value: 'box', label: 'Box', Icon: Box },
  { value: 'bar-chart', label: 'Bar Chart', Icon: BarChart3 },
];

const colorOptions = [
  { value: 'blue', label: 'Blue', bg: 'bg-blue-100', text: 'text-blue-900', border: 'border-blue-200' },
  { value: 'orange', label: 'Orange', bg: 'bg-orange-100', text: 'text-orange-900', border: 'border-orange-200' },
  { value: 'green', label: 'Green', bg: 'bg-green-100', text: 'text-green-900', border: 'border-green-200' },
  { value: 'purple', label: 'Purple', bg: 'bg-purple-100', text: 'text-purple-900', border: 'border-purple-200' },
  { value: 'indigo', label: 'Indigo', bg: 'bg-indigo-100', text: 'text-indigo-900', border: 'border-indigo-200' },
  { value: 'teal', label: 'Teal', bg: 'bg-teal-100', text: 'text-teal-900', border: 'border-teal-200' },
  { value: 'red', label: 'Red', bg: 'bg-red-100', text: 'text-red-900', border: 'border-red-200' },
  { value: 'yellow', label: 'Yellow', bg: 'bg-yellow-100', text: 'text-yellow-900', border: 'border-yellow-200' },
];

export default function DashboardConfigPage() {
  const [kpis, setKpis] = useState<KPIWithSlug[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingKpi, setEditingKpi] = useState<KPIWithSlug | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<Partial<KPIConfig>>({
    title: '',
    description: '',
    query: '',
    clientCodeField: 'codice_cliente',
    valueType: 'number',
    format: '#,##0',
    icon: 'package',
    color: 'blue',
    enabled: true,
    order: 1,
  });

  useEffect(() => {
    loadKpis();
  }, []);

  const loadKpis = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/dashboard/config');
      if (!response.ok) throw new Error('Failed to load KPIs');

      const data = await response.json();
      const kpiArray = Object.entries(data).map(([slug, config]) => ({
        slug,
        ...(config as KPIConfig),
      }));

      // Sort by order
      kpiArray.sort((a, b) => a.order - b.order);
      setKpis(kpiArray);
    } catch (error) {
      console.error('Error loading KPIs:', error);
      toast.error('Failed to load dashboard configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const slug = editingKpi?.slug || formData.title?.toLowerCase().replace(/\s+/g, '_') || '';

      if (!slug || !formData.title || !formData.query) {
        toast.error('Please fill in all required fields');
        return;
      }

      const response = await fetch('/api/dashboard/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, config: formData }),
      });

      if (!response.ok) throw new Error('Failed to save KPI');

      toast.success('Dashboard KPI saved successfully');
      setEditingKpi(null);
      setIsCreating(false);
      setFormData({
        title: '',
        description: '',
        query: '',
        clientCodeField: 'codice_cliente',
        valueType: 'number',
        format: '#,##0',
        icon: 'package',
        color: 'blue',
        enabled: true,
        order: kpis.length + 1,
      });
      loadKpis();
    } catch (error) {
      console.error('Error saving KPI:', error);
      toast.error('Failed to save dashboard KPI');
    }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm('Are you sure you want to delete this KPI?')) return;

    try {
      const response = await fetch(`/api/dashboard/config?slug=${slug}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete KPI');

      toast.success('Dashboard KPI deleted successfully');
      loadKpis();
    } catch (error) {
      console.error('Error deleting KPI:', error);
      toast.error('Failed to delete dashboard KPI');
    }
  };

  const handleEdit = (kpi: KPIWithSlug) => {
    setEditingKpi(kpi);
    setFormData(kpi);
    setIsCreating(false);
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditingKpi(null);
    setFormData({
      title: '',
      description: '',
      query: '',
      clientCodeField: 'codice_cliente',
      valueType: 'number',
      format: '#,##0',
      icon: 'package',
      color: 'blue',
      enabled: true,
      order: kpis.length + 1,
    });
  };

  const handleCancel = () => {
    setEditingKpi(null);
    setIsCreating(false);
    setFormData({
      title: '',
      description: '',
      query: '',
      clientCodeField: 'codice_cliente',
      valueType: 'number',
      format: '#,##0',
      icon: 'package',
      color: 'blue',
      enabled: true,
      order: kpis.length + 1,
    });
  };

  const handleToggleEnabled = async (slug: string, currentEnabled: boolean) => {
    try {
      const kpi = kpis.find(k => k.slug === slug);
      if (!kpi) return;

      const response = await fetch('/api/dashboard/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          config: { ...kpi, enabled: !currentEnabled },
        }),
      });

      if (!response.ok) throw new Error('Failed to update KPI');

      toast.success(`KPI ${!currentEnabled ? 'enabled' : 'disabled'}`);
      loadKpis();
    } catch (error) {
      console.error('Error toggling KPI:', error);
      toast.error('Failed to update KPI');
    }
  };

  const getColorClasses = (color: string) => {
    const colorObj = colorOptions.find(c => c.value === color);
    return colorObj || colorOptions[0];
  };

  const getIconComponent = (iconValue: string) => {
    const icon = iconOptions.find(i => i.value === iconValue);
    return icon?.Icon || Package;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/admin-panel"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back to Admin</span>
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-blue-600" />
                Dashboard Configuration
              </h1>
            </div>
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add KPI
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI List */}
        {!isCreating && !editingKpi && (
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Loading KPIs...</p>
              </div>
            ) : kpis.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No dashboard KPIs configured yet.</p>
                <button
                  onClick={handleCreate}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create First KPI
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {kpis.map((kpi) => {
                  const colorClasses = getColorClasses(kpi.color);
                  const IconComponent = getIconComponent(kpi.icon);

                  return (
                    <div
                      key={kpi.slug}
                      className={`bg-white rounded-lg border ${colorClasses.border} p-6 ${
                        !kpi.enabled ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${colorClasses.bg}`}>
                            <IconComponent className={`w-5 h-5 ${colorClasses.text}`} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{kpi.title}</h3>
                            <p className="text-sm text-gray-600">{kpi.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleEnabled(kpi.slug, kpi.enabled)}
                            className={`p-2 rounded-lg transition-colors ${
                              kpi.enabled
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                            title={kpi.enabled ? 'Enabled' : 'Disabled'}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(kpi)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(kpi.slug)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-4 p-3 bg-gray-50 rounded text-xs font-mono text-gray-700 overflow-x-auto">
                        {kpi.query.substring(0, 100)}...
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                        <span>Type: {kpi.valueType}</span>
                        <span>Format: {kpi.format}</span>
                        <span>Order: {kpi.order}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Edit/Create Form */}
        {(isCreating || editingKpi) && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingKpi ? 'Edit KPI' : 'Create New KPI'}
              </h2>
              <button
                onClick={handleCancel}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Total Orders"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <input
                  type="text"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Total number of orders placed"
                />
              </div>

              {/* Query */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SQL Query *
                </label>
                <textarea
                  value={formData.query || ''}
                  onChange={(e) => setFormData({ ...formData, query: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  placeholder="SELECT COUNT(*) as value FROM orders WHERE codice_cliente = :client_code"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Use :client_code placeholder for client code filtering. Query must return a column named "value".
                </p>
              </div>

              {/* Client Code Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Code Field *
                </label>
                <input
                  type="text"
                  value={formData.clientCodeField || ''}
                  onChange={(e) => setFormData({ ...formData, clientCodeField: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="codice_cliente"
                />
              </div>

              {/* Value Type and Format */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Value Type *
                  </label>
                  <select
                    value={formData.valueType || 'number'}
                    onChange={(e) => setFormData({ ...formData, valueType: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="number">Number</option>
                    <option value="currency">Currency</option>
                    <option value="percentage">Percentage</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Format *
                  </label>
                  <input
                    type="text"
                    value={formData.format || ''}
                    onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="#,##0.00"
                  />
                </div>
              </div>

              {/* Icon and Color */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Icon *
                  </label>
                  <select
                    value={formData.icon || 'package'}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {iconOptions.map((icon) => (
                      <option key={icon.value} value={icon.value}>
                        {icon.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color *
                  </label>
                  <select
                    value={formData.color || 'blue'}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {colorOptions.map((color) => (
                      <option key={color.value} value={color.value}>
                        {color.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Order and Enabled */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Display Order *
                  </label>
                  <input
                    type="number"
                    value={formData.order || 1}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <label className="flex items-center gap-3 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.enabled || false}
                      onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Enabled</span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Save KPI
                </button>
                <button
                  onClick={handleCancel}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
