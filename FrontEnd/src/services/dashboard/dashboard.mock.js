import {
    Shield,
    FileText,
    AlertTriangle,
    Users,
    Activity
} from "lucide-react";

export const dashboardMock = {

    kpis: [

        {
            id: 1,
            title: "Active FIRs",
            value: "1284",
            change: 8.4,
            color: "#2563eb",
            icon: FileText
        },

        {
            id: 2,
            title: "Open Cases",
            value: "932",
            change: 5.2,
            color: "#16a34a",
            icon: Shield
        },

        {
            id: 3,
            title: "Critical Alerts",
            value: "17",
            change: -2.1,
            color: "#dc2626",
            icon: AlertTriangle
        },

        {
            id: 4,
            title: "Officers",
            value: "542",
            change: 1.3,
            color: "#7c3aed",
            icon: Users
        },

        {
            id: 5,
            title: "Incidents Today",
            value: "63",
            change: 12.5,
            color: "#ea580c",
            icon: Activity
        }

    ],

    crimeTrend: [

        { day: "Mon", crimes: 38 },
        { day: "Tue", crimes: 52 },
        { day: "Wed", crimes: 41 },
        { day: "Thu", crimes: 67 },
        { day: "Fri", crimes: 59 },
        { day: "Sat", crimes: 84 },
        { day: "Sun", crimes: 61 }

    ],

    districts: [

        {
            id: 1,
            name: "Bengaluru",
            risk: "High"
        },

        {
            id: 2,
            name: "Mysuru",
            risk: "Medium"
        },

        {
            id: 3,
            name: "Hubballi",
            risk: "Medium"
        },

        {
            id: 4,
            name: "Belagavi",
            risk: "Low"
        }

    ],

    alerts: [

        {
            id: 1,
            level: "danger",
            title: "High Crime Cluster",
            location: "Bengaluru South"
        },

        {
            id: 2,
            level: "warning",
            title: "Repeat Offender",
            location: "Mysuru"
        },

        {
            id: 3,
            level: "info",
            title: "New FIR Uploaded",
            location: "Tumakuru"
        }

    ],

    activities: [

        {
            id: 1,
            officer: "Inspector Raj",
            action: "Closed FIR #1023",
            time: "5 mins ago"
        },

        {
            id: 2,
            officer: "SI Kavya",
            action: "Added accused profile",
            time: "20 mins ago"
        }

    ],

    recentCases: [

        {
            id: "FIR-1021",
            district: "Bengaluru",
            type: "Theft",
            status: "Open"
        },

        {
            id: "FIR-1022",
            district: "Mysuru",
            type: "Cyber Crime",
            status: "Investigating"
        },

        {
            id: "FIR-1023",
            district: "Hubballi",
            type: "Robbery",
            status: "Closed"
        }

    ]

};