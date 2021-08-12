import { Component, Input, SimpleChange, OnChanges, AfterViewInit
  , ViewChild, ChangeDetectorRef } from '@angular/core';
import { Label, BaseChartDirective } from 'ng2-charts';
import { ChartOptions, ChartTooltipItem, ChartDataSets } from 'chart.js';
import { AssessmentWithDeliveryData, CourseReference, getAbbrevCode } from '@equality/data';
import { backGroundPlugin } from '../custom-chart-plugins';
import { CourseForFilter } from '../../../../shared/store/dashboard.state';
import * as Chart from 'chart.js';

interface ChartOptionsCustom extends ChartOptions {
  chartArea: Background;
}
interface Background {
  backgroundColor: string;
}

@Component({
  selector: 'equality-success-percentage',
  templateUrl: './success-percentage.component.html',
  styleUrls: ['./success-percentage.component.css']
})
export class SuccessPercentageComponent implements OnChanges, AfterViewInit {
  @ViewChild(BaseChartDirective, { static: false }) chart: BaseChartDirective;
  @Input()
  public assessments: AssessmentWithDeliveryData[];
  @Input()
  public courses: CourseForFilter[];
  @Input()
  public isExamencommissie: boolean;
  public labels: Label[] = [];
  public datasets: ChartDataSets[];
  public chartPlugins = [backGroundPlugin];

  public options: ChartOptionsCustom = {
    animation: {
      duration: 0
    },
    responsive: true,
    maintainAspectRatio: false,
    title: {
      display: true,
      text: 'Slagingspercentage'
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
        title: (tooltipItems: ChartTooltipItem[], data) => {
          if (tooltipItems.length > 0) {
            const matchedAssessment: AssessmentWithDeliveryData =
              (this.datasets[tooltipItems[0].datasetIndex] as any).assessments[tooltipItems[0].index];
            if (matchedAssessment && matchedAssessment.deliveryData) {
              return `${getAbbrevCode(matchedAssessment.courseCode)} - ${matchedAssessment.title} `;
            }
          }
          return '';
        },
        label: (tooltipItem: ChartTooltipItem, _) => {
          const matchedAssessment = (this.datasets[tooltipItem.datasetIndex] as any).assessments[tooltipItem.index];
          if (matchedAssessment && matchedAssessment.deliveryData &&
            matchedAssessment.deliveryData.percentagePassed && !!matchedAssessment.deliveryData.percentagePassed.value) {
            return ['',
              `Slagingspercentage: ${matchedAssessment.deliveryData.percentagePassed.value}%`,
              `Cesuur: 5.5`]
              ;
          }
          return '';
        }
      }
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
          max: 100,
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
    }
  };
  chartArea: Chart.ChartArea;
  constructor(private ref: ChangeDetectorRef) { }

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

  ngOnChanges(changes: { [propName: string]: SimpleChange }) {
    this.getData();
  }

  trackByCourse(index: number, item: CourseReference) {
    return item ? item.code : index;
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
            assessment && assessment.deliveryData &&
              assessment.deliveryData.percentagePassed &&
              !!assessment.deliveryData.percentagePassed.value &&
              assessment.deliveryData.percentagePassed.applicable
              ? assessment.deliveryData.percentagePassed.value : 0;
          return { assessmentDataPoint, assessment };
        });
      });
      this.datasets = dataCollections.map(data => ({
        label: '',
        backgroundColor: 'rgb(97,107,126, 1)',
        hoverBackgroundColor: 'rgb(97,107,126, 1)',
        borderColor: 'white',
        borderWidth: 0,
        data: data.map(d => d.assessmentDataPoint),
        assessments: data.map(d => d.assessment),
      }));
    }

  }
}
