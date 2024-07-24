import { p as parser$1, f as flowDb } from "./flowDb-c1833063-HuLeMNyp.js";
import { f as flowRendererV2, g as flowStyles } from "./styles-483fbfea-p2QKfBjb.js";
import { x as setConfig } from "./index-HIf_9Yjc.js";
import "./graph-vPR_Z4KA.js";
import "./layout-BiJFqk7w.js";
import "./index-01f381cb-g23CNIl3.js";
import "./clone-hENkxXDL.js";
import "./edges-066a5561-AEIVY8Tg.js";
import "./createText-ca0c5216-pVdBtChJ.js";
import "./line-0AxxTcnO.js";
import "./array-7YoLFSEf.js";
import "./path-uVd5yEuS.js";
import "./channel-XuppNhcn.js";
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
