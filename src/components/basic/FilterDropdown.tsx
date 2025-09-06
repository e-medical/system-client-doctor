import { useState, useEffect, useRef } from "react";

// Filter structure suitable for patient management
const filterStructure = [
    {
        label: "Status",
        sub: ["All", "Active", "Inactive"],
    },
    {
        label: "Gender",
        sub: ["All", "Male", "Female", "Other"],
    },
    {
        label: "Age Range",
        sub: ["All", "0-18", "19-30", "31-50", "51-70", "70+"],
    },
    {
        label: "Date Range",
        sub: ["All", "Today", "This Week", "This Month", "This Year"],
    },
];

export interface FilterState {
    status: string;
    gender: string;
    ageRange: string;
    dateRange: string;
}

interface FilterDropdownProps {
    onFilterChange: (filters: FilterState) => void;
    currentFilters: FilterState;
}

export default function FilterDropdown({ onFilterChange, currentFilters }: FilterDropdownProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [selectedMain, setSelectedMain] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
                setSelectedMain(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Handle filter selection
    const handleFilterSelect = (category: string, value: string) => {
        const filterKey = category.toLowerCase().replace(' ', '') as keyof FilterState;

        // Map the category to the correct filter key
        const keyMapping: Record<string, keyof FilterState> = {
            'Status': 'status',
            'Gender': 'gender',
            'Age Range': 'ageRange',
            'Date Range': 'dateRange',
        };

        const actualKey = keyMapping[category] || filterKey;

        const newFilters: FilterState = {
            ...currentFilters,
            [actualKey]: value,
        };

        onFilterChange(newFilters);

        // Close the menu after selection
        setMenuOpen(false);
        setSelectedMain(null);
    };

    // Get active filter count
    const getActiveFilterCount = () => {
        return Object.values(currentFilters).filter(value => value !== 'All').length;
    };

    // Check if a filter option is currently selected
    const isFilterSelected = (category: string, value: string) => {
        const keyMapping: Record<string, keyof FilterState> = {
            'Status': 'status',
            'Gender': 'gender',
            'Age Range': 'ageRange',
            'Date Range': 'dateRange',
        };

        const filterKey = keyMapping[category];
        return currentFilters[filterKey] === value;
    };

    // Clear all filters
    const clearAllFilters = () => {
        const clearedFilters: FilterState = {
            status: 'All',
            gender: 'All',
            ageRange: 'All',
            dateRange: 'All',
        };
        onFilterChange(clearedFilters);
        setMenuOpen(false);
        setSelectedMain(null);
    };

    const activeFilterCount = getActiveFilterCount();

    return (
        <div className="relative inline-block text-left" ref={menuRef}>
            {/* Toggle Button */}
            <button
                onClick={() => {
                    setMenuOpen((prev) => !prev);
                    setSelectedMain(null);
                }}
                className={`flex items-center border px-3.5 py-2.5 rounded-sm text-[14px] transition-colors ${
                    activeFilterCount > 0
                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
                <span className="material-symbols-outlined text-[16px] mr-1">tune</span>
                Filter
                {activeFilterCount > 0 && (
                    <span className="ml-1 bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                        {activeFilterCount}
                    </span>
                )}
                <span className={`material-symbols-outlined text-[16px] ml-1 transition-transform ${
                    menuOpen ? 'rotate-180' : ''
                }`}>
                    keyboard_arrow_down
                </span>
            </button>

            {/* Main Dropdown */}
            {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg z-50">
                    {/* Clear All Filters Option */}
                    {activeFilterCount > 0 && (
                        <>
                            <div
                                onClick={clearAllFilters}
                                className="px-4 py-2 text-sm cursor-pointer hover:bg-red-50 hover:text-red-600 border-b border-gray-100 font-medium"
                            >
                                <span className="material-symbols-outlined text-[16px] mr-2">clear_all</span>
                                Clear All Filters
                            </div>
                        </>
                    )}

                    {filterStructure.map((main) => (
                        <div key={main.label} className="relative">
                            {/* Main item */}
                            <div
                                onClick={() =>
                                    setSelectedMain((prev) => (prev === main.label ? null : main.label))
                                }
                                className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-50 flex items-center justify-between ${
                                    selectedMain === main.label ? 'bg-gray-50' : ''
                                }`}
                            >
                                <span>{main.label}</span>
                                <div className="flex items-center">
                                    {/* Show current selection */}
                                    {(() => {
                                        const keyMapping: Record<string, keyof FilterState> = {
                                            'Status': 'status',
                                            'Gender': 'gender',
                                            'Age Range': 'ageRange',
                                            'Date Range': 'dateRange',
                                        };
                                        const currentValue = currentFilters[keyMapping[main.label]];
                                        return currentValue !== 'All' && (
                                            <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded mr-1">
                                                {currentValue}
                                            </span>
                                        );
                                    })()}
                                    <span className="material-symbols-outlined text-[16px]">
                                        chevron_right
                                    </span>
                                </div>
                            </div>

                            {/* Submenu to the right */}
                            {selectedMain === main.label && (
                                <div className="absolute top-0 left-full ml-1 w-44 bg-white border rounded shadow-lg z-50">
                                    {main.sub.map((sub, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => handleFilterSelect(main.label, sub)}
                                            className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-50 flex items-center justify-between ${
                                                isFilterSelected(main.label, sub)
                                                    ? 'bg-blue-50 text-blue-700 font-medium'
                                                    : ''
                                            }`}
                                        >
                                            <span>{sub}</span>
                                            {isFilterSelected(main.label, sub) && (
                                                <span className="material-symbols-outlined text-[16px] text-blue-600">
                                                    check
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Filter Summary */}
                    {activeFilterCount > 0 && (
                        <div className="border-t border-gray-100 px-4 py-2 bg-gray-50">
                            <div className="text-xs text-gray-600">
                                <span className="font-medium">{activeFilterCount}</span> filter{activeFilterCount !== 1 ? 's' : ''} applied
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}