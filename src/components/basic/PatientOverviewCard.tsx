import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
} from "recharts";
import { useState, useEffect } from "react";

// Sample patient data - in real app, this would come from props
const samplePatients = [
    { name: "John Smith", age: "5", date: "2025-07-01" },
    { name: "Emma Davis", age: "8", date: "2025-07-02" },
    { name: "Michael Johnson", age: "12", date: "2025-06-30" },
    { name: "Sarah Wilson", age: "16", date: "2025-07-01" },
    { name: "Alex Brown", age: "19", date: "2025-07-02" },
    { name: "Jessica Lee", age: "25", date: "2025-06-29" },
    { name: "David Miller", age: "35", date: "2025-07-01" },
    { name: "Lisa Garcia", age: "42", date: "2025-07-02" },
    { name: "Robert Taylor", age: "28", date: "2025-06-30" },
    { name: "Maria Rodriguez", age: "67", date: "2025-07-01" },
    { name: "James Anderson", age: "72", date: "2025-07-02" },
    { name: "Helen White", age: "78", date: "2025-06-29" },
    { name: "Tom Jackson", age: "45", date: "2025-07-01" },
    { name: "Anna Martinez", age: "31", date: "2025-07-02" },
    { name: "Peter Davis", age: "14", date: "2025-06-30" },
];

interface Patient {
    name: string;
    age: string;
    date: string;
}

interface PatientOverviewCardProps {
    patients?: Patient[];
    weekOffset?: number;
}

const PatientOverviewCard: React.FC<PatientOverviewCardProps> = ({
                                                                     patients = samplePatients,
                                                                     weekOffset = 0
                                                                 }) => {
    const [chartData, setChartData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Simulate loading and prepare data
        const timer = setTimeout(() => {
            // Age group classification function
            const getAgeGroup = (age: string | number): string => {
                const numAge = typeof age === 'string' ? parseInt(age) : age;

                if (numAge >= 0 && numAge <= 12) return 'Child';
                if (numAge >= 13 && numAge <= 19) return 'Teen';
                if (numAge >= 20 && numAge <= 64) return 'Adult';
                if (numAge >= 65) return 'Elderly';

                return 'Unknown';
            };

            // For demo purposes, let's use all patients as "this week"
            const thisWeekPatients = patients;

            // Group patients by age category
            const groups = { Child: 0, Teen: 0, Adult: 0, Elderly: 0 };

            thisWeekPatients.forEach(patient => {
                const ageGroup = getAgeGroup(patient.age);
                if (ageGroup in groups) {
                    groups[ageGroup as keyof typeof groups]++;
                }
            });

            // Prepare chart data with proper structure
            const data = [
                {
                    name: "Child (0-12)",
                    value: groups.Child,
                    fill: "#7bdcb5",
                    percentage: thisWeekPatients.length ? ((groups.Child / thisWeekPatients.length) * 100).toFixed(1) : "0"
                },
                {
                    name: "Teen (13-19)",
                    value: groups.Teen,
                    fill: "#ff9800",
                    percentage: thisWeekPatients.length ? ((groups.Teen / thisWeekPatients.length) * 100).toFixed(1) : "0"
                },
                {
                    name: "Adult (20-64)",
                    value: groups.Adult,
                    fill: "#3f51b5",
                    percentage: thisWeekPatients.length ? ((groups.Adult / thisWeekPatients.length) * 100).toFixed(1) : "0"
                },
                {
                    name: "Elderly (65+)",
                    value: groups.Elderly,
                    fill: "#00bcd4",
                    percentage: thisWeekPatients.length ? ((groups.Elderly / thisWeekPatients.length) * 100).toFixed(1) : "0"
                },
            ].filter(item => item.value > 0); // Only include non-zero values

            setChartData(data);
            setIsLoading(false);
        }, 100);

        return () => clearTimeout(timer);
    }, [patients, weekOffset]);

    const total = patients.length;

    // Custom tooltip
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white p-2 border border-gray-200 rounded shadow-lg text-xs">
                    <p className="font-medium">{data.name}</p>
                    <p className="text-blue-600">Count: {data.value}</p>
                    <p className="text-gray-600">Percentage: {data.percentage}%</p>
                </div>
            );
        }
        return null;
    };

    if (isLoading) {
        return (
            <div className="relative p-4 w-full">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Patient Overview</h2>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        This Week
                    </span>
                </div>
                <div className="w-full h-64 flex items-center justify-center">
                    <div className="text-gray-500">Loading chart...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative p-4 w-full">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Patient Overview</h2>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {weekOffset === 0 ? 'This Week' : `${Math.abs(weekOffset)} week${Math.abs(weekOffset) > 1 ? 's' : ''} ago`}
                </span>
            </div>

            <div className="relative w-full h-64">
                {/* Center Overlay Text */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center z-10 bg-white rounded-full p-4">
                    <div className="text-2xl font-bold text-gray-900">{total}</div>
                    <div className="text-xs text-gray-500 mb-1">Total Patients</div>
                    <div className="flex items-center justify-center gap-1">
                        <span className="text-xs font-medium text-green-600">+12.5%</span>
                        <span className="text-xs text-green-600">↗</span>
                    </div>
                    <div className="text-xs text-gray-400">vs last week</div>
                </div>

                {/* Pie Chart */}
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={100}
                                paddingAngle={2}
                                dataKey="value"
                                startAngle={90}
                                endAngle={450}
                            >
                                {chartData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.fill}
                                        stroke="#fff"
                                        strokeWidth={2}
                                    />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="text-gray-500">No data available</div>
                    </div>
                )}
            </div>

            {/* Enhanced Legend */}
            <div className="mt-4 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                    {chartData.map((item, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs">
                            <div
                                className="w-3 h-3 rounded-sm border border-gray-300"
                                style={{
                                    backgroundColor: item.fill
                                }}
                            ></div>
                            <div className="flex-1">
                                <div className="font-medium text-gray-700">
                                    {item.name.split(' ')[0]}
                                </div>
                                <div className="text-gray-500">
                                    {item.value} ({item.percentage}%)
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {chartData.length === 0 && (
                    <div className="text-center text-gray-500 text-sm py-4">
                        No patient data available for this period
                    </div>
                )}
            </div>

            {/* Age Distribution Summary */}
            <div className="mt-4 pt-3 border-t border-gray-100">
                <div className="text-xs text-gray-600 mb-2">Age Distribution Summary:</div>
                <div className="grid grid-cols-4 gap-1 text-xs">
                    {chartData.map((item) => {
                        const group = item.name.split(' ')[0];
                        return (
                            <div key={group} className="text-center">
                                <div className="font-medium text-gray-700">{group}</div>
                                <div className="text-gray-600">{item.value}</div>
                                <div className="text-xs text-green-600">+2</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default PatientOverviewCard;
