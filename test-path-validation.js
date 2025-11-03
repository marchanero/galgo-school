// Test path validation
const pathRegex = /^\/[a-zA-Z0-9\-_.~!$&'()*+,;=:@%]*$/;
const testPaths = [
  '/h264Preview_01_main',
  '/Preview_01_main',
  '/stream',
  '/camera/preview',
  '/h264/preview'
];

console.log('Testing path regex validation:');
testPaths.forEach(path => {
  const result = pathRegex.test(path);
  console.log(`  ${path}: ${result ? '✓ PASS' : '✗ FAIL'}`);
});
