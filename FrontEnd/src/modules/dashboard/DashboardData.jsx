import {
    Shield,
    FileText,
    AlertTriangle,
    Users,
    Activity
} from "lucide-react";

export const KPI_DATA = [
    {
        id: 1,
        title: "Active FIRs",
        value: "1,284",
        change: 8.4,
        color: "#2563eb",
        icon: <FileText size={24} />
    },
    {
        id: 2,
        title: "Open Cases",
        value: "932",
        change: 5.2,
        color: "#16a34a",
        icon: <Shield size={24} />
    },
    {
        id: 3,
        title: "Critical Alerts",
        value: "17",
        change: -2.1,
        color: "#dc2626",
        icon: <AlertTriangle size={24} />
    },
    {
        id: 4,
        title: "Officers",
        value: "542",
        change: 1.3,
        color: "#7c3aed",
        icon: <Users size={24} />
    },
    {
        id: 5,
        title: "Incidents Today",
        value: "63",
        change: 12.5,
        color: "#ea580c",
        icon: <Activity size={24} />
    }
];