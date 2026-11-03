
module.exports = {
    testEnvironment: 'jsdom',

    transform: {
        '^.+\\.[jt]sx?$':'babel-jest',
    },

    setupFilesAfterEnv : ['<rootDir>/src/setupTests.js'],

    moduleNameMapper: {
        '\\.(css|less|scss|sass)$': '<rootDir>/src/testStyleMock.cjs',

    } ,

    testMatch: ['**/?(*.)+(test|spec).[jt]s?(x)']
}