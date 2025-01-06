import { aK as _, aL as Color } from './index-wmEIslPP.js';

/* IMPORT */
/* MAIN */
const channel = (color, channel) => {
    return _.lang.round(Color.parse(color)[channel]);
};
/* EXPORT */
const channel$1 = channel;

export { channel$1 as c };
