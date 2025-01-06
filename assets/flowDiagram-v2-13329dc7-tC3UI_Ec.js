import { p as parser$1, f as flowDb } from './flowDb-c1833063-CDp-ozZp.js';
import { f as flowRendererV2, g as flowStyles } from './styles-483fbfea-MbfOd2ZX.js';
import { x as setConfig } from './index-wmEIslPP.js';
import './graph-t6GeSKD9.js';
import './layout-ID_W7I7a.js';
import './index-01f381cb-HaVsfjzD.js';
import './clone-xfQeOtRt.js';
import './edges-066a5561-mMNoQy9d.js';
import './createText-ca0c5216-4Ef6A8Lq.js';
import './line-jVbzHCzT.js';
import './array-BzZpbL2z.js';
import './path-I1yyCG-g.js';
import './channel-RdYAo0Vk.js';

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
