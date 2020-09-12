function init(){
  const submit = document.getElementById('submit');
  const result = document.getElementById('result');

  submit.addEventListener('click', () => {
    const readbleStream = new ReadableStream({
      start(controller) {
        controller.enqueue('get ready for incoming request!\n');
        const interval = setInterval(() => {
          controller.enqueue('chunk\n')
        }, 500);
        setTimeout(() => {
          controller.enqueue('request complete!');
          clearInterval(interval);
          controller.close();
        }, 5000)
      }
    })
    fetch('/retrieve').then(async res => {
      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      while(true) {
        const {value, done} = await reader.read();
        if(done) break;
        result.append(value);
      }
    })
    fetch('/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream'
      },
      body: readbleStream.pipeThrough(new TextEncoderStream())
    }).then(() => console.log('request stream has been closed'));
  })
}
init();