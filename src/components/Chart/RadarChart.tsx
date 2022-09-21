import React from "react";
import * as d3 from 'd3';
import './RadarChart.css';

/* const define */
const svgId = 'radar-chart-svg';
const width = 954;
const outerRadius = width / 2;
const innerRadius = outerRadius - 170;
/* ------------ */
interface ElementInterface {
  id: string;
  name: string;
  stage: string;
  dimension: string;
  position: {
    radius : number;
    angle  : number;
  }
}

interface DimensionInterface {
  id: string;
  name: string;
  position: {
    radius: number;   // dimension radius.
    angle : number;   // dimension angle.
  }
}

interface StageInterface {
  id: string;
  name: string;
  level: number;
  ring: {
    ringRadius: number; // ring radius.
    nodeRadius: number; // node radius.
  }
}


class RadarChart extends React.Component<any> {
    // radar elements.
    elements: Array<ElementInterface>;
    // scale size. default: 1.
    scale: number;
    // dimensions description Map.
    dimensions: Map<string, DimensionInterface>;
    // stages description.
    stages: Map<string, StageInterface>;

    constructor(props : any) {
      super(props);

      this.elements = props.data.elements.sort(
        (a: ElementInterface,b:ElementInterface) =>{
            return a.dimension === b.dimension ?
                      a.stage.localeCompare(b.stage) :
                      a.dimension.localeCompare(b.dimension);
        });

      this.dimensions = new Map<string, DimensionInterface>(
        props.data["radar-data"].dimensions.map( (d: DimensionInterface) => [d.id, d])
      );

      this.stages = new Map<string, StageInterface>(
        props.data['radar-data'].stages.map( (d:StageInterface) => [d.id, d])
      );

      this.scale = 1;
    }

    setRadius() {
      /* ---- set Radius for stages ---- */
      const stageRadiusUnit = this.scale * innerRadius / (this.stages.size + 1);
      var radius = stageRadiusUnit;
      Array
        .from(this.stages.values())
        .sort((a,b) => a.level - b.level)
        .forEach( stage => {
          radius += stageRadiusUnit;
          // stage ring radius. 
          stage.ring = {
            ringRadius: radius,
            nodeRadius: radius - (stageRadiusUnit/2)
          };
        })
      /* ------------------------------- */

      /* ---- set position for elements ---- */
      var dimensionScale = 1.5;
      var angleUnit = 360 / (this.elements.length + dimensionScale * this.dimensions.size);

      var initAngle = -90;

      var groups = d3.group(this.elements, d => d.dimension);
      groups.forEach((elements:ElementInterface[], dimension:string) =>{
        initAngle += dimensionScale * angleUnit;
        // insert dimension
        this.dimensions.get(dimension)!.position = {
          radius : innerRadius * this.scale + 10,
          angle: initAngle
        };
        
        elements.forEach((element)=> {
          initAngle += angleUnit;
          element.position = {
            radius : this.stages.get(element.stage)!.ring.nodeRadius,
            angle: initAngle
          };
        })
      })
      /* ----------------------------------- */
    }

