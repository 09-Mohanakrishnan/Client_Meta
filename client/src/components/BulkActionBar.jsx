import React, { useState } from 'react';
import { Trash2, Copy, ToggleLeft, DollarSign, X, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const BulkActionBar = ({
  selectedCount,
  onClearSelection,
  onBulkDelete,
  onBulkDuplicate,
  onBulkStatusChange,
  onBulkBudgetChange,
}) => {
  const { user } = useAuth();
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showBudgetInput, setShowBudgetInput] = useState(false);
  const [budgetVal, setBudgetVal] = useState('');

  const canEdit = user && user.role !== 'VIEWER';
  const canDelete = user && ['SUPER_ADMIN', 'ADMIN'].includes(user.role);

  if (selectedCount === 0) return null;

  const handleBudgetSubmit = (e) => {
    e.preventDefault();
    if (!budgetVal || isNaN(parseFloat(budgetVal))) return;
    onBulkBudgetChange(parseFloat(budgetVal));
    setBudgetVal('');
    setShowBudgetInput(false);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border border-blue-200 bg-blue-50/50 rounded-lg p-3 px-4 shadow-sm animate-fade-in">
      {/* Selected details */}
      <div className="flex items-center gap-3">
        <button
          onClick={onClearSelection}
          className="rounded p-1 text-blue-500 hover:bg-blue-100 transition-colors"
          title="Clear Selection"
        >
          <X size={16} />
        </button>
        <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
          {selectedCount} Selected
        </span>
      </div>

      {/* Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {canEdit && (
          <>
            {/* Status change bulk */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowStatusDropdown(!showStatusDropdown);
                  setShowBudgetInput(false);
                }}
                className="flex items-center gap-1.5 rounded border border-blue-200 bg-white hover:bg-blue-100/50 text-blue-700 px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors"
              >
                <ToggleLeft size={14} />
                <span>Change Status</span>
              </button>
              {showStatusDropdown && (
                <div className="absolute left-0 mt-1 z-25 w-36 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                  {['Active', 'Off', 'Paused'].map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        onBulkStatusChange(s);
                        setShowStatusDropdown(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 font-medium text-gray-700 hover:text-blue-700"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Budget update bulk */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowBudgetInput(!showBudgetInput);
                  setShowStatusDropdown(false);
                }}
                className="flex items-center gap-1.5 rounded border border-blue-200 bg-white hover:bg-blue-100/50 text-blue-700 px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors"
              >
                <DollarSign size={14} />
                <span>Update Budget</span>
              </button>
              {showBudgetInput && (
                <form
                  onSubmit={handleBudgetSubmit}
                  className="absolute left-0 mt-1 z-25 flex items-center gap-1.5 border border-gray-200 bg-white p-2 rounded-md shadow-lg min-w-[180px]"
                >
                  <input
                    type="number"
                    value={budgetVal}
                    onChange={(e) => setBudgetVal(e.target.value)}
                    placeholder="New budget amount..."
                    className="rounded border border-gray-300 px-2 py-1 text-xs w-28 focus:border-blue-500 focus:outline-none"
                    required
                    min="0"
                  />
                  <button
                    type="submit"
                    className="rounded bg-blue-600 hover:bg-blue-700 text-white p-1"
                  >
                    <Check size={12} />
                  </button>
                </form>
              )}
            </div>

            {/* Duplicate bulk */}
            <button
              onClick={onBulkDuplicate}
              className="flex items-center gap-1.5 rounded border border-blue-200 bg-white hover:bg-blue-100/50 text-blue-700 px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors"
            >
              <Copy size={14} />
              <span>Duplicate</span>
            </button>
          </>
        )}

        {/* Delete bulk */}
        {canDelete && (
          <button
            onClick={onBulkDelete}
            className="flex items-center gap-1.5 rounded bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors"
          >
            <Trash2 size={14} />
            <span>Delete Selected</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default BulkActionBar;
