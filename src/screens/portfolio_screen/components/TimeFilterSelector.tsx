import React from 'react';
import PanelSelector from '../../../shared/components/panel_selector/PanelSelector';

export type TimeFilter = '24h' | '7d' | '30d' | 'All Time';

interface TimeFilterSelectorProps {
  selectedFilter: TimeFilter;
  onFilterChange: (filter: TimeFilter) => void;
}

export default function TimeFilterSelector({
  selectedFilter,
  onFilterChange,
}: TimeFilterSelectorProps): React.JSX.Element {
  const options: TimeFilter[] = ['24h', '7d', '30d', 'All Time'];

  return (
    <PanelSelector
      options={options}
      selectedOption={selectedFilter}
      onOptionChange={(option) => onFilterChange(option as TimeFilter)}
    />
  );
}

