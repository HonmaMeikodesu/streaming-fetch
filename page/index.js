function init(){
  const submit = document.getElementById('submit');
  const end = document.getElementById('end');
  const result = document.getElementById('result');
  // compatibility check
  const supportsRequestStreams = !new Request('', {
    body: new ReadableStream(),
    method: 'POST',
  }).headers.has('Content-Type');
  if (!supportsRequestStreams) {
    result.textContent = `It doesn't look like your browser supports request streams.`;
    return;
  }

  const readbleStream = new ReadableStream({
    start(controller) {
      setTimeout(() => {
        controller.enqueue('get ready for incoming request!\n');
      }, 1000);
      let func;
      submit.addEventListener('click', func = () => {
        controller.enqueue('chunk\n');
      })
      end.addEventListener('click', () => {
        submit.removeEventListener('click', func);
        controller.enqueue('request complete!');
        controller.close();
        submit.setAttribute('disabled', true);
      }, {once: true});
    }
  })
  fetch('/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream'
    },
    body: readbleStream.pipeThrough(new TextEncoderStream())
  }).then(() => console.log('request stream has been closed'));
  fetch('/retrieve').then(async res => {
    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
    while(true) {
      const {value, done} = await reader.read();
      if(done) break;
      result.append(value);
    }
  })
}
init();