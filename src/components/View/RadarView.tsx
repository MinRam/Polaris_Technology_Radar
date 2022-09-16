import RadarChart from '../Chart/RadarChart';
import data from '../../RadarDataTemplate.json'

/* const define */
const viewName = 'polaris-radar-view';
/* -----------  */

export default function RadarView() {
  return (
    <div id={viewName}>
        <RadarChart data={data}/>
    </div>
  )
}
