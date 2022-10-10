

const cleared = true;
const timeout = setTimeout((x) => {
  console.log('hello');
}, 3000);

if(cleared) {
  clearTimeout(timeout);
}
