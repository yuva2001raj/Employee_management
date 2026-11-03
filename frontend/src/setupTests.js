import '@testing-library/jest-dom';


// Mock browser scrolling because Jest's does not implement it.
window.scrollTo = () => {}