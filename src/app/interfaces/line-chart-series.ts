export interface LineChartSeries {
    name: string;
    series: Kvp[];
}

interface Kvp {
    name: string;
    value: string;
}