    componentDidMount() {
        /* ==== init data ==== */
        this.setRadius();
        /* ------------------- */

        /* ==== Render ==== */
        const svg = d3.select(`#${svgId}`)
        .attr("viewBox", [-outerRadius, -outerRadius, width, width])
        .attr("font-family", "sans-serif")
        .attr("font-size", 10);

        // clean child nodes of svg node.
        svg.selectAll("*").remove();

        /* == render entity == */
        const entityBox = svg.append("g")
          .attr("radar-entity-group", '')
          .selectAll('g')
          .data(this.elements)
          .enter()
          .append("g")
          .attr('entity-box', '');
        const entityBubble = entityBox.append("g")
          .attr('entity-bubble', '')
          .attr('transform', (d:ElementInterface) =>
            `rotate(${d.position.angle}) translate(${d.position.radius}, 3.5) rotate(${-d.position.angle})`);
        entityBubble.append("circle")
          .attr('radar-entity-circle', '')
          .attr('r', 7)
          .attr('fill', '#98BB00')
          .attr('stroke', '#fff')
          .attr('width', .7)
        /* ------------------- */

        /* == render radar label == */
        const labelGroup = svg.append("g")
          .attr("radar-label-group", '')
          .selectAll("g")
          .data(this.elements)
          .enter()
          .append("g")
          .attr('label-box', '');
        labelGroup.append("g")
          .attr("radar-label-line", '')
          .append('line')
          .style('stroke', '#1EBD00')
          .style('stroke-width', 1)
          .attr('stroke-dasharray',2) 
          .attr('transform', (label: ElementInterface) => `rotate(${label.position.angle})`)
          .attr('x1', (label: ElementInterface) => label.position.radius + 7)
          .attr('x2', innerRadius * this.scale + 5)
          .attr('y1', 3.5)
          .attr('y2', (label: ElementInterface) => (label.position.angle > 90 ? 3.5 : -3.5));
        const labelBox = labelGroup
          .append("g")
          .attr('radar-label-box', '')
          .attr("transform", 
            (d:ElementInterface) => 
              `rotate(${d.position.angle}) translate(${innerRadius + 25}, 0) ${d.position.angle > 90 ? 'rotate(180)' : ''}`
          );
        labelBox
          .append('text')
          .attr('radar-text', '')
          .attr('fill', '#4f7196')
          .attr('font-weight', '400')
          .attr('style', 'opacity: 1; transition: opacity 200ms ease 0s;')
          .attr("text-anchor", (d:ElementInterface) => d.position.angle > 90 ? 'end':'start')
          .text((d:ElementInterface)=> d.name);
        labelBox
          .append('rect')
          .attr('radar-rect', '')
          .attr('height', 1.5)
          .attr('width', 6)
          .attr('transform', 
            (d:ElementInterface) => 
              `translate(${d.position.angle > 90 ? 2: -8}, -3.5)`)
          .attr('fill', '#1EBD00')
          .attr("style", 'display: inline; opacity: 1; transition: transform 1000ms ease 0s, opacity 1000ms ease 0s;');
        /* ------------------------ */

        /* == render segments == */
        const segmentGroup = svg
          .append("g")
          .attr("radar-segment-group", '')
          .selectAll('g')
          .data(Array.from(this.dimensions.values()))
          .enter()
          .append('g')
          .attr('radar-segment', '')
          .attr('dimension', d => d.name)
          .attr('class', 'labels-line-mode');
        
        // segment-arc
        var arcPath = d3.arc()
        var sortDimension = Array
            .from(this.dimensions.values())
            .sort( (a, b) => a.position.angle - b.position.angle);
        var segmentAngleMap = new Map<string, number>(
          sortDimension.map( (dimension, index) => 
          {
            let nextAngle = sortDimension[(index + 1) % sortDimension.length].position.angle;
            if (nextAngle < dimension.position.angle) {
              nextAngle += 360
            }

            return [dimension.id, nextAngle];
          }) 
        );
        
        var lineWidth = 4;
        const lineAngle = 180 * lineWidth / (Math.PI*innerRadius * this.scale);
        segmentGroup
          .append('g')
          .attr('radar-segment-arc', '')
          .append('path')
          .attr('class', 'radar-segment-arc')
          .attr("d", (d: DimensionInterface) =>{
            return arcPath(
              {
                "startAngle": (d.position.angle + 90 + lineAngle) * Math.PI/ 180, 
                "endAngle": (segmentAngleMap.get(d.id)! + 90 - lineAngle) * Math.PI / 180,
                "innerRadius": innerRadius + 2,
                "outerRadius": innerRadius + 12
              })
          })
          .attr("stroke-width", 2)
          .attr("stroke", '#fff')
          .attr("fill", "rgb(224, 230, 235)")

        // segment-text
        const segmentTextBox = segmentGroup
          .append('g')
          .attr('radar-segment-text', '')
          .attr("transform", 
            (d:DimensionInterface) => 
              `rotate(${d.position.angle}) translate(${innerRadius + 30}, 0) ${d.position.angle > 90 ? 'rotate(180)' : ''}`
          );
        segmentTextBox
          .append('path')
          .attr("radar-point", '')
          .attr("fill", '#3e5f83')
          .attr("fill-opacity", '0.8')
          .attr("transform",
            (d: DimensionInterface) =>
              `rotate(${d.position.angle > 90 ? '-90':'90'})`)
          .attr("d", 'M 0 0 L 10 5 L 0 10 z');
        segmentTextBox  
          .append('text')
          .attr("radar-text", '')
          .attr("dy", ".31em")
          .attr("transform", 
            (d: DimensionInterface) => 
            `translate(${d.position.angle > 90 ? '-10':'10' }, 0)`)
          .attr("text-anchor", (d:DimensionInterface) => d.position.angle > 90 ? 'end':'start')
          .attr("fill", '#3e5f83')
          .attr("fill-opacity", "0.9")
          .attr("font-size" ,"16")
          .attr("font-weight","700")
          .text((d:DimensionInterface)=> d.name);
          
        // segment-line
        segmentGroup
            .append('g')
            .attr('radar-segment-line', '')
            .append('line')
            .attr('stroke-width', 2)
            .attr('stroke', '#dde6ee')
            .attr('x1', 0)
            .attr('y1', 0)
            .attr('x2', innerRadius + 12)
            .attr('y2', 0)
            .attr('transform', 
              (d : DimensionInterface) => 
              `rotate(${d.position.angle}) translate(0, 0)`)
            .attr('style', 'opacity: 1; transition: opacity 1000ms ease 0s, transform 1000ms ease 0s; pointer-events: none;');
        /* --------------------- */

        /* == render stage ring == */
        const ringGroup = svg
          .append("g")
          .attr("radar-ring-group", '')
          .attr("fill", 'none')
          .selectAll('g')
          .data(this.stages.values())
          .enter()
          .append('g')
          .attr('radar-ring', '');
        ringGroup
          .append('circle')
          .attr("id", (stage:StageInterface) => `radar-ring-${stage.id}`)
          .attr("stroke", "#000")
          .attr('stroke-width', 1)
          .attr("stroke-opacity", 0.5)
          .attr('fill-opacity', 1)
          .attr('fill', 'none')
          .attr('style','transition: opacity 300ms ease-in-out 0s; opacity: 1;')
          .attr('r',  (stage:StageInterface) => stage.ring.ringRadius)
        ringGroup
          .append('text')
          .attr('radar-ring-text', '')
          .attr('text-anchor', 'middle')
          .attr('fill', '#000')
          .attr('style', 'opacity: 1;')
          .attr('dy', (stage : StageInterface) => 15 - stage.ring.ringRadius)
          .text((stage: StageInterface) => stage.name);
        /* ----------------------- */
    }
  
    render() {
      return (
        <svg id="radar-chart-svg"></svg>
      );
    }
};

export default RadarChart;