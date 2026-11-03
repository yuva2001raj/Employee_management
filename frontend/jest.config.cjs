
module.exports = {
    testEnvironment: 'jsdom',

    transform: {
        '^.+\\.[jt]sx?$':'babel-jest',
    },
    setupFiles: ['<rootDir>/src/setupTests.js'],

    setupFilesAfterEnv : ['<rootDir>/src/setupAfterEnv.js'],

    moduleNameMapper: {
        '\\.(css|less|scss|sass)$': '<rootDir>/src/testStyleMock.cjs',

    } ,

    testMatch: ['**/?(*.)+(test|spec).[jt]s?(x)']
}