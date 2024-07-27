import { p as parser$1, f as flowDb } from "./flowDb-c1833063--zf7m11F.js";
import { f as flowRendererV2, g as flowStyles } from "./styles-483fbfea-NCn9q11Z.js";
import { x as setConfig } from "./index-yZ-NgXOT.js";
import "./graph-F_TFqio3.js";
import "./layout-zsKCM2ct.js";
import "./index-01f381cb-gH2XPPke.js";
import "./clone-v0CIvztX.js";
import "./edges-066a5561-KHUh4hY8.js";
import "./createText-ca0c5216-b737CNfZ.js";
import "./line-vJovbdb-.js";
import "./array-7YoLFSEf.js";
import "./path-uVd5yEuS.js";
import "./channel-WCZjOugn.js";
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
export {
  diagram
};
