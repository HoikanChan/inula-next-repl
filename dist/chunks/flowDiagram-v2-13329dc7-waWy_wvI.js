import { p as parser$1, f as flowDb } from './flowDb-c1833063-QGRMt3SY.js';
import { f as flowRendererV2, g as flowStyles } from './styles-483fbfea-mqyMW7p8.js';
import { u as setConfig } from './main-fUffXrGM.js';
import './graph-HSXfXZbN.js';
import './layout-NFd5fmMO.js';

const diagram = {
  parser: parser$1,
  db: flowDb,
  renderer: flowRendererV2,
  styles: flowStyles,
  init: (cnf) => {
    if (!cnf.flowchart) {
      cnf.flowchart = {};
    }
    cnf.flowchart.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
    setConfig({ flowchart: { arrowMarkerAbsolute: cnf.arrowMarkerAbsolute } });
    flowRendererV2.setConf(cnf.flowchart);
    flowDb.clear();
    flowDb.setGen("gen-2");
  }
};

export { diagram };
