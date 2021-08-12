


export const backGroundPlugin = {
    // eslint-disable-next-line
    beforeDraw: function(chart: any, easing: any) {
        if (chart.config.options.chartArea && chart.config.options.chartArea.backgroundColor) {
            const ctx = chart.chart.ctx;
            const chartArea = chart.chartArea;

            ctx.save();
            ctx.fillStyle = chart.config.options.chartArea.backgroundColor;
            ctx.fillRect(chartArea.left, chartArea.top, chartArea.right - chartArea.left, chartArea.bottom - chartArea.top);
            ctx.restore();
        }
    }
};
