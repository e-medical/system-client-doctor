import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import Cookies from "js-cookie";
import DefaultPrescription from "../../../public/assets/Standerd.png";
import { configPrescriptionTheme } from "../../services/hospitalService.ts";

export default function DefaultPrescriptionICardInner() {
    const navigate = useNavigate();
    const tabs = [{ name: "Default", path: "/process/doctor/prescription/standard" }];

    const [hoveredTab, setHoveredTab] = useState<number | null>(null);
    const [appliedIndexes, setAppliedIndexes] = useState<number[]>([]);
    const [loadingIndexes, setLoadingIndexes] = useState<number[]>([]);

    // ✅ Initialize checkbox state based on cookie
    useEffect(() => {
        const themesCookie = Cookies.get("prescriptionThemes");
        if (themesCookie) {
            try {
                const themes = JSON.parse(themesCookie);
                const defaultTheme = themes.find((t: any) => t.theme === "Default");
                if (defaultTheme?.isActive) {
                    setAppliedIndexes([0]); // Only one tab, index is 0
                }
            } catch (err) {
                console.error("❌ Failed to parse prescriptionThemes cookie:", err);
            }
        }
    }, []);

    const handleApplyAll = async (index: number) => {
        try {
            const themesCookie = Cookies.get("prescriptionThemes");
            let currentIsActive = false;

            if (themesCookie) {
                const themes = JSON.parse(themesCookie);
                const defaultTheme = themes.find((t: any) => t.theme === "Default");
                currentIsActive = !!defaultTheme?.isActive;
            }

            const newIsActive = !currentIsActive;

            setLoadingIndexes((prev) => [...prev, index]);

            const res = await configPrescriptionTheme(newIsActive, "Default");

            if (res?.message) {
                setAppliedIndexes((prev) =>
                    newIsActive ? [...prev, index] : prev.filter((i) => i !== index)
                );

                // ✅ Update cookie after toggle
                if (themesCookie) {
                    try {
                        const themes = JSON.parse(themesCookie);
                        const updatedThemes = themes.map((t: any) =>
                            t.theme === "Default" ? { ...t, isActive: newIsActive } : t
                        );
                        Cookies.set("prescriptionThemes", JSON.stringify(updatedThemes), { expires: 7 });
                        console.log("✅ Updated prescriptionThemes cookie:", updatedThemes);
                    } catch (e) {
                        console.error("❌ Failed to update cookie:", e);
                    }
                }

                toast.success(res.message);
            } else {
                toast.error("Unexpected response from server");
                console.error("Unexpected response:", res);
            }
        } catch (error) {
            toast.error("Failed to update prescription theme");
            console.error("API call failed:", error);
        } finally {
            setLoadingIndexes((prev) => prev.filter((i) => i !== index));
        }
    };

    return (
        <div>
            {tabs.map((tab, index) => (
                <div
                    key={index}
                    className="group relative border rounded-xl p-6 text-center bg-white shadow transition duration-300 hover:shadow-xl hover:scale-105 cursor-pointer h-[52vh] w-[20vw]"
                    onMouseEnter={() => setHoveredTab(index)}
                    onMouseLeave={() => setHoveredTab(null)}
                >
                    <label className="absolute top-2 right-2 inline-flex items-center space-x-1 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={appliedIndexes.includes(index)}
                            onChange={() => handleApplyAll(index)}
                            className="accent-green-600 w-4 h-4 cursor-pointer"
                            title="Apply for all doctors"
                            disabled={loadingIndexes.includes(index)}
                        />
                    </label>

                    <p className="font-semibold text-lg mb-2">{tab.name}</p>

                    {appliedIndexes.includes(index) && (
                        <p className="text-green-500 text-sm font-medium mt-2">
                            Applied for all doctors ✔
                        </p>
                    )}

                    <div
                        className={`transition-all duration-300 transform ${
                            hoveredTab === index
                                ? "opacity-100 scale-100"
                                : "opacity-0 scale-95 h-0 overflow-hidden"
                        }`}
                    ></div>

                    <div className="relative h-[40vh] mt-4 rounded-lg overflow-hidden shadow-inner">
                        <img
                            src={DefaultPrescription}
                            alt="Prescription"
                            className="w-full h-[40vh] object-cover filter blur-sm scale-70"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                            <button
                                className="text-white text-sm px-4 py-2 bg-white/10 hover:bg-white/20 rounded-md backdrop-blur-sm transition"
                                onClick={() => navigate(tab.path)}
                            >
                                Edit
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
