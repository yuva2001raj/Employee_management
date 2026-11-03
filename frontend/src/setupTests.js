
import { TextDecoder, TextEncoder } from 'util';

globalThis.TextEncoder = TextEncoder
globalThis.TextDecoder = TextDecoder
    // Mock browser scrolling because Jest's does not implement it.
window.scrollTo = () => { };

