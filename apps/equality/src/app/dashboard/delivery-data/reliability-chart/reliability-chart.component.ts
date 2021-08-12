import { Component, OnChanges, Input, SimpleChange, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { Label, BaseChartDirective } from 'ng2-charts';
import { ChartOptions, ChartTooltipItem, ChartDataSets, ChartArea } from 'chart.js';
import { AssessmentWithDeliveryData, CourseReference, getAbbrevCode } from '@equality/data';
import { backGroundPlugin } from '../custom-chart-plugins';
import { CourseForFilter } from '../../../../shared/store/dashboard.state';


interface ChartOptionsCustom extends ChartOptions {
  chartArea: Background;
}
interface Background {
  backgroundColor: string;
}

@Component({
  selector: 'equality-reliability-chart',
  templateUrl: './reliability-chart.component.html',
  styleUrls: ['./reliability-chart.component.css']
})
export class ReliabilityChartComponent implements OnChanges, AfterViewInit {
  @Input()
  public assessments: AssessmentWithDeliveryData[];
  @Input()
  public courses: CourseForFilter[];
  @Input()
  public isExamencommissie: boolean;
  @ViewChild(BaseChartDirective, { static: false }) chart: BaseChartDirective;

  public labels: Label[] = [];
  public datasets: ChartDataSets[];

  private reliabilityLegend = ['excellent', 'goed', 'acceptabel', 'twijfelachtig', 'zwak', 'onnacceptabel'];
  public chartPlugins = [backGroundPlugin];
  public options: ChartOptionsCustom = {
    animation: {
      duration: 0
    },
    responsive: true,
    maintainAspectRatio: false,
    title: {
      display: true,
      text: 'Betrouwbaarheid (α)'
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
          if (matchedAssessment && matchedAssessment.deliveryData && matchedAssessment.deliveryData.alpha) {
            return ['',
              `Alpha: ${matchedAssessment.deliveryData.alpha.value}`,
              `Aantal studenten: ${matchedAssessment.deliveryData.studentCount ?
                matchedAssessment.deliveryData.studentCount.value : '?'}`,
              `Aantal vragen: ${matchedAssessment.deliveryData.itemCount ?
                matchedAssessment.deliveryData.itemCount.value : '?'}`]
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
          max: 1,
          min: 0
        }
      }, {
        gridLines: {
          drawBorder: false,
          color: ['#000000', '#000000', '#000000', '#000000', '#000000', '#000000']
        },
        id: 'B',
        type: 'linear',
        position: 'right',
        ticks: {
          labelOffset: 12,
          callback: (value, index, values) => this.reliabilityLegend[index],
        }
      }]
    }
  };
  chartArea: ChartArea;
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

  ngOnChanges() {
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
             assessment.deliveryData.alpha && !!assessment.deliveryData.alpha.value &&
              assessment.deliveryData.alpha.applicable
              ? assessment.deliveryData.alpha.value : 0;
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
        assessments: data.map(d => d.assessment)
      }));
    }
  }

}

