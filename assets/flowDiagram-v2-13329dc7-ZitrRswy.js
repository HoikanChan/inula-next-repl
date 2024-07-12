import { p as parser$1, f as flowDb } from "./flowDb-c1833063-XAy3jgUa.js";
import { f as flowRendererV2, g as flowStyles } from "./styles-483fbfea-ri4cZQHU.js";
import { x as setConfig } from "./index-13TtyAaB.js";
import "./graph-qsK-D2Cc.js";
import "./layout-hgHH5irx.js";
import "./index-01f381cb-oEGWLv_E.js";
import "./clone-L_xDcbmd.js";
import "./edges-066a5561-Ahjjg4aV.js";
import "./createText-ca0c5216-TFi_zmbo.js";
import "./line-sRHiBAwI.js";
import "./array-7YoLFSEf.js";
import "./path-uVd5yEuS.js";
import "./channel-2MnxMe_e.js";
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
