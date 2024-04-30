import { ScaleService } from '../../services/scale.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Share } from '@capacitor/share';
import { ECharts, EChartsOption } from 'echarts';
import { BodyData, initialBodyData } from 'src/app/models/Scale';


@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit, OnDestroy {
  dataHistory: Array<BodyData> = [
    { ...initialBodyData, weight: 110.00, date: new Date(2023, 2, 26)  },
    { ...initialBodyData, weight: 109.00, date: new Date(2023, 2, 25)  },
    { ...initialBodyData, weight: 108.00, date: new Date(2023, 2, 24)  },
    { ...initialBodyData, weight: 107.00, date: new Date(2023, 2, 23)  },
    { ...initialBodyData, weight: 106.00, date: new Date(2023, 2, 22)  },
    { ...initialBodyData, weight: 105.00, date: new Date(2023, 2, 21)  },
    { ...initialBodyData, weight: 104.00, date: new Date(2023, 2, 20)  },
    { ...initialBodyData, weight: 103.00, date: new Date(2023, 2, 19)  },
    { ...initialBodyData, weight: 102.00, date: new Date(2023, 2, 18)  },
    { ...initialBodyData, weight: 101.00, date: new Date(2023, 2, 17)  },
    { ...initialBodyData, weight: 100.00, date: new Date(2023, 2, 16)  },
  ];
  chartData: EChartsOption = {};
  chartInstance?: ECharts;
  dataSaved: boolean = true;
  statusScan: number = -1;
  private interval: number = 0;
  bodyData: BodyData = { ...initialBodyData };
  chartOption: EChartsOption = {};

  constructor(private scale: ScaleService) { }

  onChartInit(e:any)
  {
    this.chartInstance = e;
  }

  ngOnInit(): void {
    this.chartOption = {
      dataZoom: [
        {
          moveHandleSize: 5,
        },
      ],
      tooltip: {
        type: "time",
        triggerOn: "none",
      },
      xAxis: {
        type: "time",
        axisPointer: {
          status: "hide",
          snap: true,
          label: {
            show: false,
          },
          lineStyle: {
            color: '#E10600',
            type: 'solid',
            width: 2,
          },
          handle: {
            show: true,
            size: 30,
            color: "#E10600",
            shadowBlur: 1,
            icon: "path://M 28.678,5.798L14.713,23.499c-0.16,0.201-0.495,0.201-0.658,0L0.088,5.798C-0.009,5.669-0.027,5.501,0.04,5.353    C0.111,5.209,0.26,5.12,0.414,5.12H28.35c0.16,0,0.31,0.089,0.378,0.233C28.798,5.501,28.776,5.669,28.678,5.798 z",
            margin: -175,
          }
        },
      },
      yAxis: {
        type: 'value',
        tooltip: {
          show: false,
        }
      },
      series: [
        {
          name: 'Weight',
          type: 'line',
          data: this.dataHistory.map((element) => [element.date, element.weight]),
          symbol: "circle",
          symbolSize: 10,
          itemStyle: {
            color: "#000000"
          }
        }
      ]
    };
    this.scale.initBLE();
    this.start();
  }

  private updateChart() {
    this.chartData = {series: [{data: this.dataHistory.map((element) => [element.date, element.weight])}]}
  }

  ngOnDestroy(): void {
    this.stop()
  }

  async start() {
    this.scale.searchDevice(1, 170, 19);
    this.interval = setInterval(
      () => {
        this.bodyData = this.scale.getBodyData();
        this.statusScan = this.scale.getStatus();
        if (this.statusScan === 0 && !this.dataSaved) {
          this.dataSaved = true;
          this.dataHistory.unshift(this.bodyData);
          this.updateChart();

        }
        if (this.statusScan === 1)
          this.dataSaved = false;
      },
      50
    ) as unknown as number
  }

  async stop() {
    clearInterval(this.interval)
    await this.scale.stopSearch();
  }

  async share() {
    console.log('share!')
    await Share.share({
      title: 'Title',
      text: 'Text',
      url: 'url',
      // dialogTitle: 'Share with buddies',
    });
  }
}
function style(arg0: { height: string; opacity: number; backgroundColor: string; }): any {
  throw new Error('Function not implemented.');
}

function state(arg0: string, arg1: any): any {
  throw new Error('Function not implemented.');
}

