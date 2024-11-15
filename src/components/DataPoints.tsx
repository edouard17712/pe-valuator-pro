import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { DataPointsTable } from './dataPoints/DataPointsTable.js';
import { DataPointModal } from './dataPoints/DataPointModal.js';
import { DataPoint, DataPointFilters, filterDataPoints, validateDataPoint } from '../types/dataPoint.js';
import { Provider } from '../types/provider.js';
import { fetchApi } from '../utils/api.js';

export function DataPoints() {
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [currentDataPoint, setCurrentDataPoint] = useState<Partial<DataPoint>>({
    provider: '',
    assetClass: 'Buyout',
    quarter: 'Q2 2024',
    minPrice: 0,
    maxPrice: 0
  });
  const [filters, setFilters] = useState<DataPointFilters>({});
  const [providers, setProviders] = useState<Provider[]>([]);
  const [assetClasses, setAssetClasses] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([
      loadDataPoints(),
      loadProviders(),
      loadAssetClasses()
    ]);
  }, []);

  const loadDataPoints = async () => {
    try {
      const data = await fetchApi('/dataPoints');
      setDataPoints(data);
    } catch (error) {
      console.error('Failed to load data points:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data points');
    } finally {
      setLoading(false);
    }
  };

  const loadProviders = async () => {
    try {
      const data = await fetchApi('/providers');
      setProviders(data);
    } catch (error) {
      console.error('Failed to load providers:', error);
      setError(error instanceof Error ? error.message : 'Failed to load providers');
    }
  };

  const loadAssetClasses = async () => {
    try {
      const data = await fetchApi('/settings');
      setAssetClasses(Object.keys(data.assetClasses));
    } catch (error) {
      console.error('Failed to load asset classes:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateDataPoint(currentDataPoint);
    
    if (errors.length > 0) {
      alert(errors.join('\n'));
      return;
    }

    try {
      const payload = {
        ...currentDataPoint,
        providerId: parseInt(currentDataPoint.provider as string),
        minPrice: parseFloat(String(currentDataPoint.minPrice)),
        maxPrice: parseFloat(String(currentDataPoint.maxPrice))
      };

      if (modalMode === 'add') {
        await fetchApi('/dataPoints', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        await fetchApi(`/dataPoints/${currentDataPoint.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(currentDataPoint)
        });
      }

      await loadDataPoints();
      setIsModalOpen(false);
      setCurrentDataPoint({
        provider: '',
        assetClass: 'Buyout',
        quarter: 'Q2 2024',
        minPrice: 0,
        maxPrice: 0
      });
    } catch (error) {
      console.error('Failed to save data point:', error);
      alert('Failed to save data point');
    }
  };

  const handleEdit = (dataPoint: DataPoint) => {
    setCurrentDataPoint(dataPoint);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this data point?')) {
      return;
    }

    try {
      await fetchApi(`/dataPoints/${id}`, {
        method: 'DELETE'
      });
      
      await loadDataPoints();
    } catch (error) {
      console.error('Failed to delete data point:', error);
      alert('Failed to delete data point');
    }
  };

  const handleAdd = () => {
    setCurrentDataPoint({
      provider: '',
      assetClass: 'Buyout',
      quarter: 'Q2 2024',
      minPrice: 0,
      maxPrice: 0
    });
    setModalMode('add');
    setIsModalOpen(true);
  };

  const handleChange = (field: string, value: string | number) => {
    setCurrentDataPoint({ ...currentDataPoint, [field]: value });
  };

  const filteredDataPoints = filterDataPoints(dataPoints, filters);

  return (
    <div className="space-y-6">
      {loading && <div>Loading...</div>}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Data Points</h1>
          <p className="mt-2 text-gray-600">Manage pricing data points</p>
          {error && (
            <p className="text-red-600 mt-2">{error}</p>
          )}
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" />
          Add Data Point
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="assetClassFilter" className="block text-sm font-medium text-gray-700">
            Asset Class
          </label>
          <select
            id="assetClassFilter"
            value={filters.assetClass || ''}
            onChange={(e) => setFilters({ ...filters, assetClass: e.target.value || undefined })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="">All Asset Classes</option>
            <option value="Buyout">Buyout</option>
            <option value="Growth">Growth</option>
            <option value="Venture">Venture</option>
          </select>
        </div>

        <div>
          <label htmlFor="quarterFilter" className="block text-sm font-medium text-gray-700">
            Quarter
          </label>
          <select
            id="quarterFilter"
            value={filters.quarter || ''}
            onChange={(e) => setFilters({ ...filters, quarter: e.target.value || undefined })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="">All Quarters</option>
            <option value="Q1 2024">Q1 2024</option>
            <option value="Q2 2024">Q2 2024</option>
            <option value="Q3 2024">Q3 2024</option>
            <option value="Q4 2024">Q4 2024</option>
          </select>
        </div>

        <div>
          <label htmlFor="providerFilter" className="block text-sm font-medium text-gray-700">
            Provider
          </label>
          <input
            type="text"
            id="providerFilter"
            value={filters.provider || ''}
            onChange={(e) => setFilters({ ...filters, provider: e.target.value || undefined })}
            placeholder="Search providers..."
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
      </div>

      <DataPointsTable
        dataPoints={filteredDataPoints}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <DataPointModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        dataPoint={currentDataPoint}
        onSubmit={handleSubmit}
        onChange={handleChange}
        mode={modalMode}
        providers={providers}
        assetClasses={assetClasses}
      />
    </div>
  );
}