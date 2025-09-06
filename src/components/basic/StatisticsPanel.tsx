import React, { useState } from 'react';

interface AreaData {
    name: string;
    status: 'Normal' | 'Critical';
    value: number;
    subAreas?: {
        name: string;
        change: number;
    }[];
}

const sampleData: AreaData[] = [
    {
        name: 'Kalutara',
        status: 'Normal',
        value: 215,
    },
    {
        name: 'Colombo',
        status: 'Critical',
        value: 215,
        subAreas: [
            {
                name: 'Nugegoda',
                change: 1.8,
            },
            {
                name: 'Maharagama',
                change: 2.5,
            },
            {
                name: 'Narahenpita',
                change: 1.75,
            },
        ]

    },
];

const StatisticsPanel: React.FC = () => {
    const [expandedArea, setExpandedArea] = useState<string | null>(null);

    const toggleExpand = (areaName: string) => {
        setExpandedArea(prev => (prev === areaName ? null : areaName));
    };

    return (
        <div className="bg-white rounded-[3px]  border-gray-200 p-1 w-full">
            <div className="flex justify-between items-center mt-[-2px] mb-0.5">
                <h2 className="text-[14px] font-bold">Statistics</h2>
                <button className="bg-blue-100 font-bold text-[12px] px-2 py-1 rounded-full">
                    This week
                </button>
            </div>

            <div className="space-y-1">
                {sampleData.map(area => (
                    <div key={area.name} className="bg-gray-100 rounded-[3px] text-[12px] p-1">
                        {/* Top row: Name + Value */}
                        <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleExpand(area.name)}>
                            <div className="font-bold">{area.name}</div>
                            <div className="flex items-center space-x-1">
                                <span className="material-symbols-outlined text-[12px] text-orange-600">trending_up</span>
                                <div className="font-bold text-[12px]">{area.value}</div>
                            </div>
                        </div>

                        {/* Second row: Status + Chevron */}
                        <div className="flex justify-between items-center mt-1 cursor-pointer" onClick={() => toggleExpand(area.name)}>
                            <div
                                className="text-[10px] inline-flex items-center px-1 p-0.5 rounded-full text-white"
                                style={{
                                    backgroundColor: area.status === 'Normal' ? '#3E3C8D' : '#F97316',
                                }}
                            >
                                {area.status}
                            </div>
                            <span
                                className={`material-symbols-outlined text-[16px] transition-transform duration-300 ${
                                    expandedArea === area.name ? 'rotate-180' : ''
                                }`}
                            >
                expand_more
              </span>
                        </div>

                        {/* Subareas */}
                        <div
                            className="overflow-hidden transition-all duration-300 ease-in-out space-y-1"
                            style={{
                                height: expandedArea === area.name && area.subAreas ? `${area.subAreas.length * 32}px` : '0px',
                                marginTop: expandedArea === area.name ? '4px' : '0px',
                            }}
                        >
                            {area.subAreas?.map(sub => (
                                <div
                                    key={sub.name}
                                    className="flex justify-between items-center bg-orange-100 hover:bg-orange-200 p-0.25 rounded-[3px] text-[10px] cursor-pointer"
                                >
                                    {/* Left section: Name + Icon + Change */}
                                    <div className="flex items-center space-x-1">
                                        <span className="text-[12px] font-medium">{sub.name}</span>
                                        <div className="flex items-center text-orange-500 space-x-0.5">
                                            <span className="material-symbols-outlined text-[10px]">trending_up</span>
                                            <span className="font-semibold text-[12px]">{sub.change}%</span>
                                        </div>
                                    </div>

                                    {/* Right section: Chevron */}
                                    <div>
                                        <span className="material-symbols-outlined mt-0.5 text-black text-[12px]">chevron_right</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Empty rows */}
                {[...Array(3)].map((_, idx) => (
                    <div key={idx} className="h-10 bg-gray-100 rounded-[3px]" />
                ))}
            </div>
        </div>
    );
};

export default StatisticsPanel;
