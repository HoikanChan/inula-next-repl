import { p as parser$1, f as flowDb } from "./flowDb-c1833063-tRbGUhmP.js";
import { f as flowRendererV2, g as flowStyles } from "./styles-483fbfea-hSVykeJC.js";
import { x as setConfig } from "./index-VqpbiXIV.js";
import "./graph-kSx5wv5Y.js";
import "./layout-02jRIFTw.js";
import "./index-01f381cb-O8TjSLmU.js";
import "./clone-iSj9GrE6.js";
import "./edges-066a5561-xhsRYYkR.js";
import "./createText-ca0c5216-tvSBH_xp.js";
import "./line-VBoyUx48.js";
import "./array-7YoLFSEf.js";
import "./path-uVd5yEuS.js";
import "./channel-yzeYa2n1.js";
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
