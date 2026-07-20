import axios from "axios";
import { dashboardMock } from "./dashboard.mock";

const USE_MOCK = true;

const api = axios.create({

    baseURL: "http://localhost:9000/api",

    timeout: 10000

});

export async function getDashboardData() {

    if (USE_MOCK) {

        return dashboardMock;

    }

    const { data } = await api.get("/dashboard");

    return data;

}

export async function refreshDashboard() {

    if (USE_MOCK) {

        return dashboardMock;

    }

    const { data } = await api.get("/dashboard/refresh");

    return data;

}