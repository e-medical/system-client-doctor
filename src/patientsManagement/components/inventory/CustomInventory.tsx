"use client"

import { useState, useEffect } from "react"
import { Trash2, GripVertical } from "lucide-react"
import type { DrugItem } from "../../types/prescription"
import { MOCK_INVENTORY } from "../../utils/mockData"

export default function CustomInventory() {
    const [items, setItems] = useState<DrugItem[]>([])
    const [search, setSearch] = useState("")
    const [inventoryData, setInventoryData] = useState<DrugItem[]>([])

    useEffect(() => {
        setInventoryData(MOCK_INVENTORY)
        setItems(MOCK_INVENTORY)
    }, [])

    const handleChange = (id: string, field: keyof DrugItem, value: string) => {
        setItems((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
    }

    const handleDelete = (id: string) => {
        setItems((prev) => prev.filter((item) => item.id !== id))
    }

    const handleAdd = () => {
        setItems((prev) => [...prev, { id: crypto.randomUUID(), brand: "", drug: "", strength: "", dosage: "" }])
    }

    const handleAddFromSearch = (drug: DrugItem) => {
        setItems((prev) => [...prev, { ...drug, id: crypto.randomUUID() }])
    }

    const filteredInventory = inventoryData.filter(
        (item) =>
            item.brand.toLowerCase().includes(search.toLowerCase()) || item.drug.toLowerCase().includes(search.toLowerCase()),
    )

    return (
        <div className="bg-white border rounded-lg p-4 h-full flex flex-col">
            <h3 className="font-semibold text-base mb-3 text-gray-800">Custom Inventory</h3>

            {/* Search Input */}
            <div className="relative mb-4">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search Brand or Drug"
                    className="w-full border border-gray-300 px-3 py-2 pl-10 rounded-md text-sm"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
                </div>
            </div>

            {/* Search Results */}
            {search && (
                <div className="mb-4">
                    <h4 className="text-xs font-semibold text-gray-500 mb-1">Search Results</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                        {filteredInventory.map((drug) => (
                            <button
                                key={drug.id}
                                onClick={() => handleAddFromSearch(drug)}
                                className="w-full text-left text-sm p-2 bg-gray-100 hover:bg-gray-200 rounded"
                            >
                                {drug.brand} - {drug.drug} ({drug.strength})
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Inventory Items */}
            <div className="space-y-3 flex-grow overflow-y-auto pr-2">
                {items.map((item) => (
                    <div
                        key={item.id}
                        draggable="true"
                        onDragStart={(e) => e.dataTransfer.setData("application/json", JSON.stringify(item))}
                        className="flex items-center gap-2 border border-gray-200 px-2 py-1 rounded-md bg-gray-50 cursor-grab"
                    >
                        <GripVertical className="text-gray-600" size={18} />
                        <input
                            value={item.brand}
                            onChange={(e) => handleChange(item.id, "brand", e.target.value)}
                            className="w-[80px] text-xs border text-gray-600 px-2 py-1 rounded"
                            placeholder="Brand"
                        />
                        <input
                            value={item.drug}
                            onChange={(e) => handleChange(item.id, "drug", e.target.value)}
                            className="w-[80px] text-xs border px-2 text-gray-600 py-1 rounded"
                            placeholder="Drug"
                        />
                        <input
                            value={item.strength}
                            onChange={(e) => handleChange(item.id, "strength", e.target.value)}
                            className="w-[60px] text-xs border px-2 text-gray-600 py-1 rounded"
                            placeholder="Strength"
                        />
                        <input
                            value={item.dosage}
                            onChange={(e) => handleChange(item.id, "dosage", e.target.value)}
                            className="w-[40px] text-xs border px-2 text-gray-600 py-1 rounded"
                            placeholder="T"
                        />
                        <button onClick={() => handleDelete(item.id)} className="ml-auto text-gray-500 hover:text-red-700">
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>

            {/* Add Button */}
            <button
                onClick={handleAdd}
                className="mt-4 text-gray-500 text-sm border border-dashed rounded px-3 py-2 hover:bg-gray-100"
            >
                + Add More Drugs
            </button>
        </div>
    )
}
