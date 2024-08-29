import { p as parser$1, f as flowDb } from "./flowDb-c1833063-xW2kMDib.js";
import { f as flowRendererV2, g as flowStyles } from "./styles-483fbfea-9-7G_uQk.js";
import { x as setConfig } from "./index-kA4tjDEJ.js";
import "./graph-Yf_Q2DZY.js";
import "./layout-fsTwy74u.js";
import "./index-01f381cb-1QPQGSoW.js";
import "./clone-y3ixgSyt.js";
import "./edges-066a5561-fBYsSX0X.js";
import "./createText-ca0c5216-udAl_3Xm.js";
import "./line-ev9yyyJ6.js";
import "./array-7YoLFSEf.js";
import "./path-uVd5yEuS.js";
import "./channel-6cMplP0f.js";
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
