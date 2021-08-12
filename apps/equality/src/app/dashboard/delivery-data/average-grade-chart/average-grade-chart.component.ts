
import { Component, Input, OnChanges, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { IErrorBars } from 'chartjs-plugin-error-bars';
import * as pluginErrorBars from 'chartjs-plugin-error-bars';
import { Label, BaseChartDirective } from 'ng2-charts';
import { ChartOptions, ChartArea, ChartTooltipItem } from 'chart.js';
import { AssessmentWithDeliveryData, CourseReference, getAbbrevCode } from '@equality/data';
import { backGroundPlugin } from '../custom-chart-plugins';
import { CourseForFilter } from '../../../../shared/store/dashboard.state';
import { ChartDataSets } from 'chart.js';

interface ChartDataSetsCustom extends ChartDataSets {
  errorBars: IErrorBars;
}

interface ChartOptionsCustom extends ChartOptions {
  chartArea: Background;
}
interface Background {
  backgroundColor: string;
}

@Component({
  selector: 'equality-average-grade-chart',
  templateUrl: './average-grade-chart.component.html',
  styleUrls: ['./average-grade-chart.component.css']
})
export class AverageGradeChartComponent implements OnChanges, AfterViewInit {
  @Input()
  public assessments: AssessmentWithDeliveryData[];
  @Input()
  public courses: CourseForFilter[];
  @Input()
  public isExamencommissie: boolean;
  @ViewChild(BaseChartDirective, { static: false }) chart: BaseChartDirective;
  public labels: Label[] = [];
  public datasets: ChartDataSetsCustom[];
  public chartPlugins = [pluginErrorBars, backGroundPlugin];

  public options: ChartOptionsCustom = {
    animation: {
      duration: 0
    },
    responsive: true,
    maintainAspectRatio: false,
    title: {
      display: true,
      text: 'Gemiddeld cijfer'
    },
    chartArea: {
      backgroundColor: '#ffffff'
    },
    tooltips: {
      custom: (tooltip) => {
        if (!tooltip) {
          return;
        }
        // disable displaying the color box;
        tooltip.displayColors = false;
      },
      callbacks: {
        title: (tooltipItems: ChartTooltipItem[]) => {
          if (tooltipItems.length > 0) {
            const matchedAssessment: AssessmentWithDeliveryData =
              (this.datasets[tooltipItems[0].datasetIndex || 0] as any).assessments[tooltipItems[0].index || 0];
            if (matchedAssessment && matchedAssessment.deliveryData) {
              return `${getAbbrevCode(matchedAssessment.courseCode)} - ${matchedAssessment.title} `;
            }
          }
          return '';
        },
        label: (tooltipItem: ChartTooltipItem, _) => {
          const matchedAssessment = (this.datasets[tooltipItem.datasetIndex || 0] as any).assessments[tooltipItem.index || 0];
          if (matchedAssessment && matchedAssessment.deliveryData && matchedAssessment.deliveryData.average) {
            return ['',
              `Gemiddeld cijfer: ${matchedAssessment.deliveryData.average.value}`,
              `Standaarddeviatie: ${matchedAssessment.deliveryData.standardDeviation ?
                matchedAssessment.deliveryData.standardDeviation.value : '?'}`
            ]
              ;
          }
          return '';
        }
      },
    },
    legend: {
      display: false
    },
    elements: {
      point: {
        pointStyle: 'circle'
      }
    },
    scales: {
      xAxes: [{
        ticks: {
          display: false
        }
      }],
      yAxes: [{
        ticks: {
          max: 10,
          min: 0
        }
      }, {
        type: 'linear',
        position: 'right',
        ticks: {
          fontColor: 'transparent',
          callback: (value, index, values) => 'onnacceptabel',
        }
      }]
    }, plugins: {
      chartJsPluginErrorBars: {
        color: '#666',
      }
    }
  };
  chartArea: ChartArea;

  constructor(private ref: ChangeDetectorRef) { }

  trackByCourse(index: number, item: CourseReference) {
    return item ? item.code : index;
  }

  ngOnChanges() {
    this.getData();
  }


  ngAfterViewInit(): void {
    // gets chartArea until it has a width. Otherwise labels doent match bar column
    let width = 0;
    while (width === 0) {
      const chartArea = this.chart.chart.chartArea;
      if (chartArea) {
        width = chartArea.right - chartArea.left;
        this.chartArea = this.chart.chart.chartArea;
        this.ref.detectChanges();
      }
    }
  }

  private getData() {
    if (this.assessments) {
      const uniqueCourses = this.courses.map(c => c.code);
      this.labels = uniqueCourses.map(c => getAbbrevCode(c));
      const dataCollections = Array(5).fill(null).map((_, index) => {
        return uniqueCourses.map(course => {
          const assessment = this.assessments
            .filter(a => a.courseCode === course)
            .find(a => a.sequenceNumber === index);
          const assessmentDataPoint =
            assessment && assessment.deliveryData && assessment.deliveryData.average &&
              !!assessment.deliveryData.average.value &&
              assessment.deliveryData.average.applicable
              ? assessment.deliveryData.average.value : 0;
          const std = assessment && assessment.deliveryData &&
            !!assessment.deliveryData.standardDeviation && !!assessment.deliveryData.average &&
            !!assessment.deliveryData.standardDeviation.value && !!assessment.deliveryData.average.value ?
            assessment.deliveryData.standardDeviation.value : -1;
          const errorBar = std !== -1 ? {
            code: getAbbrevCode(course),
            plus: std,
            min: -std
          } : null;
          return { assessmentDataPoint, errorBar, assessment };
        });
      });
      this.datasets = dataCollections.map(data => {
        const errorBars: IErrorBars = {};
        data.map(d => d.errorBar).filter(errorBar => !!errorBar)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .forEach((field: any) => {
            errorBars[field.code] = { plus: field.plus, minus: field.min };
          });
        return ({
          label: '',
          hoverBackgroundColor: '#FFCD00',
          backgroundColor: '#FFCD00',
          borderColor: 'white',
          borderWidth: 0,
          data: data.map(d => d.assessmentDataPoint),
          errorBars,
          assessments: data.map(d => d.assessment)
        });
      });
    }
  }
}
